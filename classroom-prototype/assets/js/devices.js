/* Every device: the same class on an iPhone, an Android phone and a desktop browser. */
(function () {
  "use strict";
  const C = window.Chalk;
  const D = window.CHALK_DATA;
  const $ = (id) => document.getElementById(id);

  const ios = C.boardView($("ios-board"), { prefix: "dvios", role: "student", label: "Board on iPhone" });
  const android = C.boardView($("android-board"), { prefix: "dvand", role: "student", label: "Board on Android" });
  const desk = C.room($("desk-room"), { prefix: "dvdesk", role: "student", label: "Whole classroom on desktop" });
  const boards = [ios.board, android.board, desk.board];
  const each = (fn) => boards.forEach((b) => fn(b));
  D.board.items.forEach((it) => each((b) => (it.type === "path" ? b.addPath(it) : b.addText(it))));
  each((b) => b.setMode("whole"));

  const ranges = [
    { from: 1000, to: 2500, update: (p) => each((b) => b.reveal("title", p)) },
    { from: 3000, to: 5500, update: (p) => each((b) => b.reveal("eq", p)) },
    { from: 6000, to: 6600, update: (p) => each((b) => b.reveal("arrow", p)) },
    { from: 6600, to: 7000, update: (p) => each((b) => b.reveal("light", p)) },
    { from: 8000, to: 9200, update: (p) => each((b) => b.reveal("lbl-light", p)) },
    { from: 9200, to: 10000, update: (p) => each((b) => b.reveal("lbl-light-2", p)) },
    { from: 11000, to: 12000, update: (p) => each((b) => b.reveal("lbl-calvin", p)) },
    { from: 12000, to: 12800, update: (p) => each((b) => b.reveal("lbl-calvin-2", p)) }
  ];
  const steps = [
    { at: 0, run: () => { desk.reset(); $("cue").textContent = "Press Play. All three devices run the same class."; } },
    { at: 800, run: () => desk.teacher.writeAt(180, 40, 700) },
    { at: 3000, run: () => desk.teacher.writeAt(170, 112, 700) },
    { at: 8000, run: () => desk.teacher.writeAt(60, 192, 800) },
    { at: 14000, run: () => desk.teacher.idle(900) },
    { at: 15000, run: () => { $("ios-note").textContent = "A student circles the O₂. The question goes to the teacher, not the board."; $("android-note").textContent = "Questions are private. The board never changes for them."; } },
    { at: 17000, run: () => { $("cue").textContent = "Layout changes with the screen. The class and the timeline stay the same."; } }
  ];

  const demo = DemoEngine.create({
    duration: 20000,
    steps,
    ranges,
    onReset: () => desk.reset(),
    onPlayState: (playing) => desk.setPaused(!playing)
  });
  DemoEngine.bind(document.querySelector(".demo-bar"), demo);
  demo.reset();
})();
