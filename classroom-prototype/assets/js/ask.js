/* Ask a question: a student circles the board, writes, sends; the teacher's inbox receives it. */
(function () {
  "use strict";
  const C = window.Chalk;
  const D = window.CHALK_DATA;
  const $ = (id) => document.getElementById(id);
  const chars = (s) => Array.from(s);
  const typed = (full, p) => chars(full).slice(0, Math.round(chars(full).length * p)).join("");
  const SCRIPT_Q = "Does the O₂ come from the CO₂ or from the water?";

  // Student board (drawable) and teacher board (snapshot source, never shown here).
  const studentView = C.boardView($("student-board"), { prefix: "askstu", role: "student", interactive: true, label: "Lesson board on the student's phone" });
  const teacherView = C.boardView(null, { prefix: "askteach", role: "teacher" });
  D.board.items.forEach((it) => {
    const spec = Object.assign({}, it, { full: true });
    [studentView.board, teacherView.board].forEach((b) => (it.type === "path" ? b.addPath(spec) : b.addText(spec)));
  });

  const composer = $("composer");
  const snapBox = $("composer-snap");
  const textArea = $("question-text");
  const sentNote = $("sent-note");
  const myList = $("my-questions");
  const cue = $("cue");
  let pending = null;   // { ring, region }
  let mine = [];        // student's own questions
  let counter = 0;
  let scriptId = null;

  const inbox = ChalkInbox.create($("inbox"), teacherView.board, {
    onChange: (s) => { $("inbox-count").textContent = `${s.open} new · ${s.done} answered`; }
  });

  function timeNow() {
    const d = new Date();
    return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function renderMine() {
    myList.replaceChildren();
    if (!mine.length) {
      const li = document.createElement("li");
      li.className = "muted";
      li.style.fontSize = "var(--fs-sm)";
      li.textContent = "None yet.";
      myList.append(li);
      return;
    }
    for (const q of mine) {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = q.text.length > 44 ? q.text.slice(0, 43) + "…" : q.text;
      const chip = document.createElement("span");
      chip.className = "chip " + (q.status === "done" ? "chip-done" : "chip-new");
      chip.textContent = q.status === "done" ? "Answered" : "Sent privately";
      li.append(span, chip);
      myList.append(li);
    }
  }

  function openComposer(mark, region) {
    pending = { ring: mark, region };
    snapBox.replaceChildren(studentView.board.snapshot(region, [Object.assign({ kind: "ring" }, mark)]));
    composer.classList.add("is-open");
    sentNote.classList.remove("is-on");
    cue.textContent = "The composer opens with a frozen snapshot of the spot you circled.";
  }
  function closeComposer() {
    composer.classList.remove("is-open");
    studentView.board.clearMarks();
    pending = null;
  }

  // Sends a question: it crosses the (simulated) channel and lands in the teacher's inbox.
  function send(text) {
    if (!pending || !text.trim()) return null;
    counter += 1;
    const q = {
      id: "ask" + counter,
      student: "Priya",
      time: timeNow(),
      text: text.trim(),
      region: pending.region,
      ring: pending.ring
    };
    C.bus.emit("question", q);
    mine.push({ id: q.id, text: q.text, status: "sent" });
    renderMine();
    sentNote.classList.add("is-on");
    textArea.value = "";
    return q;
  }

  // The teacher inbox listens on the same channel.
  C.bus.on("question", (q) => inbox.add(q));

  C.bus.on("question:status", ({ id, status }) => {
    const q = mine.find((x) => x.id === id);
    if (q) { q.status = status === "done" ? "done" : "sent"; renderMine(); }
  });

  // A real drag (or tap) on the phone's board opens the composer.
  studentView.board.state.onMark = (mark, info) => {
    if (demo) demo.pause();
    openComposer(mark, info.region);
  };
  $("phone-body").addEventListener("pointerdown", () => { if (demo) demo.pause(); }, true);

  $("send-q").addEventListener("click", () => {
    const q = send(textArea.value);
    if (!q) { textArea.focus(); return; }
    setTimeout(() => { if (sentNote.classList.contains("is-on")) closeComposer(); }, 1400);
    cue.textContent = "Sent privately to your teacher. The question appears in the inbox on the right.";
  });
  $("composer-cancel").addEventListener("click", closeComposer);

  /* ----- scripted timeline ----- */
  const ring = D.questions[0].ring;
  const region = D.questions[0].region;
  let demo = null;

  const steps = [
    {
      at: 0,
      run: () => {
        closeComposer();
        inbox.clear();
        mine = [];
        renderMine();
        textArea.value = "";
        cue.textContent = "Press Play, or drag on the phone's board to ask for real.";
      }
    },
    { at: 1000, run: () => { studentView.board.setDraft(Object.assign({ kind: "ring" }, ring)); cue.textContent = "Priya circles the 6O₂ in the equation."; } },
    { at: 2600, run: () => openComposer(ring, region) },
    { at: 6400, run: () => { textArea.focus(); } },
    { at: 6700, run: () => { /* press cue */ } },
    { at: 6900, run: () => {  const q = send(SCRIPT_Q); if (q) scriptId = q.id; if (q) cue.textContent = "Sent. The teacher's inbox gets the question, the snapshot, and the time."; } },
    { at: 8400, run: () => { if (composer.classList.contains("is-open")) closeComposer(); } },
    { at: 10200, run: () => { if (scriptId) inbox.setAnswered(scriptId, true); cue.textContent = "The teacher marks it answered. Priya sees the status change."; } },
    { at: 12800, run: () => cue.textContent = "Restart to ask again. The question never appears on the board." }
  ];

  const typeRange = { from: 3400, to: 6200, update: (p) => { textArea.value = typed(SCRIPT_Q, p); } };

  demo = DemoEngine.create({
    duration: 13000,
    steps,
    ranges: [typeRange],
    onReset: () => { textArea.value = ""; }
  });
  DemoEngine.bind(document.querySelector(".demo-bar"), demo);
  demo.reset();
})();
