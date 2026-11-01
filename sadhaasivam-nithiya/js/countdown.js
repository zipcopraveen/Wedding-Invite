/* ==========================================================================
   countdown.js  |  odometer-style digit roll, IST-aware
   - Target comes from config.js (IST) via WeddingUtils.istToUTCDate.
   - Each digit is a column of 0 to 9 that slides; only changed digits move.
   - With no date set the row shows dimmed zeros and a short note.
   ========================================================================== */

(function () {
  "use strict";
  const U = window.WeddingUtils;
  const cfg = window.WEDDING;
  const root = document.getElementById("cd");
  const note = document.getElementById("cd-note");
  const live = document.getElementById("cd-sr");
  if (!root) return;

  const target = U.istToUTCDate(cfg.reception.datetimeIST);
  const units = {};

  root.querySelectorAll(".cd__unit").forEach((el) => {
    units[el.dataset.unit] = { el, digits: el.querySelector(".cd__digits"), length: 0, slots: [] };
  });

  function build(unit, length) {
    unit.digits.innerHTML = "";
    unit.slots = [];
    unit.length = length;
    for (let i = 0; i < length; i++) {
      const slot = document.createElement("span");
      slot.className = "cd__slot";
      const roll = document.createElement("span");
      roll.className = "cd__roll";
      for (let d = 0; d < 10; d++) {
        const s = document.createElement("span");
        s.textContent = d;
        roll.appendChild(s);
      }
      slot.appendChild(roll);
      unit.digits.appendChild(slot);
      unit.slots.push({ roll, value: -1 });
    }
  }

  function setUnit(name, value) {
    const unit = units[name];
    if (!unit) return;
    const text = String(value).padStart(2, "0");
    if (text.length !== unit.length) build(unit, text.length);
    for (let i = 0; i < text.length; i++) {
      const d = Number(text[i]);
      const slot = unit.slots[i];
      if (slot.value !== d) {
        slot.value = d;
        slot.roll.style.setProperty("--d", d);
      }
    }
  }

  function setAll(days, hours, minutes, seconds) {
    setUnit("days", days);
    setUnit("hours", hours);
    setUnit("minutes", minutes);
    setUnit("seconds", seconds);
  }

  let lastAnnounced = "";
  function tick() {
    if (!target) return;
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      setAll(0, 0, 0, 0);
      root.dataset.state = "done";
      if (note) note.textContent = "The celebrations have begun. Thank you for being with us.";
      clearInterval(timer);
      return;
    }
    const total = Math.floor(diff / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    setAll(days, hours, minutes, seconds);

    // Screen readers get one calm update per minute, not a tick per second.
    const spoken = `${days} days, ${hours} hours and ${minutes} minutes to go`;
    if (live && spoken !== lastAnnounced) { live.textContent = spoken; lastAnnounced = spoken; }
  }

  let timer = null;
  if (!target) {
    root.dataset.state = "pending";
    setAll(0, 0, 0, 0);
    if (note) note.textContent = "The countdown begins as soon as the date is announced.";
  } else {
    root.dataset.state = "running";
    tick();
    timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
  }
})();
