// Demo Timeline Engine - Shared across all pages
class DemoTimeline {
  constructor(options = {}) {
    this.duration = options.duration || 30000; // ms
    this.currentTime = 0;
    this.isPlaying = false;
    this.events = [];
    this.progressCallback = null;
    this.completeCallback = null;
    this.animationFrameId = null;
    this.lastTime = 0;
  }

  // Add an event that triggers at a specific time
  addEvent(time, callback, options = {}) {
    this.events.push({
      time,
      callback,
      triggered: false,
      once: options.once !== false,
      ...options
    });
    this.events.sort((a, b) => a.time - b.time);
  }

  // Register a callback to track progress
  onProgress(callback) {
    this.progressCallback = callback;
  }

  // Register a callback when timeline completes
  onComplete(callback) {
    this.completeCallback = callback;
  }

  // Start the timeline
  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.animate();
  }

  // Pause the timeline
  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Restart the timeline
  restart() {
    this.pause();
    this.currentTime = 0;
    this.events.forEach(e => e.triggered = false);
    this.updateProgress();
  }

  // Set current time
  setTime(time) {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    // Re-trigger events up to current time
    this.events.forEach(e => {
      if (!e.triggered && e.time <= this.currentTime) {
        e.triggered = true;
        e.callback(this.currentTime);
      }
    });
    this.updateProgress();
  }

  // Animation frame update
  animate() {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    if (this.isPlaying) {
      this.currentTime += deltaTime;

      // Trigger events
      this.events.forEach(event => {
        if (!event.triggered && event.time <= this.currentTime) {
          event.triggered = true;
          event.callback(this.currentTime);
        }
      });

      this.updateProgress();

      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.isPlaying = false;
        if (this.completeCallback) {
          this.completeCallback();
        }
      } else {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
      }
    }
  }

  updateProgress() {
    if (this.progressCallback) {
      this.progressCallback(this.currentTime, this.duration);
    }
  }

  // Get progress percentage
  getProgress() {
    return (this.currentTime / this.duration) * 100;
  }
}

// Create render loop for continuous animations (limbs moving, blinking, etc)
class AnimationLoop {
  constructor(callback) {
    this.callback = callback;
    this.isRunning = false;
    this.frameId = null;
    this.lastFrameTime = performance.now();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frame();
  }

  stop() {
    this.isRunning = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  frame() {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (this.isRunning) {
      this.callback(deltaTime, now);
      this.frameId = requestAnimationFrame(() => this.frame());
    }
  }
}

// Setup controls UI on any page
function setupDemoControls(timeline) {
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');
  const progressBar = document.getElementById('progress-bar');
  const timeDisplay = document.getElementById('time-display');

  if (playBtn) {
    playBtn.addEventListener('click', () => timeline.play());
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => timeline.pause());
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => timeline.restart());
  }

  timeline.onProgress((current, total) => {
    if (progressBar) {
      const percent = (current / total) * 100;
      progressBar.style.width = percent + '%';
    }
    if (timeDisplay) {
      const seconds = Math.floor(current / 1000);
      const totalSeconds = Math.floor(total / 1000);
      timeDisplay.textContent = `${seconds}s / ${totalSeconds}s`;
    }
  });

  // Click timeline to seek
  const timelineContainer = document.querySelector('.timeline-bar');
  if (timelineContainer) {
    timelineContainer.addEventListener('click', (e) => {
      const rect = timelineContainer.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      timeline.setTime(percent * timeline.duration);
    });
  }
}

// Helper: Format time duration
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Ease functions
const Easing = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

// Helper: Lerp
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Helper: Animate SVG element property
function animateElement(element, property, from, to, duration, easing = 'easeOut') {
  const startTime = performance.now();
  const ease = Easing[easing] || Easing.easeOut;

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = lerp(from, to, ease(progress));

    if (property === 'opacity') {
      element.style.opacity = value;
    } else if (property === 'transform' || property.startsWith('translate')) {
      element.style.transform = value;
    } else {
      element.setAttribute(property, value);
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

// Export for use in other scripts
window.DemoTimeline = DemoTimeline;
window.AnimationLoop = AnimationLoop;
window.setupDemoControls = setupDemoControls;
window.formatTime = formatTime;
window.Easing = Easing;
window.lerp = lerp;
window.animateElement = animateElement;
