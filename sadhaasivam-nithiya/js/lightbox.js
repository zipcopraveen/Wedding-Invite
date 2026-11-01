/* ==========================================================================
   lightbox.js  |  maximised photo viewer
   - The photo grows out of the slideshow as one continuous movement (View
     Transitions API). Browsers without it get a scale-up instead.
   - Buttons, thumbnails, arrow keys and swipe change photo; Esc closes.
   - Double-click or double-tap zooms; drag pans while zoomed.
   - Focus stays inside while open and returns to the photo on close.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const items = (window.WEDDING && window.WEDDING.gallery) || [];
  if (!items.length) return;

  const total = items.length;
  const pad = (n) => String(n).padStart(2, "0");
  const canMorph = () => !!document.startViewTransition && !U.prefersReducedMotion();
  const ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>'
  };

  /* Build once --------------------------------------------------------------- */
  const lb = document.createElement("div");
  lb.className = "lb";
  lb.hidden = true;
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Photo viewer");
  lb.innerHTML =
    '<div class="lb__backdrop" aria-hidden="true"></div>' +
    '<div class="lb__top">' +
      '<p class="lb__count" aria-live="polite"></p>' +
      '<div class="lb__tools">' +
        `<button class="lb__btn" type="button" data-act="play" aria-label="Play slideshow">${ICON.play}</button>` +
        `<button class="lb__btn" type="button" data-act="close" aria-label="Close viewer">${ICON.close}</button>` +
      "</div>" +
    "</div>" +
    '<div class="lb__stage">' +
      '<img class="lb__img" alt="" draggable="false">' +
      `<button class="lb__btn lb__nav lb__nav--prev" type="button" data-act="prev" aria-label="Previous photo">${ICON.prev}</button>` +
      `<button class="lb__btn lb__nav lb__nav--next" type="button" data-act="next" aria-label="Next photo">${ICON.next}</button>` +
    "</div>" +
    '<div class="lb__thumbs" role="group" aria-label="Choose a photo"></div>';
  document.body.appendChild(lb);

  const backdrop = lb.querySelector(".lb__backdrop");
  const countEl = lb.querySelector(".lb__count");
  const stage = lb.querySelector(".lb__stage");
  const img = lb.querySelector(".lb__img");
  const thumbsEl = lb.querySelector(".lb__thumbs");
  const playBtn = lb.querySelector('[data-act="play"]');
  const thumbBtns = items.map((item, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lb__thumb";
    b.setAttribute("aria-label", `Show photo ${i + 1} of ${total}`);
    const t = document.createElement("img");
    t.alt = "";
    t.loading = "lazy";
    t.src = item.thumb || item.src;
    b.appendChild(t);
    b.addEventListener("click", () => { stopPlay(); show(i); });
    thumbsEl.appendChild(b);
    return b;
  });

  /* State ---------------------------------------------------------------------- */
  let isOpen = false;
  let index = 0;
  let originEl = null;
  let returnFocus = null;
  let zoom = 1;
  let pan = { x: 0, y: 0 };
  let playTimer = null;
  const inertTargets = [];

  const applyTransform = () => {
    img.style.transform = zoom === 1 ? "" : `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
    img.style.cursor = zoom === 1 ? "zoom-in" : "grab";
  };
  function resetZoom() { zoom = 1; pan = { x: 0, y: 0 }; applyTransform(); }

  function preload(i) { const p = new Image(); p.src = items[(i + total) % total].src; }

  function show(i, animate = true) {
    index = (i + total) % total;
    const item = items[index];
    resetZoom();
    img.src = item.src;
    img.alt = item.alt || `Photo ${index + 1} of ${total}`;
    backdrop.style.backgroundImage = `url("${item.src}")`;
    countEl.textContent = `${pad(index + 1)} / ${pad(total)}`;
    thumbBtns.forEach((b, n) => b.setAttribute("aria-current", n === index ? "true" : "false"));
    const tb = thumbBtns[index];
    thumbsEl.scrollTo({ left: tb.offsetLeft - (thumbsEl.clientWidth - tb.clientWidth) / 2, behavior: "auto" });
    preload(index + 1); preload(index - 1);
    if (animate && !U.prefersReducedMotion() && img.animate) {
      img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out" });
    }
  }
  const go = (d) => show(index + d);

  /* Open ------------------------------------------------------------------------ */
  function setBackgroundInert(on) {
    if (on) {
      document.body.querySelectorAll(":scope > *").forEach((el) => {
        if (el !== lb && !el.hasAttribute("inert")) { el.setAttribute("inert", ""); inertTargets.push(el); }
      });
    } else {
      inertTargets.splice(0).forEach((el) => el.removeAttribute("inert"));
    }
  }

  function reveal(i) {
    lb.hidden = false;
    lb.classList.add("is-open");
    document.documentElement.classList.add("is-locked");
    setBackgroundInert(true);
    show(i, false);
  }

  function open(i, origin, ret, originImg) {
    if (isOpen) return;
    isOpen = true;
    originEl = origin || null;
    returnFocus = ret || document.activeElement;

    if (canMorph() && originImg) {
      originImg.style.viewTransitionName = "gal-photo";
      const vt = document.startViewTransition(async () => {
        originImg.style.viewTransitionName = "";
        img.style.viewTransitionName = "gal-photo";
        reveal(i);
        try { await img.decode(); } catch (e) { /* cached or broken: carry on */ }
      });
      vt.finished.finally(() => { img.style.viewTransitionName = ""; });
    } else {
      const from = originEl ? originEl.getBoundingClientRect() : null;
      reveal(i);
      requestAnimationFrame(() => scaleFrom(from, false));
    }

    lb.querySelector('[data-act="close"]').focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent("lightbox:opened"));
  }

  /* Fallback for browsers without View Transitions: scale from the stage */
  function scaleFrom(fromRect, reverse) {
    if (U.prefersReducedMotion() || !img.animate || !fromRect) return Promise.resolve();
    const to = img.getBoundingClientRect();
    if (!to.width) return Promise.resolve();
    const s = Math.min(1.4, Math.max(0.15, fromRect.width / to.width));
    const dx = fromRect.left + fromRect.width / 2 - (to.left + to.width / 2);
    const dy = fromRect.top + fromRect.height / 2 - (to.top + to.height / 2);
    const small = `translate(${dx}px, ${dy}px) scale(${s})`;
    const frames = reverse
      ? [{ transform: "none", opacity: 1 }, { transform: small, opacity: 0 }]
      : [{ transform: small, opacity: 0.2 }, { transform: "none", opacity: 1 }];
    return img.animate(frames, { duration: reverse ? 380 : 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }).finished.catch(() => {});
  }

  /* Close ----------------------------------------------------------------------- */
  function finishClose() {
    isOpen = false;
    lb.hidden = true;
    lb.classList.remove("is-open");
    document.documentElement.classList.remove("is-locked");
    setBackgroundInert(false);
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent("lightbox:closed", { detail: { index } }));
  }

  function close() {
    if (!isOpen) return;
    stopPlay();
    resetZoom();
    const gallery = window.WeddingGallery;

    if (canMorph() && gallery) {
      gallery.goTo(index, { instant: true });          // slideshow shows the photo we are closing on
      const dst = gallery.activeImg;
      img.style.viewTransitionName = "gal-photo";
      const vt = document.startViewTransition(() => {
        img.style.viewTransitionName = "";
        dst.style.viewTransitionName = "gal-photo";
        finishClose();
      });
      vt.finished.finally(() => { dst.style.viewTransitionName = ""; });
    } else {
      const from = originEl ? originEl.getBoundingClientRect() : null;
      scaleFrom(from, true).then(finishClose);
    }
  }

  /* Slideshow inside the viewer ------------------------------------------------ */
  function startPlay() {
    playTimer = setInterval(() => go(1), 3500);
    playBtn.innerHTML = ICON.pause;
    playBtn.setAttribute("aria-label", "Pause slideshow");
  }
  function stopPlay() {
    clearInterval(playTimer);
    playTimer = null;
    playBtn.innerHTML = ICON.play;
    playBtn.setAttribute("aria-label", "Play slideshow");
  }

  lb.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "close") close();
    if (act === "prev") { stopPlay(); go(-1); }
    if (act === "next") { stopPlay(); go(1); }
    if (act === "play") { playTimer ? stopPlay() : startPlay(); }
  });

  /* Keyboard and focus trap ---------------------------------------------------- */
  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); stopPlay(); go(1); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); stopPlay(); go(-1); return; }
    if (e.key === "Tab") {
      const f = [...lb.querySelectorAll("button")].filter((b) => !b.disabled && b.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Gestures: swipe, double-tap zoom, pan ------------------------------------- */
  let down = null;
  let lastTap = { t: 0, x: 0, y: 0 };

  function clampPan() {
    const r = stage.getBoundingClientRect();
    const maxX = Math.max(0, (img.offsetWidth * zoom - r.width) / 2);
    const maxY = Math.max(0, (img.offsetHeight * zoom - r.height) / 2);
    pan.x = Math.max(-maxX, Math.min(maxX, pan.x));
    pan.y = Math.max(-maxY, Math.min(maxY, pan.y));
  }

  function zoomAt(clientX, clientY) {
    if (zoom > 1) { resetZoom(); return; }
    const r = img.getBoundingClientRect();
    zoom = 2.4;
    pan = { x: (r.left + r.width / 2 - clientX) * (zoom - 1), y: (r.top + r.height / 2 - clientY) * (zoom - 1) };
    clampPan();
    applyTransform();
  }

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    down = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: 0 };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down.moved = Math.max(down.moved, Math.abs(dx), Math.abs(dy));
    if (zoom > 1) { pan = { x: down.px + dx, y: down.py + dy }; clampPan(); applyTransform(); }
  });
  stage.addEventListener("pointerup", (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    const moved = down.moved;
    down = null;
    if (zoom === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      stopPlay();
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (moved < 10) {
      const now = performance.now();
      if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        zoomAt(e.clientX, e.clientY);
        lastTap.t = 0;
      } else {
        lastTap = { t: now, x: e.clientX, y: e.clientY };
      }
    }
  });
  stage.addEventListener("pointercancel", () => { down = null; });

  window.addEventListener("resize", U.debounce(() => { if (isOpen) { clampPan(); applyTransform(); } }, 120));

  document.addEventListener("lightbox:request", (e) => {
    const d = e.detail || {};
    open(typeof d.index === "number" ? d.index : 0, d.origin, d.returnFocus, d.originImg);
  });

  window.WeddingLightbox = { open, close };
})();
