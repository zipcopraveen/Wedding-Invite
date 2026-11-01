/* ==========================================================================
   Guestbook service for the Sadhaasivam & Nithiya reception invitation.
   No dependencies: Node's own http module and a JSON file on disk.

   GET    /api/health
   GET    /api/guestbook?limit=30&before=<id>    newest first
   POST   /api/guestbook   { name, message, website }   website is a trap field
   GET    /api/guestbook/admin?key=ADMIN_KEY     everything, with hashed IPs
   DELETE /api/guestbook/<id>?key=ADMIN_KEY      remove a message

   Environment: PORT, DATA_DIR, ADMIN_KEY, IP_SALT, ALLOWED_ORIGINS
   Never put ADMIN_KEY or IP_SALT in code or in git.
   ========================================================================== */

"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "guestbook.json");
const ADMIN_KEY = process.env.ADMIN_KEY || "";
const IP_SALT = process.env.IP_SALT || "change-me";
const ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);

const MAX_NAME = 60;
const MAX_MESSAGE = 500;
const MAX_BODY = 4096;
const MAX_ENTRIES = 5000;
const PER_IP_PER_DAY = 6;     // a backstop only: shared Wi-Fi means many real guests can share one address
const BURST_MS = 8000;        // minimum gap between two posts from one address
const PAGE_MAX = 50;

fs.mkdirSync(DATA_DIR, { recursive: true });
let db = { nextId: 1, entries: [] };
try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { /* first run */ }

let writing = Promise.resolve();
function save() {
  writing = writing
    .then(() => fs.promises.writeFile(FILE + ".tmp", JSON.stringify(db)))
    .then(() => fs.promises.rename(FILE + ".tmp", FILE))
    .catch((e) => console.error("save failed:", e.message));
  return writing;
}

const lastPost = new Map();
const hashIp = (ip) => crypto.createHash("sha256").update(IP_SALT + "|" + ip).digest("hex").slice(0, 24);
const clientIp = (req) => {
  // The service is only reachable through nginx, which sets this header.
  const xf = req.headers["x-forwarded-for"];
  return (xf ? String(xf).split(",")[0].trim() : req.socket.remoteAddress) || "unknown";
};

function send(req, res, status, body) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  };
  const origin = req.headers.origin;
  if (origin && ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS";
  }
  res.writeHead(status, headers);
  res.end(body === undefined ? "" : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY * 64) { req.destroy(); return; }   // someone is flooding us: drop the connection
      if (size > MAX_BODY) { tooLarge = true; return; }       // keep reading so we can answer properly
      chunks.push(c);
    });
    req.on("end", () => (tooLarge ? reject(new Error("too_large")) : resolve(Buffer.concat(chunks).toString("utf8"))));
    req.on("error", reject);
  });
}

const len = (s) => [...s].length;
const cleanName = (s) => String(s).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
const cleanMessage = (s) => String(s)
  .replace(/\r\n?/g, "\n")
  .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
  .replace(/[ \t]+\n/g, "\n")
  .replace(/\n{3,}/g, "\n\n")
  .trim();
const hasLink = (s) => /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|in|co|xyz|ru|link|top)\b)/i.test(s);
const publicEntry = (e) => ({ id: e.id, name: e.name, message: e.message, createdAt: e.createdAt });

function adminOk(url) {
  const key = url.searchParams.get("key") || "";
  if (!ADMIN_KEY || !key) return false;
  const a = Buffer.from(key), b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const route = url.pathname.replace(/\/+$/, "");

    if (req.method === "OPTIONS") return send(req, res, 204);
    if (route === "/api/health") return send(req, res, 200, { ok: true });

    if (route === "/api/guestbook" && req.method === "GET") {
      const limit = Math.min(PAGE_MAX, Math.max(1, Number(url.searchParams.get("limit")) || 30));
      const before = Number(url.searchParams.get("before")) || Infinity;
      const rows = db.entries.filter((e) => e.id < before).sort((a, b) => b.id - a.id);
      return send(req, res, 200, {
        entries: rows.slice(0, limit).map(publicEntry),
        hasMore: rows.length > limit,
        total: db.entries.length
      });
    }

    if (route === "/api/guestbook" && req.method === "POST") {
      let body;
      try { body = JSON.parse(await readBody(req)); } catch (e) { return send(req, res, e.message === "too_large" ? 413 : 400, { error: e.message === "too_large" ? "too_large" : "bad_request" }); }
      if (!body || typeof body !== "object") return send(req, res, 400, { error: "bad_request" });

      // trap field: real guests never see it. Pretend it worked.
      if (typeof body.website === "string" && body.website.trim() !== "") {
        return send(req, res, 201, { entry: { id: 0, name: "", message: "", createdAt: new Date().toISOString() } });
      }

      const name = cleanName(body.name || "");
      const message = cleanMessage(body.message || "");
      if (!name) return send(req, res, 422, { error: "name_required" });
      if (!message) return send(req, res, 422, { error: "message_required" });
      if (len(name) > MAX_NAME || len(message) > MAX_MESSAGE) return send(req, res, 422, { error: "too_long" });
      if (hasLink(name) || hasLink(message)) return send(req, res, 422, { error: "links" });

      const ipH = hashIp(clientIp(req));
      const now = Date.now();
      if (now - (lastPost.get(ipH) || 0) < BURST_MS) return send(req, res, 429, { error: "rate_limited" });
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const recent = db.entries.filter((e) => e.ipHash === ipH && Date.parse(e.createdAt) > dayAgo).length;
      if (recent >= PER_IP_PER_DAY) return send(req, res, 429, { error: "rate_limited" });
      lastPost.set(ipH, now);

      const entry = { id: db.nextId++, name, message, createdAt: new Date(now).toISOString(), ipHash: ipH };
      db.entries.push(entry);
      if (db.entries.length > MAX_ENTRIES) db.entries.splice(0, db.entries.length - MAX_ENTRIES);
      await save();
      return send(req, res, 201, { entry: publicEntry(entry) });
    }

    if (route === "/api/guestbook/admin" && req.method === "GET") {
      if (!adminOk(url)) return send(req, res, 404, { error: "not_found" });
      return send(req, res, 200, { entries: db.entries.slice().sort((a, b) => b.id - a.id) });
    }

    const del = route.match(/^\/api\/guestbook\/(\d+)$/);
    if (del && req.method === "DELETE") {
      if (!adminOk(url)) return send(req, res, 404, { error: "not_found" });
      const id = Number(del[1]);
      const before = db.entries.length;
      db.entries = db.entries.filter((e) => e.id !== id);
      await save();
      return send(req, res, 200, { removed: before - db.entries.length });
    }

    return send(req, res, 404, { error: "not_found" });
  } catch (e) {
    console.error(e);
    return send(req, res, 500, { error: "server_error" });
  }
});

server.listen(PORT, () => console.log(`guestbook service on :${PORT}, data in ${DATA_DIR}`));
