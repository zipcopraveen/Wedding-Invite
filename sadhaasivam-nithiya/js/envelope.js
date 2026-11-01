/* ==========================================================================
   envelope.js  |  "Dear <Name>" card for personalised links
   - Sets window.__envelopeOpened (false while the card is up) and fires
     "envelope:ready" when it is opened. hero.js waits for that event, so the
     names do not animate behind the card.
   - Everyone else (root address, unknown slug) gets true straight away.
   - Simple fade and scale on purpose.
   ========================================================================== */

(function () {
  "use strict";
  const cfg = window.WEDDING;
  const guestsRaw = window.WEDDING_GUESTS || {};
  const RESERVED = ["css", "js", "assets", "api", "index.html", "preview.html"];

  const guests = {};
  Object.keys(guestsRaw).forEach((k) => { guests[k.toLowerCase()] = guestsRaw[k]; });

  function currentSlug() {
    const q = new URLSearchParams(window.location.search).get("to");
    if (q) return q.toLowerCase();
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (!parts.length) return "";
    const last = decodeURIComponent(parts[parts.length - 1]).toLowerCase();
    return last.includes(".") || RESERVED.includes(last) ? "" : last;
  }

  const slug = currentSlug();
  const guestName = slug && Object.prototype.hasOwnProperty.call(guests, slug) ? guests[slug] : null;

  if (!guestName) { window.__envelopeOpened = true; return; }

  window.__envelopeOpened = false;
  document.documentElement.classList.add("is-locked");

  // Guest pages are private: keep them out of search results.
  const robots = document.createElement("meta");
  robots.name = "robots";
  robots.content = "noindex";
  document.head.appendChild(robots);

  const { partner1, partner2 } = cfg.couple;
  const el = document.createElement("div");
  el.className = "envelope";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "env-title");

  const card = document.createElement("div");
  card.className = "envelope__card";

  const dear = document.createElement("p");
  dear.className = "envelope__dear";
  dear.textContent = "Dear";

  const h = document.createElement("h2");
  h.id = "env-title";
  h.className = "envelope__guest display";
  h.textContent = guestName;                       // textContent: never parsed as HTML

  const rule = document.createElement("div");
  rule.className = "zari-rule";
  rule.setAttribute("aria-hidden", "true");

  const lead = document.createElement("p");
  lead.textContent = "You are warmly invited to the wedding reception of";

  const names = document.createElement("p");
  names.className = "envelope__names";
  names.textContent = `${partner1.name} & ${partner2.name}`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--solid";
  btn.textContent = "Open the invitation";

  card.append(dear, h, rule, lead, names, btn);
  el.appendChild(card);
  document.body.appendChild(el);
  btn.focus({ preventScroll: true });

  btn.addEventListener("click", () => {
    el.classList.add("is-leaving");
    document.documentElement.classList.remove("is-locked");
    window.__envelopeOpened = true;
    window.dispatchEvent(new Event("envelope:ready"));
    setTimeout(() => el.remove(), 800);
  });
})();
