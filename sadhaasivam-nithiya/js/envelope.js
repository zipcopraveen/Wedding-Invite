/* ==========================================================================
   envelope.js  |  the guest's own envelope, for personalised links
   - Sets window.__envelopeOpened (false while the envelope is shut) and fires
     "envelope:ready" when it is opened. hero.js waits for that event, so the
     names do not animate behind the envelope.
   - Everyone else (root address, unknown slug) gets true straight away.
   - Opening: the flap lifts, the seal lets go, the cream card rises to fill
     the screen (it is the same cream as the hero), then the envelope fades.
     With reduced motion the envelope simply goes.
   - Looks: css/envelope.css.
   ========================================================================== */

(function () {
  "use strict";
  const cfg = window.WEDDING;
  const guestsRaw = window.WEDDING_GUESTS || {};
  const RESERVED = ["css", "js", "assets", "api", "index.html", "preview.html"];
  const OPEN_MS = 1500;              // how long the opening plays before the page takes over

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
  const make = (tag, className, text) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;       // textContent: never parsed as HTML
    return n;
  };

  const el = make("div", "envelope on-wine");
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "env-title");
  el.setAttribute("data-lenis-prevent", "");

  /* The envelope: two folds at the bottom, the flap at the top, the seal at its tip */
  const foldL = make("div", "envelope__fold envelope__fold--l");
  const foldR = make("div", "envelope__fold envelope__fold--r");
  const flap = make("div", "envelope__flap");
  [foldL, foldR, flap].forEach((n) => n.setAttribute("aria-hidden", "true"));

  // The seal is the kolam's lotus: twelve long petals, twelve short, the initials in the middle.
  const NS = "http://www.w3.org/2000/svg";
  const seal = document.createElementNS(NS, "svg");
  seal.setAttribute("class", "envelope__seal");
  seal.setAttribute("viewBox", "-100 -100 200 200");
  seal.setAttribute("aria-hidden", "true");
  seal.setAttribute("focusable", "false");
  const svgEl = (name, attrs) => {
    const n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
    return n;
  };
  for (let i = 0; i < 12; i++) {
    seal.appendChild(svgEl("path", { class: "envelope__petal", d: "M0 0Q34 -52 0 -98Q-34 -52 0 0Z", transform: `rotate(${i * 30})` }));
  }
  for (let i = 0; i < 12; i++) {
    seal.appendChild(svgEl("path", { class: "envelope__petal envelope__petal--in", d: "M0 0Q24 -36 0 -70Q-24 -36 0 0Z", transform: `rotate(${i * 30 + 15})` }));
  }
  seal.appendChild(svgEl("circle", { class: "envelope__core", r: "41" }));
  const initials = svgEl("text", { class: "envelope__initials", "text-anchor": "middle", y: "12" });
  initials.textContent = `${[...partner1.name][0]}&${[...partner2.name][0]}`;
  seal.appendChild(initials);

  /* What is written on the front */
  const front = make("div", "envelope__front");
  const dear = make("p", "envelope__dear", "Dear");
  const h = make("h2", "envelope__guest display", guestName);
  h.id = "env-title";
  const lead = make("p", "envelope__lead", "You are warmly invited to the wedding reception of");
  const names = make("p", "envelope__names", `${partner1.name} & ${partner2.name}`);
  const btn = make("button", "btn btn--solid envelope__open", "Open the invitation");
  btn.type = "button";
  const parts = [dear, h, lead, names, btn];
  parts.forEach((n, i) => n.style.setProperty("--i", String(i)));
  front.append(...parts);

  const band = make("div", "envelope__karai");
  band.setAttribute("aria-hidden", "true");

  // the cream card that rises when the envelope opens
  const card = make("div", "envelope__card");
  card.setAttribute("aria-hidden", "true");

  el.append(foldL, foldR, flap, seal, front, band, card);
  document.body.appendChild(el);
  btn.focus({ preventScroll: true });

  /* Opening ---------------------------------------------------------------------- */
  function finish() {
    el.classList.add("is-leaving");
    document.documentElement.classList.remove("is-locked");
    window.__envelopeOpened = true;
    window.dispatchEvent(new Event("envelope:ready"));
    setTimeout(() => el.remove(), 800);
  }

  let opened = false;
  btn.addEventListener("click", () => {
    if (opened) return;
    opened = true;
    el.scrollTo(0, 0);
    const reduced = window.WeddingUtils && window.WeddingUtils.prefersReducedMotion();
    if (reduced) { finish(); return; }
    el.classList.add("is-opening");
    setTimeout(finish, OPEN_MS);
  });
})();
