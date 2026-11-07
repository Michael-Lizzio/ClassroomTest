/* Join demo: QR scan, name entry, joining, in class (phone), and the same join from a desktop link. */
(function () {
  "use strict";
  const C = window.Chalk;
  const D = window.CHALK_DATA;
  const NAME = "Priya";
  const LINK = "https://" + D.cls.link;
  const $ = (id) => document.getElementById(id);
  const chars = (s) => Array.from(s);
  const typed = (full, p) => chars(full).slice(0, Math.round(chars(full).length * p)).join("");

  const qrBox = $("qr-box");
  qrBox.insertBefore(C.qr(D.cls.link, "qr-code"), $("scan-line"));

  const phoneName = $("phone-name");
  const phoneJoin = $("phone-join");
  const deskName = $("desk-name");
  const deskJoin = $("desk-join");
  const url = $("browser-url");
  const dForm = $("d-form");
  const dRoom = $("d-room");
  const scanLine = $("scan-line");
  const cue = $("cue");

  // In-class phone view: the same lesson board, already written.
  const phoneBoard = C.boardView($("phone-board"), { prefix: "joinphone", role: "student", label: "Lesson board, as a student sees it" });
  D.board.items.forEach((it) => {
    const spec = Object.assign({}, it, { full: true });
    if (it.type === "path") phoneBoard.board.addPath(spec); else phoneBoard.board.addText(spec);
  });

  // Desktop class view, drawn live.
  const desk = C.room($("desk-room"), { prefix: "joindesk", role: "student", label: "Classroom on desktop: teacher and seated students" });
  D.board.items.forEach((it) => (it.type === "path" ? desk.board.addPath(it) : desk.board.addText(it)));
  desk.board.setMode("whole");

  function setStep(name) {
    document.querySelectorAll("#phone-body .step-screen").forEach((s) => s.classList.toggle("is-on", s.dataset.step === name));
  }
  function setCue(msg) { cue.textContent = msg; }

  const ranges = [
    { from: 400, to: 2400, update: (p) => { url.textContent = typed(LINK, p); } },
    { from: 4300, to: 5300, update: (p) => { phoneName.value = typed(NAME, p); } },
    { from: 8200, to: 9000, update: (p) => { deskName.value = typed(NAME, p); } }
  ];

  const steps = [
    {
      at: 0,
      run: () => {
        setStep("scan");
        scanLine.classList.remove("is-on");
        dForm.hidden = true;
        dRoom.hidden = true;
        phoneJoin.style.transform = "";
        setCue("Press Play. The phone and the desktop show the same join, side by side.");
      }
    },
    { at: 1200, run: () => setCue("Open the link on a desktop, or scan the code with a phone.") },
    { at: 2600, run: () => { scanLine.classList.add("is-on"); dForm.hidden = false; setCue("The camera finds the code. The desktop form is ready."); } },
    { at: 3800, run: () => { scanLine.classList.remove("is-on"); setStep("name"); setCue("Enter a display name. No account needed."); } },
    { at: 5600, run: () => { phoneJoin.style.transform = "scale(0.96)"; } },
    { at: 5900, run: () => { phoneJoin.style.transform = ""; setStep("joining"); setCue("Joining the class…"); } },
    { at: 7800, run: () => { setStep("inclass"); setCue("On the phone, the board is on top and the controls sit below."); } },
    { at: 9400, run: () => { deskJoin.style.transform = "scale(0.96)"; } },
    {
      at: 9600,
      run: () => {
        deskJoin.style.transform = "";
        dForm.hidden = true;
        dRoom.hidden = false;
        desk.teacher.writeAt(180, 40, 700);
        setCue("On desktop, the whole room is visible.");
      }
    },
    { at: 12600, run: () => setCue("Same class, two devices. Restart to run it again.") }
  ];

  const demo = DemoEngine.create({
    duration: 14000,
    steps,
    ranges,
    onReset: () => {
      desk.reset();
      phoneName.value = "";
      deskName.value = "";
      url.textContent = "";
    },
    onPlayState: (playing) => { desk.setPaused(!playing); }
  });
  DemoEngine.bind(document.querySelector(".demo-bar"), demo);
  demo.reset();

  // Manual use: the name fields and buttons work by hand too.
  function joinPhone() {
    if (!phoneName.value.trim()) { phoneName.focus(); return; }
    setStep("joining");
    setTimeout(() => setStep("inclass"), 1200);
  }
  function joinDesk() {
    if (!deskName.value.trim()) { deskName.focus(); return; }
    dForm.hidden = true;
    dRoom.hidden = false;
  }
  phoneJoin.addEventListener("click", joinPhone);
  deskJoin.addEventListener("click", joinDesk);
  phoneName.addEventListener("keydown", (e) => { if (e.key === "Enter") joinPhone(); });
  deskName.addEventListener("keydown", (e) => { if (e.key === "Enter") joinDesk(); });
})();
