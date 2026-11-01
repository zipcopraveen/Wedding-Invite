/* ==========================================================================
   touch-magic.js  |  a small burst of gold sparkles where you tap
   Throttled, capped, and it skips buttons, links, the curtains, the gallery
   and the viewer so it never competes with a real control.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  if (U.prefersReducedMotion() || !document.body.animate) return;

  const SKIP = "a, button, input, textarea, select, iframe, .date, .slideshow, .lb, .envelope, [data-no-magic]";
  const MAX_ACTIVE = 36;
  const THROTTLE_MS = 140;
  let last = 0;
  let active = 0;

  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(SKIP)) return;
    const now = performance.now();
    if (now - last < THROTTLE_MS) return;
    last = now;

    const count = 8;
    for (let i = 0; i < count && active < MAX_ACTIVE; i++) {
      const p = document.createElement("span");
      const star = i % 2 === 0;
      const size = 6 + Math.random() * 8;
      p.className = "spark " + (star ? "spark--star" : "spark--diamond");
      p.style.width = p.style.height = size + "px";
      p.style.left = e.clientX - size / 2 + "px";
      p.style.top = e.clientY - size / 2 + "px";
      document.body.appendChild(p);
      active++;

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 28 + Math.random() * 38;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 10;
      const spin = (star ? 0 : 45) + (Math.random() * 90 - 45);
      const anim = p.animate(
        [
          { transform: `translate(0, 0) rotate(${star ? 0 : 45}deg) scale(1)`, opacity: 1 },
          { transform: `translate(${dx}px, ${dy + 14}px) rotate(${spin}deg) scale(0.2)`, opacity: 0 }
        ],
        { duration: 700 + Math.random() * 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
      anim.onfinish = () => { p.remove(); active--; };
    }
  }, { passive: true });
})();
