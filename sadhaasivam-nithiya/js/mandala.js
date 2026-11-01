/* ==========================================================================
   mandala.js  |  the kolam: a lotus mandala drawn from nine rings
   Used twice: as a slow backdrop in the hero (drawn by CSS on load) and in
   the date chapter (drawn by scroll, see reveal.js).
   Every path has pathLength="1", so one dash value draws any ring.
   The centre is left empty on purpose: that is where the date goes.
   ========================================================================== */

(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const C = 500;
  const TAU = Math.PI * 2;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const f = (n) => n.toFixed(1);
  const pol = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];

  // a petal: lens shape from an inner point to an outer tip and back
  function petal(ri, ro, a, w, rm) {
    const [x0, y0] = pol(ri, a);
    const [x1, y1] = pol(ro, a);
    const [c1x, c1y] = pol(rm, a - w);
    const [c2x, c2y] = pol(rm, a + w);
    return `M${f(x0)} ${f(y0)}Q${f(c1x)} ${f(c1y)} ${f(x1)} ${f(y1)}Q${f(c2x)} ${f(c2y)} ${f(x0)} ${f(y0)}`;
  }

  const circle = (r) =>
    `M${f(C + r)} ${C}A${r} ${r} 0 1 1 ${f(C - r)} ${C}A${r} ${r} 0 1 1 ${f(C + r)} ${C}`;

  // a ring of small arcs bulging outward
  function scallops(r, n, depth) {
    const chord = 2 * r * Math.sin(Math.PI / n);
    const rr = (chord / 2) * depth;
    let d = "";
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pol(r, (TAU * i) / n);
      const [x1, y1] = pol(r, (TAU * (i + 1)) / n);
      d += `M${f(x0)} ${f(y0)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x1)} ${f(y1)}`;
    }
    return d;
  }

  // inside to outside; `fill` rings glow softly once the drawing is complete
  const RINGS = [
    { paths: () => [circle(188), circle(197)] },
    { paths: () => range(12).map((i) => petal(197, 270, (TAU * i) / 12, 0.3, 240)), fill: true },
    { paths: () => range(12).map((i) => petal(197, 246, (TAU * (i + 0.5)) / 12, 0.2, 228)) },
    { paths: () => [circle(280)], dots: { n: 36, r: 294, size: 2.8 } },
    { paths: () => [scallops(308, 24, 1.18)] },
    { paths: () => range(24).map((i) => petal(320, 382, (TAU * (i + 0.5)) / 24, 0.13, 354)), fill: true },
    { paths: () => [circle(390)], dots: { n: 48, r: 404, size: 2.3 } },
    { paths: () => range(48).map((i) => petal(414, 450, (TAU * i) / 48, 0.07, 434)) },
    { paths: () => [circle(462), circle(472)] }
  ];

  const el = (name) => document.createElementNS(NS, name);

  function create() {
    const svg = el("svg");
    svg.setAttribute("viewBox", "0 0 1000 1000");
    svg.setAttribute("class", "mandala");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    svg._rings = RINGS.map((def, ri) => {
      const g = el("g");
      g.setAttribute("class", "mandala__ring");
      g.style.setProperty("--r", ri);
      svg.appendChild(g);
      const item = { paths: [], dots: [], last: -1 };

      def.paths().forEach((d) => {
        const p = el("path");
        p.setAttribute("d", d);
        p.setAttribute("pathLength", "1");
        if (def.fill) p.setAttribute("class", "is-fill");
        g.appendChild(p);
        item.paths.push(p);
      });

      if (def.dots) {
        for (let k = 0; k < def.dots.n; k++) {
          const [x, y] = pol(def.dots.r, (TAU * k) / def.dots.n);
          const c = el("circle");
          c.setAttribute("cx", f(x));
          c.setAttribute("cy", f(y));
          c.setAttribute("r", def.dots.size);
          c.setAttribute("class", "mandala__dot");
          c.style.setProperty("--k", k);
          g.appendChild(c);
          item.dots.push(c);
        }
      }
      return item;
    });
    return svg;
  }

  /** p runs 0 to 1. Rings draw one after another with a little overlap. */
  function setProgress(svg, p) {
    const rings = svg._rings;
    const R = rings.length;
    rings.forEach((item, i) => {
      const start = (i / R) * 0.74;
      const t = clamp((p - start) / 0.3);
      const e = 1 - Math.pow(1 - t, 3);
      if (item.last === e) return;
      item.last = e;
      const off = String(1 - e);
      item.paths.forEach((path) => { path.style.strokeDashoffset = off; });
      const n = item.dots.length;
      item.dots.forEach((d, k) => { d.style.opacity = clamp(e * 1.6 - (k / n) * 0.6).toFixed(2); });
    });
  }

  window.WeddingMandala = { create, setProgress };
})();
