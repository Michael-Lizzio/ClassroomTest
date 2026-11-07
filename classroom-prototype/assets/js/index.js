/* Overview hero: a short looping lesson build. Purely decorative; it restarts itself. */
(function () {
  "use strict";
  const C = window.Chalk;
  const D = window.CHALK_DATA;
  const frame = document.getElementById("hero-room");
  const room = C.room(frame, { prefix: "hero", role: "student", label: "Looping animation: the teacher writes the photosynthesis equation on the board" });
  const board = room.board;
  D.board.items.forEach((it) => (it.type === "path" ? board.addPath(it) : board.addText(it)));
  board.setMode("whole");

  const ranges = [
    { from: 1800, to: 3600, update: (p) => board.reveal("title", p) },
    { from: 4200, to: 7400, update: (p) => board.reveal("eq", p) },
    { from: 8000, to: 8600, update: (p) => board.reveal("arrow", p) },
    { from: 8600, to: 9100, update: (p) => board.reveal("light", p) },
    { from: 10000, to: 11400, update: (p) => board.reveal("lbl-light", p) },
    { from: 11400, to: 12300, update: (p) => board.reveal("lbl-light-2", p) },
    { from: 12800, to: 14000, update: (p) => board.reveal("lbl-calvin", p) },
    { from: 14000, to: 14800, update: (p) => board.reveal("lbl-calvin-2", p) }
  ];
  const steps = [
    { at: 800, run: () => room.teacher.writeAt(180, 40, 900) },
    { at: 4000, run: () => room.teacher.writeAt(170, 112, 700) },
    { at: 7800, run: () => room.teacher.writeAt(330, 100, 700) },
    { at: 9800, run: () => room.teacher.writeAt(60, 192, 800) },
    { at: 12600, run: () => room.teacher.writeAt(300, 192, 800) },
    { at: 15200, run: () => room.teacher.idle(900) }
  ];

  const demo = DemoEngine.create({
    duration: 17000,
    steps,
    ranges,
    onReset: () => room.reset(),
    onPlayState: (playing) => room.setPaused(!playing)
  });
  // Autoplay the loop. The hero is decoration, so it doesn't need a control bar.
  demo.restart(true);
  let waiting = false;
  setInterval(() => {
    if (demo.ended && !waiting) {
      waiting = true;
      setTimeout(() => { demo.restart(true); waiting = false; }, 1600);
    }
  }, 400);
})();
