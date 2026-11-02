/* ==========================================================================
   enter.js  |  parts of a section arrive one after another
   Anything marked data-enter rises a little and fades in once, as its
   section scrolls into view; siblings in one section are staggered.
   - Content is only hidden once this script has run (html.has-enter), so a
     failed script never leaves a blank page.
   - Reduced motion: nothing is hidden, nothing travels.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const items = [...document.querySelectorAll("[data-enter]")];
  if (!items.length || !("IntersectionObserver" in window) || U.prefersReducedMotion()) return;

  // stagger by position within the section
  const seen = new Map();
  items.forEach((el) => {
    const section = el.closest("section") || document.body;
    const n = seen.get(section) || 0;
    el.style.setProperty("--e", String(n));
    seen.set(section, n + 1);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      en.target.classList.add("is-in");
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  document.documentElement.classList.add("has-enter");
  items.forEach((el) => io.observe(el));
})();
