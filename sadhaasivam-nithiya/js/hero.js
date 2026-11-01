/* ==========================================================================
   hero.js  |  the one entrance
   Names rise out of masks letter by letter while the kolam draws behind them.
   Waits for fonts (never more than 1.2 s) so letters do not jump, and waits
   for the envelope when a personalised link is open.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const hero = document.getElementById("hero");
  if (!hero) return;

  /* Split names into letters ------------------------------------------------ */
  let index = 0;
  hero.querySelectorAll(".names__word").forEach((word) => {
    const text = word.textContent;
    word.textContent = "";
    for (const char of text) {
      const span = document.createElement("span");
      span.className = "ch";
      span.style.setProperty("--i", index++);
      span.textContent = char;
      word.appendChild(span);
    }
  });

  /* Kolam backdrop ------------------------------------------------------------ */
  const host = document.getElementById("hero-mandala");
  const svg = window.WeddingMandala.create();
  host.appendChild(svg);
  if (U.prefersReducedMotion()) window.WeddingMandala.setProgress(svg, 1);

  /* Start ----------------------------------------------------------------------- */
  let started = false;
  function start() {
    if (started) return;
    started = true;
    hero.classList.add("is-ready");
  }

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  if (window.__envelopeOpened === false) {
    window.addEventListener("envelope:ready", () => { fontsReady.then(start); }, { once: true });
  } else {
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(start);
  }

  /* The kolam turns slowly as the page scrolls away ----------------------- */
  if (!U.prefersReducedMotion() && window.WeddingMotion) {
    let last = -1;
    window.WeddingMotion.on((s) => {
      if (s.y > s.vh * 1.4 || s.y === last) return;
      last = s.y;
      host.style.setProperty("--rot", (s.y * 0.03).toFixed(2) + "deg");
      host.style.setProperty("--lift", (s.y * -0.1).toFixed(1) + "px");
    });
  }
})();
