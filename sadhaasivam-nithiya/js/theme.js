/* ==========================================================================
   theme.js  |  applies WEDDING.theme and fills the document title
   Load after config.js and before any section module.
   ========================================================================== */

(function () {
  "use strict";
  const cfg = window.WEDDING;
  if (!cfg) return;

  document.documentElement.setAttribute("data-theme", cfg.theme || "zari");

  // Allow ?theme=name in the URL while comparing themes locally.
  const requested = new URLSearchParams(window.location.search).get("theme");
  if (requested) document.documentElement.setAttribute("data-theme", requested);

  // Font set: config.font, or ?font=script|soft|classic while comparing locally.
  const fontParam = new URLSearchParams(window.location.search).get("font");
  document.documentElement.setAttribute("data-font", fontParam || cfg.font || "editorial");

  // Signature settings declared by the theme, exposed to section modules.
  const rootStyle = getComputedStyle(document.documentElement);
  document.documentElement.dataset.galleryTransition =
    rootStyle.getPropertyValue("--gallery-transition").trim() || "fade";

  const { partner1, partner2 } = cfg.couple;
  document.title = `${partner1.name} & ${partner2.name} | Wedding Reception`;

  // Fill any element marked data-wedding="partner1" | "partner2"
  const map = {
    partner1: partner1.name,
    partner2: partner2.name
  };
  document.querySelectorAll("[data-wedding]").forEach((el) => {
    const value = map[el.dataset.wedding];
    if (value) el.textContent = value;
  });
})();
