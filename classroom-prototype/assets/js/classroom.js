/* Classroom, student view: scripted lesson build, area reveal, and the student's own questions. */
(function () {
  "use strict";
  const C = window.Chalk;
  const D = window.CHALK_DATA;
  const frame = document.getElementById("room-frame");
  const room = C.room(frame, { prefix: "cls", role: "student", label: "Classroom: Ms. Okafor at the whiteboard, seated students in front" });
  const board = room.board;
  const cue = document.getElementById("cue");
  const areaStatus = document.getElementById("area-status");
  const myQ = document.getElementById("my-questions");

  // Lesson items start blank and are typed or drawn by the timeline ranges.
  D.board.items.forEach((it) => (it.type === "path" ? board.addPath(it) : board.addText(it)));

  function setCue(msg) { cue.textContent = msg; }

  function renderMyQ(status) {
    myQ.replaceChildren();
    if (!status) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "Nothing yet. Tap or circle the board to ask.";
      myQ.append(li);
      return;
    }
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = "Does the O₂ come from the CO₂ or from the water?";
    const chip = document.createElement("span");
    chip.className = "chip " + (status === "answered" ? "chip-done" : "chip-new");
    chip.textContent = status === "answered" ? "Answered" : "Sent privately";
    li.append(span, chip);
    myQ.append(li);
  }

  const ranges = [
    { from: 2000, to: 4200, update: (p) => board.reveal("title", p) },
    { from: 4800, to: 8000, update: (p) => board.reveal("eq", p) },
    { from: 8800, to: 9400, update: (p) => board.reveal("arrow", p) },
    { from: 9400, to: 9900, update: (p) => board.reveal("light", p) },
    { from: 10800, to: 12200, update: (p) => board.reveal("lbl-light", p) },
    { from: 12200, to: 13200, update: (p) => board.reveal("lbl-light-2", p) },
    { from: 14200, to: 15500, update: (p) => board.reveal("lbl-calvin", p) },
    { from: 15500, to: 16400, update: (p) => board.reveal("lbl-calvin-2", p) }
  ];

  const steps = [
    {
      at: 0,
      run: () => {
        board.setMode("grid");
        board.setHidden("br", true);
        areaStatus.textContent = "Calvin cycle is hidden. Your teacher will reveal it.";
        renderMyQ(null);
        setCue("Press Play to watch the lesson build on the board.");
      }
    },
    { at: 1000, run: () => { setCue("Ms. Okafor walks to the board."); room.teacher.writeAt(180, 40, 900); } },
    { at: 2000, run: () => setCue("She writes the title, letter by letter, in time with her arm.") },
    { at: 4400, run: () => { setCue("The equation goes up next."); room.teacher.writeAt(170, 112, 700); } },
    { at: 8400, run: () => { setCue("Light goes above the arrow."); room.teacher.writeAt(330, 100, 700); } },
    { at: 10200, run: () => { setCue("Labels for the light reactions, bottom left."); room.teacher.writeAt(60, 192, 800); } },
    { at: 13600, run: () => { setCue("The Calvin cycle goes in the bottom-right area. Students can't see it yet."); room.teacher.writeAt(300, 192, 800); } },
    { at: 17000, run: () => { setCue("She steps back. The hidden area stays hidden."); room.teacher.idle(900); } },
    { at: 22000, run: () => { setCue("You circle the O₂ and ask a question. Only the teacher gets it."); renderMyQ("sent"); } },
    {
      at: 26000,
      run: () => {
        board.setHidden("br", false);
        areaStatus.textContent = "Calvin cycle is now visible.";
        setCue("The teacher reveals the Calvin cycle. Everyone sees it now.");
      }
    },
    { at: 30000, run: () => { renderMyQ("answered"); setCue("Your teacher answers your question privately."); } },
    { at: 38000, run: () => setCue("Lesson loop complete. Restart to watch it again.") }
  ];

  const demo = DemoEngine.create({
    duration: 40000,
    steps,
    ranges,
    onReset: () => room.reset(),
    onPlayState: (playing) => room.setPaused(!playing)
  });
  DemoEngine.bind(document.querySelector(".demo-bar"), demo);
  demo.reset(); // apply the opening state

  // Student / Teacher view switch.
  const btnStudent = document.getElementById("view-student");
  const btnTeacher = document.getElementById("view-teacher");
  const studentPanel = document.getElementById("student-panel");
  const teacherPanel = document.getElementById("teacher-panel");
  const qSection = document.getElementById("my-q-title").closest("section");

  function setView(view) {
    const teacher = view === "teacher";
    frame.classList.toggle("is-teacher", teacher);
    board.setRole(teacher ? "teacher" : "student");
    btnStudent.setAttribute("aria-pressed", String(!teacher));
    btnTeacher.setAttribute("aria-pressed", String(teacher));
    studentPanel.hidden = teacher;
    qSection.hidden = teacher;
    teacherPanel.hidden = !teacher;
  }
  btnStudent.addEventListener("click", () => setView("student"));
  btnTeacher.addEventListener("click", () => setView("teacher"));
  renderMyQ(null);
  setView("student");
})();
