/* ==========================================================================
   guestbook.js  |  guest messages
   - Messages are read from and posted to the guestbook service
     (config.js: guestbook.api). Everyone who opens the invitation sees them.
   - If the service cannot be reached (for example while testing in Live
     Server) the guestbook runs in preview mode: messages are kept on this
     device only, and a note says so.
   - Everything from the server or the guest is written with textContent,
     never as HTML.
   ========================================================================== */

(function () {
  "use strict";
  const cfg = (window.WEDDING && window.WEDDING.guestbook) || {};
  const root = document.getElementById("guestbook");
  if (!root) return;
  if (!cfg.enabled) { root.hidden = true; return; }

  const form = document.getElementById("gb-form");
  const nameEl = document.getElementById("gb-name");
  const msgEl = document.getElementById("gb-message");
  const hpEl = form.querySelector(".gb-hp");
  const countEl = document.getElementById("gb-count");
  const statusEl = document.getElementById("gb-status");
  const sendBtn = document.getElementById("gb-send");
  const suggestBtn = document.getElementById("gb-suggest");
  const listEl = document.getElementById("gb-list");
  const noteEl = document.getElementById("gb-note");
  const moreBtn = document.getElementById("gb-more");

  const MAX_MSG = 500;
  const API = cfg.api || "/api/guestbook";
  const LOCAL_KEY = "wedding-guestbook-local";
  const NAME_KEY = "wedding-guestbook-name";
  const WISHES = [
    "Wishing you a lifetime of love, laughter and good health together.",
    "May your home always be full of warmth, and your hearts full of joy.",
    "Congratulations to you both. Thank you for letting us share this evening with you.",
    "May every year together be happier than the last.",
    "Wishing you strength in the hard days and joy in every ordinary one.",
    "Here is to a beautiful beginning. God bless you both."
  ];

  let mode = "checking";          // "api" | "local"
  let entries = [];               // newest first
  let hasMore = false;
  let pollTimer = null;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  const fmt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true
  });

  /* Rendering -------------------------------------------------------------------- */
  function entryEl(e, isNew) {
    const art = document.createElement("article");
    art.className = "gb-entry" + (isNew ? " is-new" : "");
    const head = document.createElement("div");
    head.className = "gb-entry__head";
    const name = document.createElement("span");
    name.className = "gb-entry__name";
    name.textContent = e.name;
    const time = document.createElement("time");
    time.className = "gb-entry__time";
    const d = new Date(e.createdAt);
    time.dateTime = d.toISOString();
    time.textContent = fmt.format(d);
    head.append(name, time);
    const p = document.createElement("p");
    p.className = "gb-entry__text";
    p.textContent = e.message;
    art.append(head, p);
    return art;
  }

  function renderAll() {
    listEl.replaceChildren();
    if (!entries.length) {
      const p = document.createElement("p");
      p.className = "gb-empty";
      p.textContent = mode === "checking" ? "Loading messages." : "No messages yet. Be the first to leave one.";
      listEl.appendChild(p);
    } else {
      entries.forEach((e) => listEl.appendChild(entryEl(e, false)));
    }
    moreBtn.hidden = !(mode === "api" && hasMore);
    noteEl.hidden = mode !== "local";
    if (mode === "local") {
      noteEl.textContent = "Preview mode: the guestbook service is not connected, so messages are saved on this device only.";
    }
  }

  /* Network ---------------------------------------------------------------------- */
  async function request(url, opts) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const res = await fetch(url, {
        ...opts,
        signal: ctl.signal,
        headers: { Accept: "application/json", ...(opts && opts.headers) }
      });
      const type = res.headers.get("content-type") || "";
      if (!type.includes("application/json")) throw new Error("not-json");   // e.g. a 404 page
      return { ok: res.ok, status: res.status, data: await res.json() };
    } finally {
      clearTimeout(timer);
    }
  }

  function readLocal() {
    try { return JSON.parse(store.get(LOCAL_KEY) || "[]"); } catch (e) { return []; }
  }

  async function load() {
    try {
      const r = await request(`${API}?limit=30`);
      if (!r.ok) throw new Error("bad-status");
      mode = "api";
      entries = r.data.entries || [];
      hasMore = !!r.data.hasMore;
      startPolling();
    } catch (e) {
      mode = "local";
      entries = readLocal();
      hasMore = false;
    }
    renderAll();
  }

  async function loadMore() {
    const last = entries[entries.length - 1];
    if (!last) return;
    moreBtn.disabled = true;
    try {
      const r = await request(`${API}?limit=30&before=${encodeURIComponent(last.id)}`);
      if (r.ok) {
        const known = new Set(entries.map((e) => e.id));
        r.data.entries.forEach((e) => { if (!known.has(e.id)) { entries.push(e); listEl.appendChild(entryEl(e, false)); } });
        hasMore = !!r.data.hasMore;
      }
    } catch (e) { /* leave the button for another try */ }
    moreBtn.disabled = false;
    moreBtn.hidden = !hasMore;
  }

  // pick up messages other guests post while this page is open
  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if (document.hidden || mode !== "api") return;
      try {
        const r = await request(`${API}?limit=30`);
        if (!r.ok) return;
        const known = new Set(entries.map((e) => e.id));
        const fresh = r.data.entries.filter((e) => !known.has(e.id));
        if (!fresh.length) return;
        entries = fresh.concat(entries);
        const empty = listEl.querySelector(".gb-empty");
        if (empty) empty.remove();
        fresh.slice().reverse().forEach((e) => listEl.prepend(entryEl(e, true)));
      } catch (e) { /* try again next time */ }
    }, 45000);
  }

  /* Form ------------------------------------------------------------------------ */
  function setStatus(text, tone) {
    statusEl.textContent = text || "";
    if (tone) statusEl.dataset.tone = tone; else delete statusEl.dataset.tone;
  }

  function updateCount() { countEl.textContent = `${[...msgEl.value].length} / ${MAX_MSG}`; }
  msgEl.addEventListener("input", updateCount);

  suggestBtn.addEventListener("click", () => {
    msgEl.value = WISHES[Math.floor(Math.random() * WISHES.length)];
    msgEl.removeAttribute("aria-invalid");
    updateCount();
    msgEl.focus();
  });

  const ERRORS = {
    name_required: "Please enter your name.",
    message_required: "Please write your wishes.",
    too_long: "That is a little too long. Please shorten it.",
    links: "Links are not allowed in messages.",
    rate_limited: "You have sent several messages recently. Please try again later."
  };

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const name = nameEl.value.replace(/\s+/g, " ").trim();
    const message = msgEl.value.trim();
    nameEl.removeAttribute("aria-invalid");
    msgEl.removeAttribute("aria-invalid");

    if (!name) { nameEl.setAttribute("aria-invalid", "true"); setStatus(ERRORS.name_required, "error"); nameEl.focus(); return; }
    if (!message) { msgEl.setAttribute("aria-invalid", "true"); setStatus(ERRORS.message_required, "error"); msgEl.focus(); return; }
    if ([...message].length > MAX_MSG) { msgEl.setAttribute("aria-invalid", "true"); setStatus(ERRORS.too_long, "error"); msgEl.focus(); return; }

    sendBtn.disabled = true;
    setStatus("Sending your wishes.", "");
    let saved = null;
    let savedLocally = false;

    try {
      if (mode === "api") {
        const r = await request(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, message, website: hpEl.value })
        });
        if (r.ok) saved = r.data.entry;
        else {
          setStatus(ERRORS[r.data && r.data.error] || "Your message could not be sent. Please try again.", "error");
          sendBtn.disabled = false;
          return;
        }
      }
    } catch (e) {
      mode = "local";                      // the service went away: keep the guest's message
      noteEl.hidden = false;
      noteEl.textContent = "The guestbook service could not be reached, so this message is saved on this device only.";
    }

    if (!saved) {
      saved = { id: "local-" + Date.now(), name, message, createdAt: new Date().toISOString() };
      const local = readLocal();
      local.unshift(saved);
      store.set(LOCAL_KEY, JSON.stringify(local.slice(0, 100)));
      savedLocally = true;
    }

    entries.unshift(saved);
    const empty = listEl.querySelector(".gb-empty");
    if (empty) empty.remove();
    listEl.prepend(entryEl(saved, true));
    listEl.scrollTop = 0;

    store.set(NAME_KEY, name);
    msgEl.value = "";
    updateCount();
    setStatus(savedLocally
      ? "Thank you. Your wishes are saved on this device."
      : "Thank you. Your wishes are now in the guestbook.", "ok");
    sendBtn.disabled = false;
  });

  moreBtn.addEventListener("click", loadMore);

  /* Start ----------------------------------------------------------------------- */
  const savedName = store.get(NAME_KEY);
  if (savedName) nameEl.value = savedName;
  updateCount();
  renderAll();
  load();
})();
