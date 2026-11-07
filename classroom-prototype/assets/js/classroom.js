// Classroom page demo
const timeline = new DemoTimeline({ duration: 20000 });

// Get text elements
const textElements = ['text-1', 'text-2', 'text-3', 'text-4'].map(id => document.getElementById(id));

// Setup timeline events to reveal text one by one
timeline.addEvent(2000, () => {
  textElements[0].classList.add('text-appear');
});

timeline.addEvent(5000, () => {
  textElements[1].classList.add('text-appear');
});

timeline.addEvent(9000, () => {
  textElements[2].classList.add('text-appear');
});

timeline.addEvent(14000, () => {
  textElements[3].classList.add('text-appear');
});

// Setup controls
setupDemoControls(timeline);

// Auto-play on load
window.addEventListener('load', () => {
  setTimeout(() => timeline.play(), 500);
});
