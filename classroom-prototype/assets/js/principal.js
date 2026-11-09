/* Principal dashboard: oversee all classes, monitor engagement, and respond to help requests. */
(function () {
  "use strict";
  const D = window.CHALK_DATA;
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  const principal = D.principal;
  const classes = principal.classes.slice();
  const helpRequests = principal.helpRequests.slice();

  $("principal-name").textContent = principal.name;

  let selectedClass = null;
  let demo = null;
  let currentMs = 0;
  const DURATION = 50000;

  /* ----- class card rendering ----- */
  function renderClassCard(cls) {
    const card = document.createElement("div");
    card.className = "class-card";
    if (helpRequests.some(hr => hr.classId === cls.id && hr.status === "pending")) {
      card.classList.add("has-alert");
    }

    const engagementClass = cls.engagement === "high" ? "high-engagement" : cls.engagement === "medium" ? "medium-engagement" : "low-engagement";
    const engagementDot = cls.engagement === "high" ? "high" : cls.engagement === "medium" ? "medium" : "low";

    card.innerHTML = `
      <div class="class-header">
        <h3>${cls.name}</h3>
        <span class="stage-badge ${cls.stage === "Complete" ? "complete" : ""}">${cls.stage}</span>
      </div>
      <div class="teacher-info">
        <strong>${cls.teacher}</strong> · ${cls.room}
      </div>
      <div class="metrics-row">
        <div class="metric">
          <span class="metric-label">Students</span>
          <span class="metric-value">${cls.studentCount}/${cls.enrollment}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Performance</span>
          <span class="metric-value">${cls.performanceScore}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Questions</span>
          <span class="metric-value">${cls.questionsCount}</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${engagementClass}" style="width: ${cls.progress}%"></div>
      </div>
      <div class="engagement-indicator">
        <div class="engagement-dot ${engagementDot}"></div>
        <span>${Math.round(cls.progress)}% through lesson · ${cls.engagement} engagement</span>
      </div>
      <span class="question-count">Questions in inbox</span>
    `;

    card.addEventListener("click", () => showClassDetail(cls));
    return card;
  }

  function renderClasses() {
    const grid = $("classes-grid");
    grid.replaceChildren(...classes.map(cls => renderClassCard(cls)));
  }

  /* ----- help requests rendering ----- */
  function renderHelpRequests() {
    const container = $("help-requests");
    if (!helpRequests.length) {
      container.innerHTML = '<div class="help-empty">No help requests at the moment</div>';
      return;
    }
    const sorted = helpRequests.slice().sort((a, b) => (b.priority === "high" ? 1 : 0) - (a.priority === "high" ? 1 : 0));
    container.replaceChildren(
      ...sorted.map(hr => {
        const item = document.createElement("div");
        item.className = "help-item" + (hr.priority === "high" ? " urgent" : "");
        item.innerHTML = `
          <h4>${classes.find(c => c.id === hr.classId)?.teacher || "Unknown"}</h4>
          <div class="help-time">${hr.timestamp}</div>
          <div class="help-issue">${hr.issue}</div>
          <span class="help-priority ${hr.priority === "medium" ? "medium" : ""}">${hr.priority.toUpperCase()}</span>
        `;
        item.addEventListener("click", () => {
          showClassDetail(classes.find(c => c.id === hr.classId));
          const alert = document.querySelector(".help-item.urgent");
          if (alert) alert.classList.add("is-highlighted");
        });
        return item;
      })
    );
  }

  /* ----- detail overlay ----- */
  function showClassDetail(cls) {
    const content = $("detail-content");
    const performanceColor = cls.performanceScore >= 90 ? var(--teal) : cls.performanceScore >= 75 ? var(--orange) : var(--rose);

    content.innerHTML = `
      <div class="detail-header">
        <h2>${cls.name}</h2>
        <p>Period ${cls.period.split(" ")[1]} · ${cls.time}</p>
      </div>

      <div class="detail-stats">
        <div class="detail-stat">
          <div class="detail-stat-label">Students Present</div>
          <div class="detail-stat-value">${cls.studentCount} of ${cls.enrollment}</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-label">Performance</div>
          <div class="detail-stat-value">${cls.performanceScore}%</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-label">Engagement</div>
          <div class="detail-stat-value" style="text-transform: capitalize;">${cls.engagement}</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-label">Questions</div>
          <div class="detail-stat-value">${cls.questionsCount}</div>
        </div>
      </div>

      <div class="detail-section">
        <h3>Lesson Progress</h3>
        <p>${cls.progress}% complete (${Math.round(cls.progress / 100 * cls.duration)} of ${cls.duration} minutes)</p>
      </div>

      <div class="detail-section">
        <h3>Teacher: ${cls.teacher}</h3>
        <p>${cls.teacher} is actively teaching and managing student questions. Quick response time to student inquiries.</p>
      </div>

      <div class="detail-section">
        <h3>Recent Activity</h3>
        <p>Last updated ${cls.lastUpdate}. ${cls.studentCount} students currently active. ${cls.questionsCount} questions have been asked so far.</p>
      </div>

      <div class="detail-section">
        <h3>Notes</h3>
        <p>Class is progressing well. ${cls.engagement === "high" ? "High student engagement with numerous questions." : cls.engagement === "medium" ? "Steady engagement. Consider interactive activities if pace slows." : "Engagement is lower than usual. May benefit from check-in."}</p>
      </div>
    `;

    $("detail-overlay").classList.add("is-open");
    selectedClass = cls;
  }

  $("detail-close").addEventListener("click", () => {
    $("detail-overlay").classList.remove("is-open");
    selectedClass = null;
  });

  $("detail-overlay").addEventListener("click", (e) => {
    if (e.target === $("detail-overlay")) {
      $("detail-overlay").classList.remove("is-open");
      selectedClass = null;
    }
  });

  /* ----- demo timeline ----- */
  const steps = [
    {
      at: 0,
      run: () => {
        classes.forEach(c => { c.progress = Math.max(5, c.progress - 15); });
        helpRequests.forEach(hr => { hr.status = "pending"; });
        renderClasses();
        renderHelpRequests();
      }
    },
    {
      at: 3000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-eng301");
        if (cls) { cls.progress = Math.min(100, cls.progress + 20); }
        renderClasses();
      }
    },
    {
      at: 6000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-bio101");
        if (cls) { cls.questionsCount = 6; cls.progress = Math.min(100, cls.progress + 10); }
        renderClasses();
      }
    },
    {
      at: 9000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-chem201");
        if (cls) { cls.engagement = "medium"; cls.performanceScore = 75; }
        renderClasses();
      }
    },
    {
      at: 12000,
      run: () => {
        const help = helpRequests.find(hr => hr.id === "help-1");
        if (help) { help.status = "pending"; }
        renderHelpRequests();
      }
    },
    {
      at: 16000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-chem201");
        if (cls) { cls.progress = Math.min(100, cls.progress + 15); }
        renderClasses();
      }
    },
    {
      at: 20000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-hist102");
        if (cls) { cls.progress = 100; cls.stage = "Complete"; }
        renderClasses();
      }
    },
    {
      at: 24000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-eng301");
        if (cls) { cls.progress = 100; cls.stage = "Complete"; }
        renderClasses();
      }
    },
    {
      at: 30000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-bio101");
        if (cls) { cls.questionsCount = 7; cls.progress = Math.min(100, cls.progress + 12); }
        renderClasses();
      }
    },
    {
      at: 36000,
      run: () => {
        const help = helpRequests.find(hr => hr.id === "help-2");
        if (help) { help.status = "resolved"; }
        renderHelpRequests();
      }
    },
    {
      at: 42000,
      run: () => {
        const cls = classes.find(c => c.id === "cls-bio101");
        if (cls) { cls.progress = 100; cls.stage = "Complete"; }
        const cls2 = classes.find(c => c.id === "cls-chem201");
        if (cls2) { cls2.progress = Math.min(100, cls2.progress + 18); }
        renderClasses();
      }
    },
    {
      at: 48000,
      run: () => {
        classes.forEach(c => { if (c.stage === "Active") c.progress = Math.min(100, c.progress + 5); });
        renderClasses();
      }
    }
  ];

  const ranges = [
    {
      from: 0,
      to: DURATION,
      update: (p, t) => {
        currentMs = t;
        updateTimeDisplay(t);
      }
    }
  ];

  function updateTimeDisplay(ms) {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const secsRem = secs % 60;
    $("time-display").textContent = `${mins}:${String(secsRem).padStart(2, "0")}`;
  }

  demo = DemoEngine.create({
    duration: DURATION,
    steps,
    ranges,
    onReset: () => {
      classes.forEach((c, i) => {
        c.progress = D.principal.classes[i].progress;
        c.engagement = D.principal.classes[i].engagement;
        c.stage = D.principal.classes[i].stage;
        c.questionsCount = D.principal.classes[i].questionsCount;
        c.performanceScore = D.principal.classes[i].performanceScore;
      });
      helpRequests.forEach((hr, i) => {
        hr.status = D.principal.helpRequests[i].status;
      });
      currentMs = 0;
      renderClasses();
      renderHelpRequests();
      updateTimeDisplay(0);
    },
    onPlayState: () => {}
  });

  DemoEngine.bind(document.querySelector(".demo-bar"), demo);
  renderClasses();
  renderHelpRequests();
  demo.reset();
})();
