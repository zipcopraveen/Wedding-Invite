/* ==========================================================================
   audio.js  |  background music
   - Off until config.music.enabled is true (needs a licensed track at
     config.music.src). While off, the toggle button stays hidden.
   - Browsers block autoplay, so music starts on the first tap or key press.
   - The toggle is excluded from that first-gesture listener, otherwise play
     and pause race each other. The icon follows real play and pause events.
   - Pauses when the tab is hidden and resumes only if the guest had not
     muted it. The choice is remembered in localStorage.
   ========================================================================== */

(function () {
  "use strict";
  const cfg = window.WEDDING;
  const btn = document.getElementById("music-toggle");
  if (!btn || !cfg.music || !cfg.music.enabled) return;

  const KEY = "wedding-music-muted";
  const store = {
    get() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } },
    set(v) { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) { /* private mode */ } }
  };

  const audio = new Audio(cfg.music.src);
  audio.loop = true;
  audio.preload = "none";
  audio.volume = 0.6;
  let mutedByUser = store.get();

  btn.hidden = false;

  function paint() {
    const playing = !audio.paused;
    btn.dataset.state = playing ? "on" : "off";
    btn.setAttribute("aria-pressed", String(playing));
    btn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
  }
  audio.addEventListener("play", paint);
  audio.addEventListener("pause", paint);
  paint();

  function tryPlay() { audio.play().catch(() => { /* blocked until a gesture */ }); }

  // First gesture anywhere (except the toggle itself) starts the music.
  const unlock = (e) => {
    if (btn.contains(e.target)) return;
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlock, true);
    if (!mutedByUser) tryPlay();
  };
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

  btn.addEventListener("click", () => {
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlock, true);
    if (audio.paused) { mutedByUser = false; store.set(false); tryPlay(); }
    else { mutedByUser = true; store.set(true); audio.pause(); }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) audio.pause();
    else if (!mutedByUser && audio.currentTime > 0) tryPlay();
  });
})();
