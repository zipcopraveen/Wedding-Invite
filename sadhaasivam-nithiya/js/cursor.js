/* ==========================================================================
   cursor.js  |  a round label that follows the pointer over things that open
   Desktop with a mouse only. Any element with data-cursor="Open" triggers it;
   the attribute can change while the page runs (the gallery does this).
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const el = document.getElementById("cursor");
  if (!el || !U.hasHover() || !window.WeddingMotion) return;

  document.documentElement.classList.add("has-cursor");
  const label = el.querySelector("span");
  let tx = -200, ty = -200, x = tx, y = ty, s = 0, ts = 0;

  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    tx = e.clientX; ty = e.clientY;
    const t = e.target.closest ? e.target.closest("[data-cursor]") : null;
    if (t && t.dataset.cursor) { label.textContent = t.dataset.cursor; ts = 1; }
    else ts = 0;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ts = 0; });
  document.addEventListener("lightbox:opened", () => { ts = 0; });

  window.WeddingMotion.on(() => {
    x += (tx - x) * 0.2;
    y += (ty - y) * 0.2;
    s += (ts - s) * 0.18;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.toFixed(3)})`;
    el.style.opacity = s > 0.02 ? "1" : "0";
  });
})();
