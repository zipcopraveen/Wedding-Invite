/* ==========================================================================
   animations.js  |  scroll progress line
   Animates transform: scaleX (never width) from the shared frame in motion.js.
   ========================================================================== */

(function () {
  "use strict";
  const bar = document.getElementById("progress");
  if (!bar || !window.WeddingMotion) return;
  let last = -1;

  window.WeddingMotion.on((s) => {
    const max = document.documentElement.scrollHeight - s.vh;
    const ratio = max > 0 ? Math.min(1, Math.max(0, s.y / max)) : 0;
    if (Math.abs(ratio - last) < 0.0005) return;
    last = ratio;
    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
  });
})();
