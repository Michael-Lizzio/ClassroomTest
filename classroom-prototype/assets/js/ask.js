// Ask page - Drawing and question submission
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const questionInput = document.getElementById('question-text');
const sendBtn = document.getElementById('send-question-btn');
const inboxContainer = document.getElementById('inbox-container');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
const questions = [
  { name: 'Alex', question: 'What about photosynthesis in shade?' },
  { name: 'Jordan', question: 'How does temperature affect this?' },
  { name: 'Morgan', question: 'Can algae do photosynthesis?' }
];

// Setup canvas
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  drawBoard();
}

function drawBoard() {
  ctx.fillStyle = '#fffef0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw board grid
  ctx.strokeStyle = '#f0ede6';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.height; i += 30) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.width; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }

  // Draw sample board text
  ctx.fillStyle = '#2d3436';
  ctx.font = 'bold 24px "Permanent Marker", cursive';
  ctx.fillText('Biology 101', 20, 60);
  ctx.font = '18px "Permanent Marker", cursive';
  ctx.fillText('Photosynthesis', 20, 100);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
  isDrawing = true;
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  lastX = x;
  lastY = y;
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
  isDrawing = false;
});

// Send question
sendBtn.addEventListener('click', () => {
  const question = questionInput.value.trim();
  if (question && canvas.width > 0) {
    addQuestionCard(question);
    questionInput.value = '';
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
  }
});

function addQuestionCard(questionText) {
  const card = document.createElement('div');
  card.className = 'question-card';

  // Create a snapshot of the canvas
  const snapshot = document.createElement('canvas');
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  const snapshotCtx = snapshot.getContext('2d');
  snapshotCtx.drawImage(canvas, 0, 0);

  const studentName = 'You';
  const now = new Date();
  const timeStr = 'just now';

  card.innerHTML = `
    <div class="card-info">
      <div class="card-name">${studentName}</div>
      <div class="card-time">${timeStr}</div>
    </div>
    <div class="card-thumbnail" style="background-image: url('${snapshot.toDataURL()}'); background-size: cover; background-position: center;"></div>
    <div class="card-question">${questionText}</div>
    <div class="card-status">✓ Sent privately to your teacher</div>
  `;

  // Clear empty state
  if (inboxContainer.querySelector('.empty-state')) {
    inboxContainer.innerHTML = '';
  }

  inboxContainer.insertBefore(card, inboxContainer.firstChild);
}

// Timeline for demo
const timeline = new DemoTimeline({ duration: 12000 });

timeline.addEvent(2000, () => {
  questionInput.value = 'How fast does this happen?';
});

timeline.addEvent(5000, () => {
  // Simulate drawing a circle
  const centerX = canvas.width / 2 + 100;
  const centerY = canvas.height / 2;
  const radius = 50;

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
});

timeline.addEvent(8000, () => {
  sendBtn.click();
});

timeline.addEvent(9000, () => {
  questionInput.value = '';
  drawBoard();
});

// Setup controls
setupDemoControls(timeline);

// Auto-play on load
window.addEventListener('load', () => {
  setTimeout(() => timeline.play(), 500);
});
