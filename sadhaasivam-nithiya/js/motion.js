/* ==========================================================================
   motion.js  |  smooth scroll and one shared animation frame
   - Lenis (vendored in js/vendor) smooths wheel scrolling. Touch scrolling
     stays native. With reduced motion it is not started at all.
   - Every scroll-driven module subscribes to WeddingMotion.on(fn) instead of
     adding its own scroll listener, so there is one loop and one read of the
     scroll position per frame.
   - Locks (viewer, envelope) add html.is-locked; that pauses smooth scroll.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const subs = new Set();
  const state = { y: window.scrollY, vy: 0, vh: window.innerHeight, t: 0 };

  const reduced = U.prefersReducedMotion();
  const lenis = !reduced && window.Lenis
    ? new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, autoRaf: false })
    : null;

  function frame(t) {
    if (lenis) lenis.raf(t);
    const y = lenis ? lenis.scroll : window.scrollY;
    state.vy = y - state.y;
    state.y = y;
    state.vh = window.innerHeight;
    state.t = t;
    subs.forEach((fn) => fn(state));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Pause smooth scrolling while something full-screen is open.
  if (lenis) {
    new MutationObserver(() => {
      if (document.documentElement.classList.contains("is-locked")) lenis.stop(); else lenis.start();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }

  function scrollTo(target) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else el.scrollIntoView({ behavior: "auto", block: "start" });
  }

  // in-page links use the same smooth scroll
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2) return;
    const el = document.querySelector(a.getAttribute("href"));
    if (!el) return;
    e.preventDefault();
    scrollTo(el);
  });

  window.WeddingMotion = {
    on(fn) { subs.add(fn); return () => subs.delete(fn); },
    scrollTo,
    get smooth() { return !!lenis; }
  };
})();
