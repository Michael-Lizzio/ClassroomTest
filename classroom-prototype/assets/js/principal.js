/*
 * Principal's campus view: every class running now, lesson position and health, the help queue,
 * a look-in drawer for any class, teacher performance, and the day schedule.
 * All state is local to the page. The "day" is scripted with DemoEngine.
 */
(function () {
  "use strict";
  const C = window.Chalk;
  const SD = window.SCHOOL_DATA;
  const $ = (id) => document.getElementById(id);
  const clone = (x) => JSON.parse(JSON.stringify(x));

  /* ---------- small DOM helper ---------- */
  function H(tag, attrs) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    for (const kid of Array.prototype.slice.call(arguments, 2)) {
      if (kid === null || kid === undefined || kid === false) continue;
      n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }
  const btn = (label, onClick, cls, aria) => H("button", { type: "button", class: "btn btn-sm " + (cls || ""), onclick: onClick, "aria-label": aria || undefined, text: label });

  function fmt(min) {
    const h = Math.floor(min / 60), m = Math.floor(min % 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  /* ---------- state ---------- */
  const INITIAL = clone({ now: SD.school.now, requests: SD.requests, classLog: SD.classLog, flags: {} });
  let S = null;
  let seq = 0;        // raised request ids: rq1, rq2 ... restart at each reset
  let roomUid = 0;
  let drawerId = null;
  let drawerRoomEl = null;
  let observing = false;
  let flash = new Set();

  function reset() {
    S = clone({ now: INITIAL.now, requests: INITIAL.requests, classLog: INITIAL.classLog, flags: {} });
    // Seeded requests keep stable ids (s1, s2); raised ones count up from rq1 again.
    S.requests.forEach((r, i) => { r.id = "s" + (i + 1); r.fresh = false; });
    seq = 0;
    flash = new Set();
  }

  const classById = (id) => SD.classes.find((c) => c.id === id);
  const teacherById = (id) => SD.teachers.find((t) => t.id === id);
  const teacherOf = (c) => teacherById(c.tid);
  const kindOf = (r) => SD.kinds[r.kind];

  function understanding(c) {
    const total = c.exit.reduce((a, b) => a + b, 0);
    return c.exit.reduce((a, n, i) => a + n * (i + 1), 0) / total;
  }
  function attendance(c) { return c.present / c.enrolled; }
  function totalMin(c) { return c.segments.reduce((a, s) => a + s[1], 0); }
  function elapsed(c) { return Math.max(0, S.now - c.start); }
  function lessonState(c) {
    // Which segment is running, and how far through the lesson we are.
    let acc = 0, cur = 0;
    const e = elapsed(c);
    const parts = c.segments.map((s, i) => {
      const from = acc;
      acc += s[1];
      return { name: s[0], dur: s[1], from, to: acc, i };
    });
    for (const p of parts) if (e >= p.from) cur = p.i;
    const done = e >= totalMin(c);
    return { parts, cur: done ? -1 : cur, progress: Math.min(1, e / totalMin(c)), done, elapsed: e };
  }
  function openRequests(cid) { return S.requests.filter((r) => r.classId === cid && r.status !== "resolved"); }
  function statusOf(c) {
    if (openRequests(c.id).length) return "help";
    if (understanding(c) < 2.8 || c.onTask < 80) return "watch";
    return "ok";
  }
  const STATUS_TEXT = { help: "Help requested", watch: "Watch", ok: "On track" };
  const STATUS_CLASS = { help: "status-help", watch: "status-watch", ok: "status-ok" };

  function addLog(cid, text, principal) {
    (S.classLog[cid] = S.classLog[cid] || []).push({ at: S.now, text, principal: !!principal });
  }
  function logEntries(c) {
    const seeded = (S.classLog[c.id] || []).map((e) => (typeof e === "string" ? { at: null, text: e, principal: false } : e));
    const started = [{ at: c.start, text: `Lesson started · ${c.lesson}`, principal: false }];
    const all = started.concat(seeded);
    return all.filter((e) => e.at === null || e.at <= S.now).sort((a, b) => (a.at || 0) - (b.at || 0));
  }

  /* ---------- actions ---------- */
  function reqById(id) { return S.requests.find((r) => r.id === id); }
  function raise(r) {
    seq += 1;
    const req = Object.assign({ id: "rq" + seq, at: S.now, status: "open", fresh: true }, r);
    S.requests.unshift(req);
    flash.add(req.classId);
    setTimeout(() => { req.fresh = false; }, 1600);
    setTimeout(() => { flash.delete(req.classId); refresh(); }, 1200);
    refresh();
    return req;
  }
  function ack(id) {
    const r = reqById(id);
    if (!r || r.status !== "open") return;
    r.status = "ack";
    r.ackAt = S.now;
    addLog(r.classId, "Dr. Mensah acknowledged a help request", true);
    cue("Acknowledged. The teacher sees it as “on it”.");
    refresh();
  }
  function resolve(id, note) {
    const r = reqById(id);
    if (!r) return;
    r.status = "resolved";
    r.resolvedAt = S.now;
    addLog(r.classId, note || "Help request resolved", true);
    cue("Resolved and logged against the class.");
    refresh();
  }
  function escalate(id) {
    const r = reqById(id);
    if (!r) return;
    r.routed = "Counsellor + safeguarding lead";
    r.status = r.status === "open" ? "ack" : r.status;
    r.ackAt = r.ackAt || S.now;
    addLog(r.classId, "Routed to the counsellor and safeguarding lead", true);
    cue("Routed to the counsellor and safeguarding lead. The teacher is told the next step.");
    refresh();
  }
  function checkIn(cid, student) {
    addLog(cid, `Asked ${teacherOf(classById(cid)).name} to check in on ${student}`, true);
    cue(`Message sent: check in on ${student}.`);
    refresh();
  }
  function sendMessage(cid, text) {
    const t = text.trim();
    if (!t) return false;
    addLog(cid, t, true);
    return true;
  }

  function cue(msg) { $("cue").textContent = msg; }

  /* ---------- stats ---------- */
  function renderStats() {
    const cls = SD.classes;
    const states = cls.map(statusOf);
    const ok = states.filter((s) => s === "ok").length;
    const watch = states.filter((s) => s !== "ok").length; // watch or help
    const helpOpen = S.requests.filter((r) => r.status !== "resolved").length;
    const att = cls.reduce((a, c) => a + c.present, 0) / cls.reduce((a, c) => a + c.enrolled, 0);
    const tiles = [
      { k: "Classes running", v: `${cls.length} of ${cls.length}`, cls: "" },
      { k: "On track", v: String(ok), cls: "is-ok" },
      { k: "Need attention", v: String(watch), cls: watch ? "is-alert" : "" },
      { k: "Help requests open", v: String(helpOpen), cls: helpOpen ? "is-alert" : "" },
      { k: "Attendance", v: Math.round(att * 100) + "%", cls: "" }
    ];
    $("stats").replaceChildren(...tiles.map((t) => H("div", { class: "stat " + t.cls }, H("div", { class: "k", text: t.k }), H("div", { class: "v", text: t.v }))));
    $("help-count").textContent = `${helpOpen} open`;
    $("clock-chip").textContent = fmt(S.now);
    const block = SD.school.blocks.find((b) => S.now >= b.start && S.now < b.end);
    $("block-chip").textContent = block ? `${block.label} · ${fmt(block.start)}–${fmt(block.end)}` : "Between blocks";
  }

  /* ---------- class tiles ---------- */
  function sparkline(values) {
    const w = 240, h = 26, min = 1, max = 4;
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / (max - min)) * (h - 4) - 2}`).join(" ");
    const svg = C.el("svg", { viewBox: `0 0 ${w} ${h}`, class: "spark", role: "img", "aria-label": "Understanding over the last six checks: " + values.map((v) => v.toFixed(1)).join(", ") });
    svg.append(C.el("polyline", { points: pts, fill: "none", stroke: "#1E7566", "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    return svg;
  }

  function tile(c) {
    const st = statusOf(c);
    const ls = lessonState(c);
    const t = teacherOf(c);
    const seg = H("div", { class: "lesson-bar", role: "img", "aria-label": `${ls.done ? "Lesson finished" : "Lesson " + Math.round(ls.progress * 100) + "% done, in " + (ls.parts[ls.cur] ? ls.parts[ls.cur].name : "")}` });
    const names = H("div", { class: "seg-names" });
    ls.parts.forEach((p) => {
      const cur = p.i === ls.cur;
      const fillPct = ls.done ? 100 : cur ? ((ls.elapsed - p.from) / p.dur) * 100 : p.to <= ls.elapsed ? 100 : 0;
      seg.append(H("div", { class: "seg-part" + (cur ? " is-current" : "") + (fillPct === 100 && !cur ? " is-done" : ""), style: `flex:${p.dur} 1 0%` }, H("div", { class: "fill", style: `width:${fillPct}%` })));
      names.append(H("span", { class: cur ? "is-current" : "", style: `flex:${p.dur} 1 0%`, text: p.name }));
    });
    const now = ls.done ? "Lesson finished" : `Now: ${ls.parts[ls.cur].name} · ${Math.max(0, Math.ceil(totalMin(c) - ls.elapsed))} min left`;
    const metric = (k, v) => H("div", { class: "metric" }, H("div", { class: "k", text: k }), H("div", { class: "v", text: v }));
    const tileEl = H("article", { class: `p-tile is-${st}${flash.has(c.id) ? " is-flash" : ""}`, "data-class": c.id, "aria-labelledby": "tile-" + c.id },
      H("div", { class: "p-tile-top" },
        H("div", null, H("div", { class: "p-block", text: `${c.room} · started ${fmt(c.start)}` }), H("h3", { id: "tile-" + c.id, text: c.name }), H("div", { class: "sub", text: t.name })),
        H("span", { class: "status " + STATUS_CLASS[st], text: STATUS_TEXT[st] })),
      H("div", null, seg, names),
      H("div", { class: "sub", text: now }),
      H("div", { class: "tile-metrics" },
        metric("Attendance", `${c.present}/${c.enrolled}`),
        metric("Understanding", `${understanding(c).toFixed(1)} / 4`),
        metric("On task", c.onTask + "%")),
      sparkline(c.pulse),
      H("div", { class: "tile-actions" },
        btn("Look in", () => openDrawer(c.id), "btn-primary", `Look in on ${c.name}`),
        btn("Message teacher", () => openDrawer(c.id, true), "", `Message ${t.name} about ${c.name}`)));
    return tileEl;
  }

  function renderTiles() {
    $("tiles").replaceChildren(...SD.classes.map(tile));
  }

  /* ---------- help requests ---------- */
  function helpItem(r, compact) {
    const k = kindOf(r);
    const c = classById(r.classId);
    const t = teacherOf(c);
    const acts = [];
    if (r.status === "open") acts.push(btn("Acknowledge", () => ack(r.id), "", `Acknowledge: ${r.text}`));
    if (r.kind === "safeguard" && !r.routed) acts.push(btn("Route to counsellor", () => escalate(r.id), "btn-primary"));
    acts.push(btn("Look in", () => openDrawer(c.id), ""));
    if (r.status !== "resolved") acts.push(btn("Resolve", () => resolve(r.id, `Resolved: ${k.label.toLowerCase()} request closed`), ""));
    const statusTxt = r.status === "resolved" ? `Resolved ${fmt(r.resolvedAt)}` : r.status === "ack" ? `Acknowledged ${fmt(r.ackAt)}` : "Open";
    return H("article", { class: "help-item" + (r.kind === "safeguard" ? " is-safeguard" : "") + (r.status === "resolved" ? " is-done" : "") + (r.fresh ? " is-new" : ""), "data-id": r.id },
      H("div", { class: "help-head" },
        H("span", { class: "chip tone-" + k.tone, text: k.label }),
        r.status === "resolved" ? H("span", { class: "chip chip-done", text: statusTxt }) : H("span", { class: "age", text: `${statusTxt} · ${Math.max(0, Math.round(S.now - r.at))} min` })),
      H("div", { class: "help-meta", text: `${c.name} · ${t.name}${r.student ? " · " + r.student : ""} · raised ${fmt(r.at)}` }),
      H("p", { class: "help-text", text: r.text }),
      r.routed ? H("p", { class: "help-note", text: "Routed to: " + r.routed }) : null,
      compact ? null : null,
      H("div", { class: "help-actions" }, ...acts));
  }

  function renderHelp() {
    const open = S.requests.filter((r) => r.status !== "resolved").sort((a, b) => kindOf(a).priority - kindOf(b).priority || b.at - a.at);
    $("help-list").replaceChildren(...(open.length ? open.map((r) => helpItem(r, true)) : [H("p", { class: "muted", text: "No open requests. Teachers can ask for help from their console at any time." })]));
    const filter = document.querySelector("[data-filter][aria-pressed=true]").dataset.filter;
    const list = S.requests.filter((r) => filter === "all" || (filter === "open" ? r.status !== "resolved" : r.status === "resolved"));
    $("help-full").replaceChildren(...(list.length ? list.map((r) => helpItem(r, false)) : [H("p", { class: "muted", text: "Nothing here." })]));
  }

  /* ---------- attention list ---------- */
  function renderAttention() {
    const items = [];
    SD.classes.forEach((c) => c.flags.forEach((f, i) => {
      const key = c.id + ":" + i;
      if (S.flags[key] === "done") return;
      items.push({ key, c, f });
    }));
    $("attn-list").replaceChildren(...(items.length ? items.map(({ key, c, f }) => H("li", null,
      H("span", null, H("strong", { text: f.name }), " · " + c.name, H("br"), H("span", { class: "muted", text: f.note })),
      btn("Check in", () => { S.flags[key] = "done"; checkIn(c.id, f.name); }, "", `Ask ${teacherOf(c).name} to check in on ${f.name}`)
    )) : [H("li", { class: "muted", text: "No flagged students right now." })]));
  }

  /* ---------- drawer: look in ---------- */
  function openDrawer(cid, focusMessage) {
    const c = classById(cid);
    drawerId = cid;
    const drawer = $("drawer");
    drawer.hidden = false;
    $("drawer-kicker").textContent = `${c.room} · ${teacherOf(c).name}`;
    $("drawer-title").textContent = c.name;
    observing = false;
    const body = $("drawer-body");
    body.replaceChildren();

    // Observe toggle and the live room.
    const obsBtn = btn("Observe quietly", () => toggleObserve(), "btn-primary", "Observe this class quietly");
    obsBtn.id = "obs-btn";
    obsBtn.setAttribute("aria-pressed", "false");
    const obsNote = H("div", { class: "observe-note", id: "obs-note", hidden: true, text: `${teacherOf(c).short || teacherOf(c).name} is notified that you're observing.` });
    body.append(H("div", { class: "drawer-section" },
      H("h3", { text: "Live view" }),
      H("div", { class: "tile-actions" }, obsBtn, btn("Open teacher's performance", () => { closeDrawer(); setView("teachers", teacherOf(c).id); }, "btn-ghost")),
      obsNote,
      H("div", { class: "drawer-room", id: "drawer-room", style: "margin-top:12px" })));
    drawerRoomEl = $("drawer-room");
    C.room(drawerRoomEl, { prefix: "drw" + (++roomUid), role: "student", label: `Live view of ${c.name}` });

    body.append(H("div", { class: "drawer-section" }, H("h3", { text: "Where the lesson is" }), H("ul", { class: "step-list", id: "dr-steps" })));
    body.append(H("div", { class: "drawer-section" },
      H("div", { class: "panel-head" }, H("h3", { text: "Exit-ticket understanding" }), H("span", { class: "chip", id: "dr-under" })),
      H("div", { class: "hist", id: "dr-hist" })));
    body.append(H("div", { class: "drawer-section" }, H("h3", { text: "Students to check on" }), H("ul", { class: "attn-list", id: "dr-flags" })));
    body.append(H("div", { class: "drawer-section" }, H("h3", { text: "Help requests from this class" }), H("div", { class: "help-list", id: "dr-help" })));

    const msg = H("textarea", { class: "textarea", id: "dr-msg", rows: "2", "aria-label": `Message to ${teacherOf(c).name}`, placeholder: "For example: “Thanks for flagging this. I'll sit in for five minutes.”" });
    const sendBtn = btn("Send to teacher", () => {
      if (sendMessage(cid, msg.value)) {
        addLog(cid, msg.value.trim(), true);
        msg.value = "";
        cue(`Sent to ${teacherOf(c).name}. It appears in her console.`);
        refresh();
      } else { msg.focus(); }
    }, "btn-primary");
    body.append(H("div", { class: "drawer-section" }, H("h3", { text: "Message the teacher" }), H("div", { class: "msg-row" }, msg, H("div", null, sendBtn))));
    body.append(H("div", { class: "drawer-section" }, H("h3", { text: "Activity in this class" }), H("ul", { class: "log", id: "dr-log", "aria-live": "polite" })));

    refreshDrawer();
    if (focusMessage) msg.focus(); else $("drawer-title").focus();
  }

  function refreshDrawer() {
    if (drawerId === null) return;
    const c = classById(drawerId);
    const ls = lessonState(c);
    const steps = $("dr-steps");
    if (steps) steps.replaceChildren(...ls.parts.map((p) => {
      const state = ls.done || p.to <= ls.elapsed ? "is-done" : p.i === ls.cur ? "is-current" : "";
      return H("li", { class: state }, H("span", { text: p.name }), H("span", { class: "muted", text: `${p.dur} min` }));
    }));
    const u = understanding(c);
    const under = $("dr-under");
    if (under) under.textContent = `${u.toFixed(1)} / 4 · ${c.exit.reduce((a, b) => a + b, 0)} responses`;
    const hist = $("dr-hist");
    if (hist) {
      const max = Math.max.apply(null, c.exit);
      const labels = ["Lost", "Unsure", "Got it", "Nailed it"];
      hist.replaceChildren(...c.exit.map((n, i) => H("div", { class: "col" },
        H("span", { class: "lbl", text: String(n) }),
        H("div", { class: "bar" + (i < 2 ? " low" : ""), style: `height:${Math.max(4, (n / max) * 84)}px`, role: "img", "aria-label": `${n} students said ${labels[i]}` }),
        H("span", { class: "lbl", text: labels[i] }))));
    }
    const flags = $("dr-flags");
    if (flags) {
      const list = c.flags.map((f, i) => ({ f, key: c.id + ":" + i })).filter((x) => S.flags[x.key] !== "done");
      flags.replaceChildren(...(list.length ? list.map(({ f, key }) => H("li", null,
        H("span", null, H("strong", { text: f.name }), H("br"), H("span", { class: "muted", text: f.note })),
        btn("Check in", () => { S.flags[key] = "done"; checkIn(c.id, f.name); }, "", `Ask ${teacherOf(c).name} to check in on ${f.name}`))) : [H("li", { class: "muted", text: "No flagged students." })]));
    }
    const dh = $("dr-help");
    if (dh) {
      const rs = S.requests.filter((r) => r.classId === c.id && r.status !== "resolved");
      dh.replaceChildren(...(rs.length ? rs.map((r) => helpItem(r, true)) : [H("p", { class: "muted", text: "No open requests from this class." })]));
    }
    const log = $("dr-log");
    if (log) {
      const entries = logEntries(c);
      log.replaceChildren(...entries.map((e) => H("li", { class: e.principal ? "is-principal" : "" }, H("strong", { text: (e.at !== null ? fmt(e.at) + " " : "") }), e.principal ? "Dr. Mensah: " : "", e.text)));
    }
    const obs = $("obs-btn");
    if (obs) { obs.setAttribute("aria-pressed", String(observing)); obs.textContent = observing ? "Stop observing" : "Observe quietly"; }
    const note = $("obs-note");
    if (note) note.hidden = !observing;
  }

  function toggleObserve() {
    observing = !observing;
    refreshDrawer();
    cue(observing ? "Observing quietly. The teacher knows you're in the room." : "You've left the lesson.");
  }

  function closeDrawer() {
    drawerId = null;
    observing = false;
    $("drawer").hidden = true;
    $("drawer-body").replaceChildren();
  }

  /* ---------- teachers ---------- */
  let selectedTeacher = "t2";
  function renderTeachers() {
    const rows = SD.teachers.map((t) => {
      const c = SD.classes.find((x) => x.tid === t.id);
      const selected = t.id === selectedTeacher;
      return H("tr", { class: selected ? "is-selected" : "" },
        H("th", { scope: "row" }, H("button", { type: "button", class: "row-btn", "aria-pressed": String(selected), onclick: () => { selectedTeacher = t.id; renderTeachers(); renderTeacherDetail(); }, text: t.name })),
        H("td", { text: `${c.name} · ${c.room}` }),
        H("td", { text: t.onTime + "%" }),
        H("td", { text: t.trend[t.trend.length - 1].toFixed(1) + " / 4" }),
        H("td", { text: String(t.reply) }),
        H("td", { text: t.feedback.toFixed(1) + " / 5" }),
        H("td", { text: String(t.helpRaised) }));
    });
    $("teacher-rows").replaceChildren(...rows);
  }
  function renderTeacherDetail() {
    const t = teacherById(selectedTeacher);
    const c = SD.classes.find((x) => x.tid === t.id);
    const lastU = t.trend[t.trend.length - 1];
    const max = 4;
    const trend = H("div", { class: "trend", role: "img", "aria-label": "Understanding over eight weeks: " + t.trend.map((v) => v.toFixed(1)).join(", ") },
      ...t.trend.map((v) => H("div", { class: "bar", style: `height:${((v - 1) / (max - 1)) * 100}%` })));
    const labels = H("div", { class: "trend-labels" }, ...t.trend.map((v, i) => H("span", { text: i === t.trend.length - 1 ? "Now" : `${t.trend.length - 1 - i}w` })));
    const kpi = (k, v) => H("div", { class: "metric" }, H("div", { class: "k", text: k }), H("div", { class: "v", text: v }));
    $("teacher-detail").replaceChildren(
      H("section", { class: "panel", "aria-labelledby": "td-h" },
        H("div", { class: "panel-head" }, H("div", null, H("h2", { id: "td-h", text: t.name }), H("p", { class: "muted", style: "font-size:var(--fs-sm)", text: `${t.subject} · ${t.years} years teaching · teaching ${c.name} now` })),
          btn("Look in on their class", () => openDrawer(c.id), "btn-primary")),
        H("div", { class: "kpis" },
          kpi("Lessons on time", t.onTime + "%"),
          kpi("Understanding (now)", lastU.toFixed(1) + " / 4"),
          kpi("Median reply", t.reply + " min"),
          kpi("Student rating", t.feedback.toFixed(1) + " / 5"),
          kpi("Help asked, 30 days", String(t.helpRaised)),
          kpi("Open help now", String(S.requests.filter((r) => r.status !== "resolved" && r.classId === c.id).length)))),
      H("section", { class: "panel", "aria-labelledby": "tr-h" },
        H("div", { class: "panel-head" }, H("h2", { id: "tr-h", text: "Understanding, last eight weeks" })),
        trend, labels,
        H("h3", { style: "margin:16px 0 8px", text: "Notes" }),
        H("ul", { class: "log" }, ...t.notes.map((n) => H("li", { text: n }))),
        H("div", { style: "margin-top:12px;display:flex;gap:8px;flex-wrap:wrap" },
          btn("Schedule a walkthrough", () => { addLog(c.id, "Principal walkthrough scheduled for Thursday", true); cue(`Walkthrough requested for ${t.name}. The teacher sees it on their calendar.`); renderTeacherDetail(); }, ""),
          btn("Message teacher", () => openDrawer(c.id, true), "btn-ghost"))));
  }

  /* ---------- schedule ---------- */
  function renderSchedule() {
    const cur = SD.school.blocks.find((b) => S.now >= b.start && S.now < b.end);
    $("sched-days").replaceChildren(...SD.school.blocks.map((b) => H("div", { class: "sched-day" + (cur && cur.id === b.id ? " is-now" : "") + (S.now >= b.end ? " is-past" : ""), "aria-current": cur && cur.id === b.id ? "true" : null },
      H("div", { class: "t", text: `${b.label}` }), H("div", { class: "muted", style: "font-size:var(--fs-xs)", text: `${fmt(b.start)}–${fmt(b.end)}` }))));
    const block = SD.school.blocks.find((b) => b.id === "C");
    const span = block.end - block.start;
    const x = (m) => Math.max(0, Math.min(100, ((m - block.start) / span) * 100));
    const rows = SD.classes.map((c) => {
      const ls = lessonState(c);
      const trackEl = H("div", { class: "sched-track", role: "img", "aria-label": `${c.name}: ${Math.round(ls.progress * 100)}% through` },
        H("div", { class: "fill", style: `left:${x(c.start)}%;width:${x(Math.min(c.start + totalMin(c), S.now)) - x(c.start)}%` }));
      c.segments.reduce((acc, s, i) => { if (i > 0) trackEl.append(H("div", { style: `position:absolute;top:0;bottom:0;width:2px;background:var(--ink);left:${x(c.start + acc)}%` })); return acc + s[1]; }, 0);
      trackEl.append(H("div", { class: "now", style: `left:${x(S.now)}%` }));
      return H("div", { class: "sched-row" },
        H("div", null, H("strong", { text: c.name }), H("div", { class: "muted", style: "font-size:var(--fs-xs)", text: `${teacherOf(c).name} · ${c.room}` })),
        trackEl,
        H("div", { class: "muted", style: "text-align:right;font-variant-numeric:tabular-nums", text: ls.done ? "Finished" : `${Math.round(ls.elapsed)} of ${totalMin(c)} min` }));
    });
    $("sched-grid").replaceChildren(
      H("div", { class: "sched-row", "aria-hidden": "true" }, H("div", { class: "p-block", text: "Block C" }), H("div", { class: "sched-axis", style: "padding:0", text: `${fmt(block.start)} · ${fmt(block.start + 15)} · ${fmt(block.start + 30)} · ${fmt(block.end)}` }), H("div")),
      ...rows);
  }

  /* ---------- views ---------- */
  let view = "campus";
  function setView(v, teacherId) {
    view = v;
    if (teacherId) selectedTeacher = teacherId;
    document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    $("view-campus").hidden = v !== "campus";
    $("view-help").hidden = v !== "help";
    $("view-teachers").hidden = v !== "teachers";
    $("view-schedule").hidden = v !== "schedule";
    renderView();
  }
  function renderView() {
    if (view === "campus") { renderTiles(); renderHelp(); renderAttention(); }
    if (view === "help") renderHelp();
    if (view === "teachers") { renderTeachers(); renderTeacherDetail(); }
    if (view === "schedule") renderSchedule();
  }

  function refresh() {
    renderStats();
    renderView();
    refreshDrawer();
  }

  /* ---------- wiring ---------- */
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderHelp();
  }));
  $("drawer-close").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawerId !== null) closeDrawer(); });

  /* ---------- scripted school day ---------- */
  const DAY_MIN = 20; // minutes of school that play out in the one-minute demo
  const DURATION = 60000;
  const clockRange = {
    from: 0, to: DURATION,
    update: (p) => {
      const m = Math.floor(SD.school.now + p * DAY_MIN);
      if (m !== S.now) { S.now = m; refresh(); }
    }
  };
  const steps = [
    { at: 0, run: () => { reset(); $("drawer").hidden = true; setView("campus"); refresh(); cue("Press Play. Twenty minutes of class pass in one minute, and requests arrive as they would on a real day."); } },
    { at: 9000, run: () => { raise({ kind: "learning", classId: "c2", student: "Kwame", text: "Kwame is stuck on the Calvin cycle. Could someone sit with him for five minutes?" }); cue("New request from Ms. Okafor: learning support for Kwame."); } },
    { at: 15000, run: () => { ack("rq1"); } },
    { at: 20000, run: () => { raise({ kind: "safeguard", classId: "c8", student: "", text: "A student's question raised a welfare concern. Please advise on next steps." }); cue("Safeguarding request from Mr. Walsh. It goes to the top of the queue."); } },
    { at: 25000, run: () => { escalate("rq2"); } },
    { at: 30000, run: () => { openDrawer("c2"); cue("Dr. Mensah looks in on Biology 101 without leaving the campus view."); } },
    { at: 31500, run: () => { toggleObserve(); } },
    { at: 36000, run: () => { sendMessage("c2", "Thanks for flagging Kwame. I'll sit in for the next five minutes."); addLog("c2", "Thanks for flagging Kwame. I'll sit in for the next five minutes.", true); refresh(); cue("Message sent. Ms. Okafor sees it in her console."); } },
    { at: 42000, run: () => { closeDrawer(); cue("Back on the campus view. Kwame's request is still open."); } },
    { at: 44000, run: () => { resolve("rq1", "Resolved: Kwame's session with Ms. Okafor complete"); } },
    { at: 46000, run: () => { resolve("s1", "Resolved: Jun's check-in complete"); } },
    { at: 47000, run: () => { setView("teachers", "t8"); cue("Performance is one tap away. Mr. Walsh is in his first year, with pacing support scheduled."); } },
    { at: 53000, run: () => { setView("campus"); } },
    { at: 55000, run: () => { resolve("s2", "Resolved: speakers fixed by facilities"); } },
    { at: 58000, run: () => cue("End of the day for this demo. Restart to run it again.") }
  ];

  reset();
  const demo = DemoEngine.create({
    duration: DURATION,
    steps,
    ranges: [clockRange],
    onReset: () => { reset(); $("drawer").hidden = true; drawerId = null; },
    onPlayState: () => {}
  });
  DemoEngine.bind(document.querySelector(".demo-bar"), demo);
  demo.reset();
})();
