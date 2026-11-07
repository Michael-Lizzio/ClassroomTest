/* Present mode: projector screen, slides from notes, and captions timed to a scripted transcript. */
(function () {
  "use strict";
  const C = window.Chalk;
  const D = window.CHALK_DATA;
  const $ = (id) => document.getElementById(id);

  const room = C.room($("present-room"), { prefix: "pres", role: "student", label: "Classroom in present mode: projector screen over the whiteboard" });
  D.board.items.forEach((it) => {
    const spec = Object.assign({}, it, { full: true });
    if (it.type === "path") room.board.addPath(spec); else room.board.addText(spec);
  });

  const notes = D.notes;
  const TRANSCRIPT_MS_PER_SECOND = 500; // two minutes of speech play back in one minute
  const DURATION = 60000;
  const state = { slide: 0, down: false, captions: true };

  /* ----- slides and screen ----- */
  function showSlide(i) {
    state.slide = Math.max(0, Math.min(notes.length - 1, i));
    const n = notes[state.slide];
    room.screen.setSlide({ title: n.title, lines: n.lines.slice(0, 3) }, state.slide, notes.length);
    $("slide-count").textContent = `Slide ${state.slide + 1} of ${notes.length}`;
    document.querySelectorAll(".slide-thumb").forEach((b, idx) => b.setAttribute("aria-current", String(idx === state.slide)));
    $("prev-slide").disabled = state.slide === 0;
    $("next-slide").disabled = state.slide === notes.length - 1;
  }
  function setScreen(down, instant) {
    state.down = down;
    const btn = $("toggle-screen");
    btn.setAttribute("aria-pressed", String(down));
    btn.textContent = down ? "Pull screen up" : "Pull screen down";
    if (down) room.screen.down(instant ? 1 : 1100); else room.screen.up(instant ? 1 : 900);
    $("cue").textContent = down ? "The screen is down. Slides show on the board." : "The screen is up. The whiteboard is back.";
  }

  // Slide thumbnails are real buttons, so keyboard users can jump straight to any slide.
  const strip = $("slide-strip");
  notes.forEach((n, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "slide-thumb";
    b.setAttribute("aria-label", `Go to slide ${i + 1}: ${n.title}`);
    b.textContent = `${i + 1}. ${n.title}`;
    b.style.font = "inherit";
    b.style.padding = "8px";
    b.style.fontSize = "var(--fs-xs)";
    b.style.fontWeight = "700";
    b.addEventListener("click", () => { showSlide(i); if (!state.down) setScreen(true); });
    strip.append(b);
  });

  $("prev-slide").addEventListener("click", () => showSlide(state.slide - 1));
  $("next-slide").addEventListener("click", () => showSlide(state.slide + 1));
  $("toggle-screen").addEventListener("click", () => setScreen(!state.down));
  $("toggle-captions").addEventListener("click", () => setCaptions(!state.captions));

  /* ----- captions ----- */
  const bar = $("caption-bar");
  const capText = $("caption-text");
  const T = D.transcript;
  function captionAt(ms) {
    let idx = -1;
    for (let i = 0; i < T.length; i++) if (T[i].t * TRANSCRIPT_MS_PER_SECOND <= ms) idx = i;
    if (idx < 0) return { text: "", frac: 0 };
    const start = T[idx].t * TRANSCRIPT_MS_PER_SECOND;
    const end = idx + 1 < T.length ? T[idx + 1].t * TRANSCRIPT_MS_PER_SECOND : DURATION;
    // Type out over at most three seconds of each line, then hold it.
    const typeEnd = start + Math.min(3000, (end - start) * 0.8);
    const frac = Math.min(1, Math.max(0, (ms - start) / Math.max(1, typeEnd - start)));
    return { text: T[idx].text, frac };
  }
  function renderCaption(ms) {
    if (!state.captions) return;
    const c = captionAt(ms);
    const chars = Array.from(c.text);
    capText.textContent = chars.slice(0, Math.round(chars.length * c.frac)).join("");
  }
  function setCaptions(on) {
    state.captions = on;
    $("toggle-captions").setAttribute("aria-pressed", String(on));
    $("toggle-captions").textContent = on ? "Captions on" : "Captions off";
    bar.classList.toggle("is-off", !on);
    if (on) {
      renderCaption(currentMs);
    } else {
      capText.textContent = "Captions are off. Students can turn them on for live text.";
    }
  }

  /* ----- timeline ----- */
  let currentMs = 0;
  const steps = [
    { at: 0, run: () => { room.screen.reset(); showSlide(0); setScreen(false, true); } },
    { at: 1000, run: () => setScreen(true) },
    { at: 9000, run: () => showSlide(1) },
    { at: 19000, run: () => showSlide(2) },
    { at: 28500, run: () => showSlide(3) },
    { at: 38500, run: () => showSlide(4) },
    { at: 48000, run: () => showSlide(5) },
    { at: 56000, run: () => setScreen(false) },
    { at: 58000, run: () => { $("cue").textContent = "End of the excerpt. Restart to play it again."; } }
  ];
  const ranges = [
    { from: 0, to: DURATION, update: (p, t) => { currentMs = t; renderCaption(t); } }
  ];

  const demo = DemoEngine.create({
    duration: DURATION,
    steps,
    ranges,
    onReset: () => { room.reset(); currentMs = 0; },
    onPlayState: (playing) => room.setPaused(!playing)
  });
  DemoEngine.bind(document.querySelector(".demo-bar"), demo);
  showSlide(0);
  setCaptions(true);
  demo.reset();
})();
