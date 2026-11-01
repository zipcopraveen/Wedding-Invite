/* ==========================================================================
   reveal.js  |  the date chapter
   The section is tall and its content is sticky. Scrolling draws the kolam;
   when the last ring closes, the date rises out of the centre.
   - Date text is built from config.js, formatted in IST.
   - Reduced motion: no pinning, kolam already drawn, date visible.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const cfg = window.WEDDING;
  const M = window.WeddingMandala;
  const sec = document.getElementById("date");
  const host = document.getElementById("date-mandala");
  const card = document.getElementById("date-card");
  const hint = document.getElementById("date-hint");
  if (!sec || !host || !card) return;

  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const svg = M.create();
  host.appendChild(svg);

  /* Date card ------------------------------------------------------------------ */
  function line(cls, text, lang) {
    const p = document.createElement("p");
    p.className = cls;
    if (lang) p.lang = lang;
    const mask = document.createElement("span");
    mask.className = "mask";
    const inner = document.createElement("span");
    inner.textContent = text;
    mask.appendChild(inner);
    p.appendChild(mask);
    return p;
  }

  function renderCard() {
    const ev = cfg.reception;
    const date = U.istToUTCDate(ev.datetimeIST);
    const lines = [];

    lines.push(line("date__event", ev.title));
    if (date) {
      const fmt = (o) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(date);
      lines.push(line("date__day display", fmt({ day: "numeric" })));
      lines.push(line("date__month display", fmt({ month: "long", year: "numeric" })));
      lines.push(line("date__time", `${fmt({ weekday: "long" })} at ${fmt({ hour: "numeric", minute: "2-digit", hour12: true })}`));
    } else {
      lines.push(line("date__pending display", "Date to be announced"));
    }

    lines.forEach((p, i) => p.querySelector(".mask > span").style.setProperty("--d", i * 110));
    card.replaceChildren(...lines);
  }
  renderCard();

  /* Reduced motion: show everything, no scroll choreography ------------------ */
  if (U.prefersReducedMotion() || !window.WeddingMotion) {
    M.setProgress(svg, 1);
    sec.classList.add("is-complete", "is-static");
    if (hint) hint.hidden = true;
    return;
  }

  /* Scroll-driven drawing -------------------------------------------------------- */
  let p = 0;
  let lastDraw = -1;
  let complete = false;

  window.WeddingMotion.on((s) => {
    const r = sec.getBoundingClientRect();
    const total = r.height - s.vh;
    const target = clamp(-r.top / total);
    p += (target - p) * 0.24;
    if (Math.abs(target - p) < 0.0004) p = target;

    const draw = clamp(p / 0.5);
    if (draw === lastDraw) return;
    lastDraw = draw;

    M.setProgress(svg, draw);
    svg.style.transform = `rotate(${(draw * 26).toFixed(2)}deg)`;
    if (hint) hint.style.opacity = String(clamp(1 - draw * 9).toFixed(2));

    const nowComplete = draw >= (complete ? 0.93 : 0.985);
    if (nowComplete !== complete) {
      complete = nowComplete;
      sec.classList.toggle("is-complete", complete);
    }
  });
})();
