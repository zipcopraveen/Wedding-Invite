/* ==========================================================================
   reception.js  |  event details, add to calendar, directions, map
   - .ics is the primary calendar action (works on iPhone); Google Calendar
     link is secondary.
   - All values come from config.js. Missing values show a calm placeholder
     instead of an empty gap.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const cfg = window.WEDDING;
  const ev = cfg.reception;
  const whenEl = document.getElementById("rec-when");
  const whereEl = document.getElementById("rec-where");
  const actions = document.getElementById("rec-actions");
  const note = document.getElementById("rec-note");
  const mapBox = document.getElementById("rec-map");
  if (!whenEl) return;

  const { partner1, partner2 } = cfg.couple;
  const start = U.istToUTCDate(ev.datetimeIST);
  const end = start ? new Date(start.getTime() + (ev.durationMinutes || 180) * 60000) : null;

  /* When ----------------------------------------------------------------- */
  if (start) {
    const fmt = (o) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(start);
    whenEl.textContent = "";
    const d = document.createElement("span");
    d.className = "facts__main";
    d.textContent = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const t = document.createElement("span");
    t.className = "soft";
    t.textContent = fmt({ hour: "numeric", minute: "2-digit", hour12: true }) + " IST";
    whenEl.append(d, t);
  } else {
    whenEl.textContent = "Date to be announced";
    whenEl.classList.add("is-pending");
  }

  /* Where ---------------------------------------------------------------- */
  if (ev.venueName || ev.venueAddress) {
    whereEl.textContent = "";
    if (ev.venueName) {
      const n = document.createElement("span");
      n.className = "facts__main";
      n.textContent = ev.venueName;
      whereEl.appendChild(n);
    }
    if (ev.venueAddress) {
      const a = document.createElement("span");
      a.className = "soft";
      a.textContent = ev.venueAddress;
      whereEl.appendChild(a);
    }
  } else {
    whereEl.textContent = "Venue to be announced";
    whereEl.classList.add("is-pending");
  }

  /* Calendar files ------------------------------------------------------- */
  const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const title = `${partner1.name} & ${partner2.name} Wedding Reception`;
  const location = [ev.venueName, ev.venueAddress].filter(Boolean).join(", ");
  const details = `Wedding reception of ${partner1.name} and ${partner2.name}.`;

  function buildICS() {
    const host = cfg.domain || "wedding-invite";
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//" + esc(partner1.name + " and " + partner2.name) + "//Reception//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:reception-${stamp(start)}@${host}`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(title)}`,
      location ? `LOCATION:${esc(location)}` : null,
      `DESCRIPTION:${esc(details)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].filter(Boolean).join("\r\n");
  }

  function downloadICS() {
    const blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reception.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function googleCalendarURL() {
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${stamp(start)}/${stamp(end)}`,
      details,
      location
    });
    return "https://calendar.google.com/calendar/render?" + q.toString();
  }

  /* Actions -------------------------------------------------------------- */
  actions.textContent = "";
  if (start) {
    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn btn--solid";
    add.id = "rec-ics";
    add.textContent = "Add to calendar";
    add.addEventListener("click", downloadICS);

    const g = document.createElement("a");
    g.className = "btn";
    g.href = googleCalendarURL();
    g.target = "_blank";
    g.rel = "noopener";
    g.textContent = "Google Calendar";
    actions.append(add, g);
  }
  if (ev.mapLinkUrl) {
    const dir = document.createElement("a");
    dir.className = "btn";
    dir.href = ev.mapLinkUrl;
    dir.target = "_blank";
    dir.rel = "noopener";
    dir.textContent = "Get directions";
    actions.appendChild(dir);
  }
  if (!actions.children.length) {
    note.textContent = "Calendar and directions appear here once the date and venue are shared.";
  }


  /* The arch's border: kolam line art. A chain of small loops follows the arch
     (as the scalloped ring does in the date kolam), with a pulli dot at every
     join. It is measured from the real box, so it fits at any width. */
  function kolamFrame(box) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "map__kolam");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    box.appendChild(svg);

    const GAP = 14;          // distance from the map's edge to the pulli dots (px)
    const STEP = 22;         // distance between dots along the edge (px)
    const f = (n) => n.toFixed(1);

    function draw() {
      const W = box.clientWidth, H = box.clientHeight;
      if (!W || !H) return;
      const rx = W / 2, ry = H * 0.375;
      // the arch's edge as a dense walk from the bottom-left, over the top, to the bottom-right
      const pts = [];
      for (let y = H; y > ry; y -= 1) pts.push([0, y, -1, 0]);
      for (let i = 0; i <= 360; i++) {
        const t = Math.PI + (Math.PI * i) / 360;
        const nx = Math.cos(t) / rx, ny = Math.sin(t) / ry, n = Math.hypot(nx, ny);
        pts.push([rx + rx * Math.cos(t), ry + ry * Math.sin(t), nx / n, ny / n]);
      }
      for (let y = ry; y <= H; y += 1) pts.push([W, y, 1, 0]);
      // walk it at equal arc lengths
      const marks = [];
      let acc = 0, next = 0;
      for (let i = 0; i < pts.length; i++) {
        if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (acc >= next) { marks.push(pts[i]); next += STEP; }
      }
      const out = (m, d) => [m[0] + m[2] * d, m[1] + m[3] * d];
      let loops = "", dots = "";
      for (let i = 0; i < marks.length; i++) {
        const [x, y] = out(marks[i], GAP);
        dots += `<circle cx="${f(x)}" cy="${f(y)}" r="2.2"/>`;
        if (i + 1 < marks.length) {
          const [x2, y2] = out(marks[i + 1], GAP);
          const r = Math.hypot(x2 - x, y2 - y) * 0.62;
          // each loop is a lens (a petal) from one pulli to the next, and a small dot rides outside its tip
          loops += `M${f(x)} ${f(y)}A${f(r)} ${f(r)} 0 0 1 ${f(x2)} ${f(y2)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y)}`;
          const mid = [(marks[i][0] + marks[i + 1][0]) / 2, (marks[i][1] + marks[i + 1][1]) / 2, marks[i][2], marks[i][3]];
          const [mx, my] = out(mid, GAP + 12);
          dots += `<circle class="map__kolam-tip" cx="${f(mx)}" cy="${f(my)}" r="1.4"/>`;
        }
      }
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.innerHTML = `<path d="${loops}"/>${dots}`;
    }
    draw();
    if ("ResizeObserver" in window) new ResizeObserver(draw).observe(box);
    else window.addEventListener("resize", draw);
  }

  /* Map: the iframe loads only when it is near the viewport --------------- */
  mapBox.textContent = "";
  if (ev.mapEmbedUrl) {
    const frame = document.createElement("iframe");
    frame.title = "Map showing the reception venue";
    frame.loading = "lazy";
    frame.referrerPolicy = "no-referrer-when-downgrade";
    frame.setAttribute("allowfullscreen", "");
    mapBox.appendChild(frame);
    U.observeOnce(mapBox, () => { frame.src = ev.mapEmbedUrl; }, { rootMargin: "300px 0px" });
    kolamFrame(mapBox);
  } else {
    const empty = document.createElement("div");
    empty.className = "map__empty";
    empty.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>' +
      "<p>The map will appear here once the venue is shared.</p>";
    mapBox.appendChild(empty);
  }
})();
