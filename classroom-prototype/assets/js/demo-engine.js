/*
 * DemoEngine: a shared scripted timeline with Play, Pause, Restart and scrubbing.
 *
 * create({
 *   duration,            // ms
 *   steps: [{ at, run }] // one-off triggers, fired once when the playhead passes `at`
 *   ranges: [{ from, to, update(p) }] // p runs 0..1 across [from, to]; state is derived from time,
 *                                      // so pausing, seeking and restarting stay correct
 *   onReset(), onFrame(t), onPlayState(playing)
 * })
 * bind(barElement, engine) wires [data-action="play|pause|restart"] buttons and a range input.
 */
(function () {
  "use strict";

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function create(opts) {
    const duration = opts.duration;
    const steps = (opts.steps || []).slice().sort((a, b) => a.at - b.at);
    const ranges = opts.ranges || [];
    let bar = null;
    let t = 0;
    let next = 0;
    let playing = false;
    let last = 0;
    let raf = 0;

    function fireSteps() {
      while (next < steps.length && steps[next].at <= t) {
        try { steps[next].run(); } catch (err) { console.error("[demo step]", err); }
        next += 1;
      }
    }

    function renderRanges() {
      for (const r of ranges) {
        const p = clamp((t - r.from) / Math.max(1, r.to - r.from), 0, 1);
        // Only write when the value changes, so a finished range doesn't overwrite later manual input.
        if (p === r.lastP) continue;
        r.lastP = p;
        try { r.update(p, t); } catch (err) { console.error("[demo range]", err); }
      }
    }

    function frame() {
      if (opts.onFrame) opts.onFrame(t, duration);
      renderRanges();
      bar && bar.sync(t, duration, playing);
    }

    function setPlaying(v) {
      playing = v;
      if (opts.onPlayState) opts.onPlayState(v);
      bar && bar.sync(t, duration, playing);
    }

    function tick(now) {
      if (!playing) return;
      const dt = now - last;
      last = now;
      t = Math.min(duration, t + dt);
      fireSteps();
      frame();
      if (t >= duration) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function pause() {
      if (!playing) return;
      cancelAnimationFrame(raf);
      setPlaying(false);
    }

    function play() {
      if (playing) return;
      if (t >= duration) restart(false);
      setPlaying(true);
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    function seek(target) {
      const wasPlaying = playing;
      cancelAnimationFrame(raf);
      playing = false;
      t = clamp(target, 0, duration);
      next = 0;
      if (opts.onReset) opts.onReset();
      fireSteps();
      frame();
      if (wasPlaying) play(); else setPlaying(false);
    }

    function restart(autoplay = true) {
      cancelAnimationFrame(raf);
      playing = false;
      t = 0;
      next = 0;
      if (opts.onReset) opts.onReset();
      fireSteps();
      frame();
      if (autoplay) play(); else setPlaying(false);
    }

    function reset() {
      cancelAnimationFrame(raf);
      playing = false;
      t = 0;
      next = 0;
      if (opts.onReset) opts.onReset();
      fireSteps();
      frame();
      setPlaying(false);
    }

    const api = {
      duration,
      play, pause, restart, seek, reset,
      toggle() { playing ? pause() : play(); },
      get time() { return t; },
      get playing() { return playing; },
      get ended() { return t >= duration; }
    };

    // Ranges always need a first render, even before anyone presses Play.
    renderRanges();
    if (opts.onFrame) opts.onFrame(0, duration);

    api._attachBar = (b) => { bar = b; b.sync(t, duration, playing); };
    return api;
  }

  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  }

  // Wire a `.demo-bar` element to an engine.
  function bind(bar, engine, labels) {
    if (!bar || !engine) return;
    const L = Object.assign({ play: "Play", pause: "Pause", restart: "Restart" }, labels || {});
    const playBtn = bar.querySelector('[data-action="play"]');
    const restartBtn = bar.querySelector('[data-action="restart"]');
    const range = bar.querySelector('input[type="range"]');
    const time = bar.querySelector(".time");
    let dragging = false;

    playBtn && playBtn.addEventListener("click", () => {
      if (engine.playing) engine.pause();
      else if (engine.ended) engine.restart(true);
      else engine.play();
    });
    restartBtn && restartBtn.addEventListener("click", () => engine.restart(true));
    if (range) {
      range.max = String(engine.duration);
      range.step = "50";
      range.addEventListener("pointerdown", () => { dragging = true; engine.pause(); });
      range.addEventListener("input", () => { engine.seek(Number(range.value)); });
      range.addEventListener("change", () => { dragging = false; });
    }

    const sync = (t, duration, playing) => {
      if (playBtn) {
        const label = playing ? L.pause : engine.ended ? "Replay" : L.play;
        playBtn.textContent = label;
        playBtn.setAttribute("aria-label", label);
        playBtn.classList.toggle("btn-primary", !playing);
      }
      if (range && !dragging) range.value = String(Math.round(t));
      if (time) time.textContent = `${fmt(t)} / ${fmt(duration)}`;
    };

    engine._attachBar({ sync });
  }

  window.DemoEngine = { create, bind, fmt, reduceMotion };
})();
