/* ==========================================================================
   envelope.js  |  the guest's own envelope, for personalised links
   - Sets window.__envelopeOpened (false while the envelope is shut) and fires
     "envelope:ready" as the envelope melts into the page. hero.js waits for that
     event, so the names do not animate behind the envelope.
   - Everyone else (root address, unknown slug) gets true straight away.
   - One action only: the guest taps the heart in the gold round on the envelope
     (the word "Open" is written under it; the heart beats to invite the tap; it is
     a real button for the keyboard and screen readers). The round lets go, the
     flap turns up, and the letter rises out turning one full circle, then settles
     large enough to read and greets the guest by name. After a short hold the
     letter's cream spreads over the whole screen, the page behind starts, and the
     cream dissolves into the hero. The letter's words are the placeholders in
     LETTER below until the final content is written.
   - Looks: css/envelope.css.
   ========================================================================== */

(function () {
  "use strict";
  const cfg = window.WEDDING;
  const guestsRaw = window.WEDDING_GUESTS || {};
  const RESERVED = ["css", "js", "assets", "api", "index.html", "preview.html"];
  const SETTLE_MS = 3300;            // fallback: when the letter has settled, in case the animation event never comes
  const HOLD_MS = 1700;              // how long the settled letter is held so the greeting can be read
  const MELT_MS = 900;               // how long the cream takes to spread over the screen before the page starts

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

  /* The words of the letter. Placeholders until the final content is written: change them here. */
  const LETTER = {
    greeting: "Dear",
    lead: "You are warmly invited to the wedding reception of",
    names: `${partner1.name} & ${partner2.name}`
  };
  const OPEN_WORD = "Open";                        // written under the round
  const OPEN_LABEL = "Open the invitation";        // spoken to screen readers

  const el = make("div", "envelope on-wine");
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Your invitation");
  el.setAttribute("data-lenis-prevent", "");

  const stage = make("div", "envelope__stage");
  const env = make("div", "envelope__env");

  /* The envelope: back, letter, front, flap, seal (layered by css) */
  const back = make("div", "envelope__back");
  const front = make("div", "envelope__front");
  const flap = make("div", "envelope__flap");
  [back, front, flap].forEach((n) => n.setAttribute("aria-hidden", "true"));

  /* The gopuram (the temple tower) is pressed into the right of the front as a gold relief; it lives inside the front so it
     is clipped by the V and fades away with the envelope */
  const gopuram = make("div", "envelope__gopuram");
  gopuram.setAttribute("aria-hidden", "true");
  gopuram.appendChild(make("i"));
  front.appendChild(gopuram);

  /* The one thing to tap: a gold round with a heart in it, and the word "Open" under it */
  const NS = "http://www.w3.org/2000/svg";
  const heart = document.createElementNS(NS, "svg");
  heart.setAttribute("class", "envelope__heart");
  heart.setAttribute("viewBox", "0 0 24 24");
  heart.setAttribute("aria-hidden", "true");
  heart.setAttribute("focusable", "false");
  const heartPath = document.createElementNS(NS, "path");
  heartPath.setAttribute("d", "M12 21.5 3.2 12.6A5.6 5.6 0 0 1 11.1 4.7L12 5.6l.9-.9a5.6 5.6 0 0 1 7.9 7.9z");
  heart.appendChild(heartPath);
  const seal = make("span", "envelope__seal");
  seal.appendChild(heart);
  const openWord = make("span", "envelope__open-word", OPEN_WORD);
  const open = make("button", "envelope__open");
  open.type = "button";
  open.setAttribute("aria-label", OPEN_LABEL);
  open.append(seal, openWord);

  /* The letter: greets the guest by name */
  const letter = make("div", "envelope__letter");
  const dear = make("p", "envelope__dear", LETTER.greeting);
  const h = make("h2", "envelope__guest display", guestName);
  const lead = make("p", "envelope__lead", LETTER.lead);
  const names = make("p", "envelope__names", LETTER.names);
  letter.append(dear, h, lead, names);

  env.append(back, letter, front, flap, open);

  stage.appendChild(env);
  el.appendChild(stage);
  document.body.appendChild(el);
  el.tabIndex = -1;                               // focus moves into the dialog without drawing a ring; Tab then reaches the heart
  el.focus({ preventScroll: true });

  /* Opening ---------------------------------------------------------------------- */
  let opened = false;
  function openEnvelope() {
    if (opened) return;
    opened = true;
    el.scrollTo(0, 0);
    open.tabIndex = -1;
    open.setAttribute("aria-hidden", "true");
    el.classList.add("is-opening");
    let settled = false;
    const settle = () => {                        // the letter has landed: hold it, then go on to the page
      if (settled) return;
      settled = true;
      setTimeout(melt, HOLD_MS);
    };
    letter.addEventListener("animationend", settle, { once: true });
    setTimeout(settle, SETTLE_MS);
  }
  open.addEventListener("click", openEnvelope);   // a real button: Enter and Space work too

  /* Going on to the page: the cream spreads over the screen (is-melting), then the page starts and the cream fades away */
  function melt() {
    el.classList.add("is-melting");
    setTimeout(finish, MELT_MS);
  }
  function finish() {
    el.classList.add("is-leaving");
    document.documentElement.classList.remove("is-locked");
    window.__envelopeOpened = true;
    window.dispatchEvent(new Event("envelope:ready"));
    setTimeout(() => el.remove(), 900);
  }
})();
