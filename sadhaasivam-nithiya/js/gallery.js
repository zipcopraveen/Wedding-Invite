/* ==========================================================================
   gallery.js  |  portrait coverflow slideshow
   Follows the reference invitation: 3:4 cards on a shared stage. The centre
   card faces forward; the cards beside it turn away and shrink; further out
   they fade. Moving takes 1.1 s.
   - Click a side card to bring it forward; click the centre card to open it
     larger (lightbox.js). Swipe, arrow keys and the arrows (desktop) work too.
   - Autoplay is driven by the progress line: when its animation ends, the
     next photo comes forward. Pausing the animation pauses autoplay.
   - Autoplay pauses on hover, keyboard focus, when scrolled out of view,
     when the tab is hidden and while the viewer is open. With reduced motion
     it starts paused.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const items = (window.WEDDING && window.WEDDING.gallery) || [];
  const root = document.getElementById("gallery");
  if (!root) return;
  if (!items.length) { root.hidden = true; return; }

  const show = document.getElementById("slideshow");
  const stage = document.getElementById("gal-stage");
  const track = document.getElementById("gal-slides");
  const prevBtn = document.getElementById("gal-prev");
  const nextBtn = document.getElementById("gal-next");
  const playBtn = document.getElementById("gal-play");
  const curEl = document.getElementById("gal-cur");
  const totalEl = document.getElementById("gal-total");
  const progress = document.getElementById("gal-progress");

  const total = items.length;
  const cards = [];
  let index = 0;
  let userPaused = U.prefersReducedMotion();
  const holds = new Set();

  totalEl.textContent = String(total);

  /* Build ---------------------------------------------------------------------- */
  items.forEach((item, i) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    const img = document.createElement("img");
    img.className = "card__img";
    img.alt = item.alt || `Photo ${i + 1} of ${total}`;
    img.decoding = "async";
    img.draggable = false;
    img.style.objectPosition = item.focus || "50% 50%";
    img.addEventListener("load", () => img.classList.add("is-loaded"));
    card.appendChild(img);
    track.appendChild(card);
    cards.push({ card, img, loaded: false });

    card.addEventListener("click", () => {
      if (moved > 10) { moved = 0; return; }             // the click that ends a swipe
      if (i === index) openViewer();
      else goTo(i);
    });
  });

  function load(i) {
    const n = ((i % total) + total) % total;
    const c = cards[n];
    if (c.loaded) return;
    c.loaded = true;
    c.img.src = items[n].src;
  }

  /* Layout: each card gets a position from its distance to the centre ------ */
  function layout() {
    cards.forEach((c, i) => {
      let d = i - index;
      if (d > total / 2) d -= total;
      if (d < -total / 2) d += total;
      const a = Math.abs(d);

      const side = Math.sign(d);
      const tx = side * Math.min(a, 3) * 60;               // % of card width; far cards stay put, hidden
      const tz = -Math.min(a, 3) * 260;                    // far enough back that a tilted edge never swings in front of the centre card
      const rot = a <= 1 ? d * 45 : side * 62;             // never fully edge-on
      const scale = a === 0 ? 1 : a === 1 ? 0.94 : 0.85;   // depth shrinks them further
      const opacity = a === 0 ? 1 : a === 1 ? 0.75 : a === 2 ? 0.45 : 0;

      c.card.style.transform = `translateX(${tx}%) translateZ(${tz}px) rotateY(${rot}deg) scale(${scale})`;
      c.card.style.opacity = String(opacity);
      c.card.style.zIndex = String(100 - a);
      c.card.style.pointerEvents = a > 1 ? "none" : "auto";
      c.card.classList.toggle("is-active", a === 0);
      c.card.tabIndex = a === 0 ? 0 : -1;
      c.card.dataset.cursor = a === 0 ? "Open" : "View";
      c.card.setAttribute("aria-hidden", a > 1 ? "true" : "false");
      c.card.setAttribute("aria-label", a === 0
        ? `Photo ${i + 1} of ${total}. Open larger`
        : `Show photo ${i + 1} of ${total}`);
    });
    curEl.textContent = String(index + 1);
  }

  /* Progress line ----------------------------------------------------------------- */
  function restartProgress() {
    progress.style.animation = "none";
    void progress.offsetWidth;                // force reflow so the animation restarts
    progress.style.animation = "";
  }

  function goTo(i, opts = {}) {
    const to = ((i % total) + total) % total;
    if (to === index && !opts.force) return;
    index = to;
    load(index); load(index + 1); load(index - 1); load(index + 2); load(index - 2);
    if (opts.instant) {
      stage.classList.add("no-anim");
      layout();
      void stage.offsetWidth;
      requestAnimationFrame(() => stage.classList.remove("no-anim"));
    } else {
      layout();
    }
    restartProgress();
  }
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  /* Autoplay -------------------------------------------------------------------- */
  function syncPlayState() {
    show.classList.toggle("is-playing", !userPaused);
    show.classList.toggle("is-paused", holds.size > 0);
    playBtn.setAttribute("aria-label", userPaused ? "Play slideshow" : "Pause slideshow");
    playBtn.dataset.state = userPaused ? "paused" : "playing";
  }
  function hold(reason, on) {
    if (on) holds.add(reason); else holds.delete(reason);
    syncPlayState();
  }

  progress.addEventListener("animationend", () => { if (!userPaused) next(); });
  playBtn.addEventListener("click", () => { userPaused = !userPaused; restartProgress(); syncPlayState(); });

  if (U.hasHover()) {
    show.addEventListener("mouseenter", () => hold("hover", true));
    show.addEventListener("mouseleave", () => hold("hover", false));
  }
  show.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) hold("focus", true); });
  show.addEventListener("focusout", () => hold("focus", false));
  document.addEventListener("visibilitychange", () => hold("hidden", document.hidden));
  document.addEventListener("lightbox:opened", () => hold("viewer", true));
  document.addEventListener("lightbox:closed", (e) => {
    hold("viewer", false);
    if (e.detail && typeof e.detail.index === "number") goTo(e.detail.index, { instant: true });
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => hold("offscreen", !en.isIntersecting));
    }, { threshold: 0.3 }).observe(stage);
  }

  /* Controls, keyboard, swipe ------------------------------------------------ */
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  show.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { next(); e.preventDefault(); cards[index].card.focus({ preventScroll: true }); }
    if (e.key === "ArrowLeft") { prev(); e.preventDefault(); cards[index].card.focus({ preventScroll: true }); }
  });

  let startX = 0, startY = 0, moved = 0, tracking = false;
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".coverflow__nav")) return;
    tracking = true; moved = 0; startX = e.clientX; startY = e.clientY;
  });
  stage.addEventListener("pointermove", (e) => {
    if (!tracking) return;
    moved = Math.max(moved, Math.abs(e.clientX - startX), Math.abs(e.clientY - startY));
  });
  stage.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { dx < 0 ? next() : prev(); }
  });
  stage.addEventListener("pointercancel", () => { tracking = false; });

  function openViewer() {
    const c = cards[index];
    document.dispatchEvent(new CustomEvent("lightbox:request", {
      detail: { index, origin: c.card, originImg: c.img, returnFocus: c.card }
    }));
  }

  /* Start ----------------------------------------------------------------------- */
  load(0); load(1); load(2); load(total - 1); load(total - 2);
  layout();
  syncPlayState();

  window.WeddingGallery = {
    goTo,
    get index() { return index; },
    get activeImg() { return cards[index].img; },
    get activeCard() { return cards[index].card; },
    total
  };
})();
