// Join page demo
const timeline = new DemoTimeline({ duration: 18000 });

// Get elements
const stepQR = document.getElementById('step-qr');
const stepName = document.getElementById('step-name');
const stepJoining = document.getElementById('step-joining');
const stepInClass = document.getElementById('step-in-class');
const studentNameInput = document.getElementById('student-name');
const joinBtnPhone = document.getElementById('join-btn-phone');
const desktopNameInput = document.getElementById('desktop-name');
const modal = document.getElementById('modal');
const modalCancel = document.getElementById('modal-cancel');
const modalJoin = document.getElementById('modal-join');
const joinLinkBtn = document.getElementById('join-link-btn');
const studentAvatarPhone = stepInClass.querySelector('.student-avatar');

// Helper to show step
function showStep(step) {
  document.querySelectorAll('.join-step').forEach(s => s.classList.remove('active'));
  step.classList.add('active');
}

// Setup timeline events
timeline.addEvent(0, () => {
  showStep(stepQR);
});

timeline.addEvent(4000, () => {
  showStep(stepName);
});

timeline.addEvent(8000, () => {
  showStep(stepJoining);
});

timeline.addEvent(12000, () => {
  showStep(stepInClass);
  const initial = studentNameInput.value.charAt(0).toUpperCase();
  studentAvatarPhone.textContent = initial;
});

// Allow manual interaction: name entry
joinBtnPhone.addEventListener('click', () => {
  const name = studentNameInput.value.trim();
  if (name) {
    timeline.setTime(8000);
    setTimeout(() => timeline.setTime(12000), 2000);
  }
});

// Desktop link interaction
joinLinkBtn.addEventListener('click', () => {
  modal.classList.add('show');
});

modalCancel.addEventListener('click', () => {
  modal.classList.remove('show');
});

modalJoin.addEventListener('click', () => {
  const name = desktopNameInput.value.trim();
  if (name) {
    modal.classList.remove('show');
    timeline.setTime(12000);
  }
});

// Allow updating avatar name
studentNameInput.addEventListener('input', () => {
  if (timeline.currentTime >= 12000) {
    const initial = studentNameInput.value.charAt(0).toUpperCase() || 'A';
    studentAvatarPhone.textContent = initial;
  }
});

// Setup controls
setupDemoControls(timeline);

// Auto-play hint
setTimeout(() => {
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.style.animation = 'pulse 2s infinite';
  }
}, 1000);
