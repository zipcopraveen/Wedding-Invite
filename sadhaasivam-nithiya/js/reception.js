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
  } else {
    const empty = document.createElement("div");
    empty.className = "map__empty";
    empty.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>' +
      "<p>The map will appear here once the venue is shared.</p>";
    mapBox.appendChild(empty);
  }
})();
