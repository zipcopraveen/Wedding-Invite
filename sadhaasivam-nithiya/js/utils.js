/* ==========================================================================
   utils.js  |  window.WeddingUtils, shared helpers
   ========================================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hasHover = () =>
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function debounce(fn, wait = 150) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * Convert an IST wall-clock string ("2027-01-15T18:30:00") to a real Date.
   * Plain new Date() would read it in the visitor's own timezone.
   */
  function istToUTCDate(istString) {
    if (!istString) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(istString);
    if (!m) return null;
    const [, y, mo, d, h, mi, s = "0"] = m.map((v, i) => (i === 0 ? v : Number(v)));
    const IST_OFFSET_MIN = 330; // UTC+05:30
    return new Date(Date.UTC(y, mo - 1, d, h, mi, s) - IST_OFFSET_MIN * 60000);
  }

  function scrollToSelector(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }

  /** Run callback once when an element first enters the viewport. */
  function observeOnce(el, callback, options = { threshold: 0.25 }) {
    if (!("IntersectionObserver" in window)) { callback(el); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { io.unobserve(entry.target); callback(entry.target); }
      });
    }, options);
    io.observe(el);
  }

  /**
   * Lazy images: <img data-src="..."> loads when near the viewport and fades in
   * over a shimmer placeholder. Omit data-src until the real photo exists, so
   * there is no 404.
   */
  function initLazyImages(root = document) {
    const imgs = root.querySelectorAll("img[data-src]");
    const load = (img) => {
      img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
    };
    if (!("IntersectionObserver" in window)) { imgs.forEach(load); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } });
    }, { rootMargin: "300px 0px" });
    imgs.forEach((img) => io.observe(img));
  }

  window.WeddingUtils = {
    prefersReducedMotion, hasHover, debounce,
    istToUTCDate, scrollToSelector, observeOnce, initLazyImages
  };
})();
