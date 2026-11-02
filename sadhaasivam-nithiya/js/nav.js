/* ==========================================================================
   nav.js  |  the plain bar at the top
   - The monogram comes from config.js (initials of the two names).
   - Links to a section that is switched off (no photos, guestbook off) hide.
   - "Add to calendar" appears only when the reception section built its
     calendar button (so only once a date is set) and simply presses it.
   - The link for the section being read is marked with aria-current.
   Everything else (smooth scrolling to the links) is motion.js.
   ========================================================================== */

(function () {
  "use strict";
  const nav = document.getElementById("nav");
  if (!nav) return;
  const cfg = window.WEDDING || {};

  /* Monogram ------------------------------------------------------------------ */
  const mark = document.getElementById("nav-mark");
  const c = cfg.couple;
  if (mark && c && c.partner1 && c.partner2 && c.partner1.name && c.partner2.name) {
    mark.textContent = `${[...c.partner1.name][0]} & ${[...c.partner2.name][0]}`;
  }

  /* Links to sections that exist -------------------------------------------- */
  const links = [...nav.querySelectorAll("a[data-section]")];
  links.forEach((a) => {
    const target = document.getElementById(a.dataset.section);
    if (!target || target.hidden) a.parentElement.hidden = true;
  });

  /* The one action -------------------------------------------------------------- */
  const action = document.getElementById("nav-action");
  const ics = document.getElementById("rec-ics");
  if (action && ics) {
    action.hidden = false;
    action.addEventListener("click", () => ics.click());
  }

  /* Where the reader is --------------------------------------------------------- */
  if (!("IntersectionObserver" in window)) return;
  const byId = new Map();
  links.forEach((a) => {
    byId.set(a.dataset.section, a);
    if (a.dataset.also) byId.set(a.dataset.also, a);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const link = byId.get(en.target.id);
      links.forEach((a) => {
        if (a === link) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });      // the middle of the screen

  byId.forEach((_, id) => {
    const el = document.getElementById(id);
    if (el && !el.hidden) io.observe(el);
  });
})();
