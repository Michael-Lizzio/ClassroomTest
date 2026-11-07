// Present mode - Slides and captions
const timeline = new DemoTimeline({ duration: 22000 });

let currentSlide = 1;
const totalSlides = 4;

const captions = [
  'Today we\'re going to talk about photosynthesis...',
  'Light reactions happen in the thylakoid membranes...',
  'The Calvin cycle uses ATP and NADPH...',
  'This process is essential for life on Earth...',
];

const slideContent = document.getElementById('slide-content');
const captionText = document.getElementById('caption-text');
const slideNumber = document.getElementById('slide-number');
const slideCounter = document.getElementById('slide-counter');
const prevBtn = document.getElementById('prev-slide');
const nextBtn = document.getElementById('next-slide');

function showSlide(n) {
  // Clamp slide number
  if (n < 1) currentSlide = 1;
  else if (n > totalSlides) currentSlide = totalSlides;
  else currentSlide = n;

  // Update visible slide
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  document.querySelector(`.slide[data-slide="${currentSlide}"]`).classList.add('active');

  // Update UI
  slideNumber.textContent = `Slide ${currentSlide} of ${totalSlides}`;
  slideCounter.textContent = `Slide ${currentSlide} / ${totalSlides}`;
  prevBtn.disabled = currentSlide === 1;
  nextBtn.disabled = currentSlide === totalSlides;

  // Show caption
  if (currentSlide <= captions.length) {
    captionText.textContent = captions[currentSlide - 1];
  }
}

// Button handlers
prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));

// Timeline events - advance slides at intervals
timeline.addEvent(4000, () => showSlide(2));
timeline.addEvent(9000, () => showSlide(3));
timeline.addEvent(15000, () => showSlide(4));

// Setup controls
setupDemoControls(timeline);

// Initial state
showSlide(1);

// Auto-play on load
window.addEventListener('load', () => {
  setTimeout(() => timeline.play(), 500);
});
