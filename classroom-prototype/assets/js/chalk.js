/*
 * Chalk: shared scene code for every demo. Builds the inline SVG classroom, the teacher
 * figure, the whiteboard (with areas, hidden states and snapshots), the projector screen,
 * a decorative QR stand-in, and a tiny in-page event bus that fakes the realtime channel.
 *
 * Everything here is simulated. Nothing talks to a server.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const DATA = window.CHALK_DATA;
  const INK = "#23211E";
  const PAPER = "#F5EFE3";
  const TEAL = "#1E7566";
  const TEAL_INK = "#14594C";
  const ORANGE = "#D9622B";
  const ROSE = "#C4506A";
  const BOARD_BG = "#FCFBF7";
  const SKIN = "#E9B48E";
  const HAND = "Caveat, 'Bradley Hand', 'Segoe Print', cursive";
  const UI = "Figtree, 'Segoe UI', system-ui, sans-serif";

  // Where the board sits inside the room, and where the teacher's marker tip lands relative to her feet.
  const BOARD_ORIGIN = { x: 230, y: 44 };
  const WRITE_OFFSET = { dx: 91, dy: 167 };
  const IDLE_SPOT = { x: 70, y: 470 };
  const TEACHER_SCALE = 0.8;

  const reduceMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* ---------- helpers ---------- */
  function el(tag, attrs, kids) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k]);
    if (kids) for (const c of [].concat(kids)) if (c) n.appendChild(c);
    return n;
  }
  function text(str) { return document.createTextNode(str); }

  // Animations we start are tracked so the timeline can pause and resume them together.
  const ANIMS = new Set();
  let PAUSED = false;
  function track(anim) {
    ANIMS.add(anim);
    if (PAUSED) anim.pause();
    const done = () => ANIMS.delete(anim);
    anim.finished.then(done, done);
    return anim;
  }
  function setPaused(p) {
    PAUSED = p;
    for (const a of ANIMS) (p ? a.pause() : a.play());
  }

  // Sketchy, hand-drawn ellipse outline for circles and taps.
  function wobble(cx, cy, rx, ry, seed) {
    const s = seed || 1;
    const n = 56;
    let d = "";
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2 * 1.06;
      const k = 1 + 0.035 * Math.sin(3 * a + s) + 0.02 * Math.sin(7 * a + 2 * s);
      const x = cx + Math.cos(a) * rx * k;
      const y = cy + Math.sin(a) * ry * k;
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  }

  /* ---------- event bus (stands in for the Realtime channel) ---------- */
  const bus = {
    handlers: {},
    on(evt, fn) { (this.handlers[evt] = this.handlers[evt] || []).push(fn); },
    emit(evt, data) { (this.handlers[evt] || []).forEach((fn) => fn(data)); }
  };

  /* ---------- QR stand-in (decorative, not a real encoding) ---------- */
  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry(seed) {
    let a = seed;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function qr(seed, className) {
    const N = 25;
    const rnd = mulberry(hashStr(seed));
    const grid = [];
    for (let y = 0; y < N; y++) { grid.push([]); for (let x = 0; x < N; x++) grid[y].push(rnd() < 0.5); }
    const finder = (ox, oy) => {
      for (let y = -1; y < 8; y++) for (let x = -1; x < 8; x++) {
        const X = ox + x, Y = oy + y;
        if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        const outside = x === -1 || x === 7 || y === -1 || y === 7;
        const ring = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[Y][X] = outside ? false : ring || core;
      }
    };
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
    let d = "";
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x]) d += `M${x} ${y}h1v1h-1z`;
    return el("svg", { viewBox: `0 0 ${N} ${N}`, class: className || "", role: "img", "aria-label": "QR code for joining the class" }, [
      el("rect", { x: 0, y: 0, width: N, height: N, fill: "#FFFFFF" }),
      el("path", { d, fill: INK })
    ]);
  }

  /* ---------- whiteboard ---------- */
  // role: "student" hides areas completely; "teacher" dims them and marks them HIDDEN.
  function createBoard(prefix, opts) {
    opts = opts || {};
    const state = {
      role: opts.role || "student",
      mode: "whole",
      hidden: new Set(),
      items: new Map(),
      interactive: !!opts.interactive,
      onMark: opts.onMark || null
    };
    const clipId = prefix + "-clip";
    const itemsG = el("g", { "clip-path": `url(#${clipId})`, class: "board-items" });
    const marksG = el("g", { "clip-path": `url(#${clipId})`, class: "board-marks" });
    const areasG = el("g", { "clip-path": `url(#${clipId})`, class: "board-areas" });
    const surface = el("rect", { class: "surface", x: 0, y: 0, width: 500, height: 250, rx: 6, fill: BOARD_BG });
    const g = el("g", { class: "board" }, [
      el("defs", null, [el("clipPath", { id: clipId }, [el("rect", { x: 0, y: 0, width: 500, height: 250, rx: 6 })])]),
      el("rect", { x: -14, y: -14, width: 528, height: 278, rx: 16, fill: "#A7B0AA", stroke: INK, "stroke-width": 3 }),
      surface,
      el("rect", { x: 36, y: 262, width: 428, height: 12, rx: 6, fill: "#7F8A83", stroke: INK, "stroke-width": 2 }),
      el("rect", { x: 120, y: 255, width: 34, height: 9, rx: 4, fill: "#2D5C9E" }),
      el("rect", { x: 168, y: 255, width: 34, height: 9, rx: 4, fill: ORANGE }),
      el("rect", { x: 216, y: 255, width: 34, height: 9, rx: 4, fill: TEAL }),
      itemsG, marksG, areasG
    ]);

    const modes = () => DATA.board.modes[state.mode];
    function areaAt(x, y) {
      return modes().find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h) || null;
    }
    function isHiddenPoint(x, y) {
      const a = areaAt(x, y);
      return !!(a && state.hidden.has(a.id));
    }

    function applyVisibility() {
      for (const it of state.items.values()) {
        const hidden = isHiddenPoint(it.x, it.y);
        if (state.role === "student") {
          it.el.style.display = hidden ? "none" : "";
          it.el.removeAttribute("opacity");
        } else {
          it.el.style.display = "";
          it.el.setAttribute("opacity", hidden ? "0.35" : "1");
        }
      }
    }

    function renderAreas() {
      areasG.replaceChildren();
      const list = modes();
      for (const a of list) {
        const hidden = state.hidden.has(a.id);
        if (state.role === "student") {
          if (hidden) areasG.append(el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, fill: BOARD_BG }));
          continue;
        }
        if (list.length > 1) {
          areasG.append(el("rect", {
            x: a.x + 3, y: a.y + 3, width: a.w - 6, height: a.h - 6, rx: 8,
            fill: hidden ? "rgba(35,33,30,0.22)" : "none",
            stroke: INK, "stroke-opacity": 0.55, "stroke-width": 2, "stroke-dasharray": "8 6"
          }));
        }
        if (hidden) {
          const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
          areasG.append(el("rect", { x: cx - 54, y: cy - 15, width: 108, height: 30, rx: 15, fill: INK }));
          areasG.append(el("text", {
            x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "middle",
            "font-family": UI, "font-weight": 800, "font-size": 14, "letter-spacing": 1.5, fill: PAPER, class: "board-hidden-tag"
          }, [text("HIDDEN")]));
        }
      }
    }

    function register(item) {
      const old = state.items.get(item.id);
      if (old) old.el.remove();
      state.items.set(item.id, item);
      itemsG.append(item.el);
      applyVisibility();
    }

    function addText(spec) {
      const node = el("text", {
        x: spec.x, y: spec.y, "font-family": HAND, "font-size": spec.size || 30,
        fill: spec.color || INK, class: "board-text"
      });
      node.textContent = spec.full ? spec.text : "";
      register({ id: spec.id, type: "text", text: spec.text, x: spec.x, y: spec.y, el: node });
      return spec.id;
    }

    function addPath(spec) {
      const m = /M\s*([\d.]+)[ ,]+([\d.]+)/.exec(spec.d);
      const node = el("path", {
        d: spec.d, fill: "none", stroke: spec.color || INK, "stroke-width": spec.width || 4,
        "stroke-linecap": "round", "stroke-linejoin": "round",
        pathLength: 1, "stroke-dasharray": "1 2", "stroke-dashoffset": spec.full ? 0 : 1
      });
      register({ id: spec.id, type: "path", d: spec.d, x: m ? +m[1] : 0, y: m ? +m[2] : 0, el: node });
      return spec.id;
    }

    // p runs 0..1: the text is typed out letter by letter, the path is drawn on.
    function reveal(id, p) {
      const it = state.items.get(id);
      if (!it) return;
      const q = clamp(p, 0, 1);
      if (it.type === "text") {
        const chars = Array.from(it.text);
        it.el.textContent = chars.slice(0, Math.round(chars.length * q)).join("");
      } else {
        it.el.setAttribute("stroke-dashoffset", String(1 - q));
      }
    }
    function revealAll() { for (const id of state.items.keys()) reveal(id, 1); }
    function remove(id) {
      const it = state.items.get(id);
      if (it) { it.el.remove(); state.items.delete(id); }
    }
    function clear() {
      for (const it of state.items.values()) it.el.remove();
      state.items.clear();
      clearMarks();
    }

    function setMode(mode) {
      state.mode = mode;
      state.hidden = new Set();
      renderAreas();
      applyVisibility();
    }
    function setRole(role) {
      state.role = role;
      renderAreas();
      applyVisibility();
    }
    function setHidden(id, hidden) {
      if (hidden) state.hidden.add(id); else state.hidden.delete(id);
      renderAreas();
      applyVisibility();
    }
    function toggleArea(id) {
      setHidden(id, !state.hidden.has(id));
      return !state.hidden.has(id);
    }
    function isVisible(id) { return !state.hidden.has(id); }

    function drawMark(m, cls, seed) {
      const rx = m.rx, ry = m.ry;
      return el("path", {
        d: wobble(m.cx, m.cy, rx, ry, seed || 1), fill: "none", stroke: ORANGE, "stroke-width": m.sw || 4,
        "stroke-linecap": "round", "stroke-linejoin": "round", class: cls || "mark"
      });
    }
    function setDraft(m) {
      marksG.replaceChildren(drawMark(m, "mark draft", 2));
    }
    function clearMarks() { marksG.replaceChildren(); }

    // Snapshot: a frozen crop of the board, with the student's circle drawn on it.
    function snapshot(region, marks) {
      const svg = el("svg", {
        viewBox: `${region.x} ${region.y} ${region.w} ${region.h}`, xmlns: NS,
        role: "img", "aria-label": "Snapshot of the board where the student asked"
      });
      svg.append(el("rect", { x: region.x, y: region.y, width: region.w, height: region.h, fill: BOARD_BG }));
      const inner = el("g");
      for (const child of Array.from(itemsG.children)) {
        const c = child.cloneNode(true);
        c.removeAttribute("id");
        inner.append(c);
      }
      svg.append(inner);
      (marks || []).forEach((m, i) => svg.append(drawMark(Object.assign({}, m, { sw: 2.2 }), "mark", i + 3)));
      return svg;
    }

    // Pointer drawing: tap = dot, drag = circle around the stroke.
    if (state.interactive) {
      const toBoard = (evt) => {
        const pt = surface.ownerSVGElement.createSVGPoint();
        pt.x = evt.clientX; pt.y = evt.clientY;
        return pt.matrixTransform(surface.getScreenCTM().inverse());
      };
      let drawing = null;
      surface.addEventListener("pointerdown", (e) => {
        const p = toBoard(e);
        drawing = { pts: [p], el: el("path", { fill: "none", stroke: ORANGE, "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round", class: "mark live" }) };
        marksG.append(drawing.el);
        surface.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      surface.addEventListener("pointermove", (e) => {
        if (!drawing) return;
        drawing.pts.push(toBoard(e));
        drawing.el.setAttribute("d", "M" + drawing.pts.map((q) => q.x.toFixed(1) + " " + q.y.toFixed(1)).join(" L"));
      });
      const finish = () => {
        if (!drawing) return;
        const pts = drawing.pts;
        drawing.el.remove();
        drawing = null;
        const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        const w = maxX - minX, h = maxY - minY;
        const mark = (w < 12 && h < 12)
          ? { kind: "dot", cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, rx: 16, ry: 16 }
          : { kind: "ring", cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, rx: Math.max(18, w / 2 + 12), ry: Math.max(16, h / 2 + 12) };
        if (state.role === "student" && isHiddenPoint(mark.cx, mark.cy)) return; // students can't ask about hidden areas
        setDraft(mark);
        if (state.onMark) state.onMark(mark, { region: { x: mark.cx - 90, y: mark.cy - 60, w: 180, h: 120 } });
      };
      surface.addEventListener("pointerup", finish);
      surface.addEventListener("pointercancel", finish);
    }

    renderAreas();
    return {
      g, state, surface, addText, addPath, reveal, revealAll, remove, clear,
      setMode, setRole, setHidden, toggleArea, isVisible, areaAt,
      snapshot, setDraft, clearMarks, drawMark,
      has: (id) => state.items.has(id),
      get role() { return state.role; },
      get mode() { return state.mode; }
    };
  }

  /* ---------- teacher figure (limbs are separate groups for animation) ---------- */
  function createTeacher(prefix) {
    const g = el("g", { class: "teacher scripted", "aria-hidden": "true" });
    const legA = el("g", { class: "leg leg-a" }, [
      el("rect", { x: -17, y: -80, width: 14, height: 80, rx: 6, fill: "#3E4C63" }),
      el("ellipse", { cx: -10, cy: 1, rx: 12, ry: 5, fill: INK })
    ]);
    const legB = el("g", { class: "leg leg-b" }, [
      el("rect", { x: 3, y: -80, width: 14, height: 80, rx: 6, fill: "#3E4C63" }),
      el("ellipse", { cx: 10, cy: 1, rx: 12, ry: 5, fill: INK })
    ]);
    const armL = el("g", { transform: "translate(-24,-146)" }, [
      el("g", { transform: "rotate(7)" }, [
        el("rect", { x: -8, y: 0, width: 16, height: 80, rx: 8, fill: TEAL_INK }),
        el("circle", { cx: 0, cy: 86, r: 8.5, fill: SKIN })
      ])
    ]);
    const torso = el("g", { class: "idle-breath" }, [
      el("rect", { x: -7, y: -172, width: 14, height: 20, fill: SKIN }),
      el("rect", { x: -28, y: -156, width: 56, height: 88, rx: 22, fill: TEAL }),
      el("path", { d: "M-10 -150 L0 -132 L10 -150", fill: "none", stroke: BOARD_BG, "stroke-width": 4, "stroke-linejoin": "round" })
    ]);
    const head = el("g", null, [
      el("circle", { cx: 0, cy: -192, r: 25, fill: SKIN }),
      el("path", { d: "M-26 -194 Q-28 -220 0 -218 Q28 -220 26 -194 Q18 -208 0 -209 Q-18 -208 -26 -194 Z", fill: "#3B2A20" }),
      el("g", { class: "idle-blink" }, [
        el("ellipse", { cx: -9, cy: -193, rx: 3.2, ry: 4.2, fill: INK }),
        el("ellipse", { cx: 9, cy: -193, rx: 3.2, ry: 4.2, fill: INK })
      ]),
      el("path", { d: "M-7 -181 Q0 -175 7 -181", fill: "none", stroke: INK, "stroke-width": 2.4, "stroke-linecap": "round" }),
      el("circle", { cx: -16, cy: -185, r: 4, fill: "#E07A6A", opacity: 0.45 }),
      el("circle", { cx: 16, cy: -185, r: 4, fill: "#E07A6A", opacity: 0.45 })
    ]);
    const armRPivot = el("g", { class: "arm-r", style: "transform-origin: 0px 0px" }, [
      el("g", { class: "writing-wiggle" }, [
        el("rect", { x: -8, y: 0, width: 16, height: 80, rx: 8, fill: TEAL }),
        el("circle", { cx: 0, cy: 86, r: 8.5, fill: SKIN }),
        el("rect", { x: -3, y: 92, width: 6, height: 18, rx: 2, fill: ROSE })
      ])
    ]);
    const armR = el("g", { transform: "translate(24,-146)" }, [armRPivot]);
    g.append(legA, legB, armL, torso, head, armR);

    let pos = { x: IDLE_SPOT.x, y: IDLE_SPOT.y };
    let armAngle = 0;
    const own = [];
    const place = (p) => `translate(${p.x}px, ${p.y}px) scale(${TEACHER_SCALE})`;
    g.style.transform = place(pos);

    function animateOwn(target, frames, opts) {
      const a = track(target.animate(frames, opts));
      own.push(a);
      return a;
    }

    function moveTo(x, y, ms) {
      if (reduceMotion()) { pos = { x, y }; g.style.transform = place(pos); return Promise.resolve(); }
      const from = { ...pos };
      g.classList.add("walking");
      const a = animateOwn(g, [{ transform: place(from) }, { transform: place({ x, y }) }], {
        duration: ms || 1100, easing: "cubic-bezier(0.45, 0.05, 0.3, 1)", fill: "forwards"
      });
      return a.finished.then(() => {
        pos = { x, y };
        g.style.transform = place(pos);
        a.cancel();
        g.classList.remove("walking");
      }, () => {});
    }

    function setArm(angle, ms) {
      const from = armAngle;
      armAngle = angle;
      if (reduceMotion() || !ms) { armRPivot.style.transform = `rotate(${angle}deg)`; return Promise.resolve(); }
      const a = animateOwn(armRPivot, [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${angle}deg)` }], {
        duration: ms, easing: "ease-out", fill: "forwards"
      });
      return a.finished.then(() => { armRPivot.style.transform = `rotate(${angle}deg)`; a.cancel(); }, () => {});
    }

    // Stand where the marker tip touches board point (bx, by), then write.
    function writeAt(bx, by, ms) {
      const target = { x: BOARD_ORIGIN.x + bx - WRITE_OFFSET.dx, y: BOARD_ORIGIN.y + by + WRITE_OFFSET.dy };
      g.classList.remove("writing");
      return setArm(0, 180)
        .then(() => moveTo(target.x, target.y, ms || 1000))
        .then(() => setArm(-125, 320))
        .then(() => g.classList.add("writing"));
    }
    function stopWriting() {
      g.classList.remove("writing");
      return setArm(0, 260);
    }
    function idle(ms) {
      g.classList.remove("writing");
      setArm(0, 260);
      return moveTo(IDLE_SPOT.x, IDLE_SPOT.y, ms || 1100);
    }
    function reset() {
      for (const a of own.splice(0)) a.cancel();
      pos = { x: IDLE_SPOT.x, y: IDLE_SPOT.y };
      g.style.transform = place(pos);
      armAngle = 0;
      armRPivot.style.transform = "rotate(0deg)";
      g.classList.remove("walking", "writing");
    }

    return { g, moveTo, writeAt, stopWriting, idle, setArm, reset, get position() { return { ...pos }; } };
  }

  /* ---------- projector screen ---------- */
  const SCREEN_UP = -330;
  function createScreen(prefix) {
    const g = el("g", { class: "screen scripted", style: `transform: translateY(${SCREEN_UP}px)` });
    const content = el("g", { class: "slide-content", transform: "translate(236,36)" });
    const sheet = el("g", { class: "screen-sheet" }, [
      el("rect", { x: 236, y: 36, width: 488, height: 272, rx: 6, fill: "#F7F4EC", stroke: INK, "stroke-width": 2.5 }),
      content
    ]);
    g.append(
      el("rect", { x: 222, y: 20, width: 516, height: 18, rx: 9, fill: "#4E4A42", stroke: INK, "stroke-width": 2 }),
      sheet
    );
    let y = SCREEN_UP;
    const own = [];

    function slideTo(target, ms, settle) {
      if (reduceMotion()) {
        y = target; g.style.transform = `translateY(${target}px)`;
        return Promise.resolve();
      }
      const from = y;
      const frames = settle
        ? [{ transform: `translateY(${from}px)`, offset: 0 }, { transform: `translateY(${target + 12}px)`, offset: 0.82 }, { transform: `translateY(${target}px)`, offset: 1 }]
        : [{ transform: `translateY(${from}px)` }, { transform: `translateY(${target}px)` }];
      const a = track(g.animate(frames, { duration: ms, easing: "cubic-bezier(0.4, 0.1, 0.3, 1)", fill: "forwards" }));
      own.push(a);
      return a.finished.then(() => {
        y = target;
        g.style.transform = `translateY(${target}px)`;
        a.cancel();
      }, () => {});
    }

    function setSlide(slide, index, total) {
      content.replaceChildren();
      content.append(
        el("text", { x: 32, y: 66, "font-family": UI, "font-weight": 800, "font-size": 34, fill: TEAL_INK }, [text(slide.title)]),
        el("rect", { x: 32, y: 84, width: 80, height: 5, rx: 2.5, fill: ORANGE })
      );
      slide.lines.forEach((line, i) => {
        content.append(el("text", { x: 36, y: 132 + i * 46, "font-family": UI, "font-size": line.length > 42 ? 16 : 20, fill: INK }, [text(line)]));
      });
      content.append(el("text", { x: 32, y: 252, "font-family": UI, "font-size": 12, "font-weight": 700, fill: "#6F6A60" }, [
        text(`${DATA.cls.short} · ${index + 1} of ${total}`)
      ]));
    }

    function reset() {
      for (const a of own.splice(0)) a.cancel();
      y = SCREEN_UP;
      g.style.transform = `translateY(${SCREEN_UP}px)`;
      content.replaceChildren();
    }

    return {
      g,
      down: (ms) => slideTo(0, ms || 1100, true),
      up: (ms) => slideTo(SCREEN_UP, ms || 900, false),
      get isDown() { return y === 0; },
      setSlide, reset
    };
  }

  /* ---------- students ---------- */
  function createStudents() {
    const g = el("g", { class: "students", "aria-label": "Students" });
    DATA.students.forEach((s, i) => {
      const x = 150 + i * 96;
      g.append(el("g", { transform: `translate(${x},0)`, class: "student", "data-name": s.name }, [
        el("rect", { x: -26, y: 456, width: 52, height: 90, rx: 16, fill: s.shirt }),
        el("rect", { x: -7, y: 438, width: 14, height: 22, fill: SKIN }),
        el("circle", { cx: 0, cy: 428, r: 20, fill: SKIN }),
        el("path", { d: "M-21 428 Q-22 404 0 404 Q22 404 21 428 Q14 414 0 414 Q-14 414 -21 428 Z", fill: s.hair }),
        el("circle", { cx: -7, cy: 430, r: 2.2, fill: INK }),
        el("circle", { cx: 7, cy: 430, r: 2.2, fill: INK }),
        el("rect", { x: -54, y: 474, width: 108, height: 12, rx: 5, fill: "#A97A4E", stroke: INK, "stroke-width": 2 }),
        el("rect", { x: -48, y: 486, width: 7, height: 54, fill: "#7A5333" }),
        el("rect", { x: 41, y: 486, width: 7, height: 54, fill: "#7A5333" })
      ]));
    });
    return g;
  }

  /* ---------- full room ---------- */
  let uid = 0;
  function room(container, opts) {
    opts = opts || {};
    const prefix = opts.prefix || "room" + (++uid);
    const svg = el("svg", {
      viewBox: "0 0 960 540", class: "room-svg", role: "img",
      "aria-label": opts.label || "Illustrated classroom with a whiteboard, a teacher and seated students"
    });
    const windows = [40, 790].map((x) => el("g", null, [
      el("polygon", { points: `${x + 8},200 ${x + 122},200 ${x + 170},350 ${x - 40},350`, fill: "#FFFFFF", opacity: 0.16 }),
      el("rect", { x, y: 40, width: 130, height: 170, rx: 4, fill: "#CFE3E6", stroke: INK, "stroke-width": 3 }),
      el("path", { d: `M${x + 65} 40 V210 M${x} 125 H${x + 130}`, stroke: INK, "stroke-width": 3 })
    ]));
    const planks = [392, 434, 476, 518].map((y) => el("path", { d: `M0 ${y} H960`, stroke: "#C9A476", "stroke-width": 2, opacity: 0.6 }));
    const board = createBoard(prefix, { role: opts.role, interactive: opts.interactive, onMark: opts.onMark });
    board.g.setAttribute("transform", `translate(${BOARD_ORIGIN.x},${BOARD_ORIGIN.y})`);
    const screen = createScreen(prefix);
    const teacher = createTeacher(prefix);
    const students = createStudents();
    svg.append(
      el("rect", { x: 0, y: 0, width: 960, height: 350, fill: "#EADCC3" }),
      el("rect", { x: 0, y: 318, width: 960, height: 32, fill: "#D9C6A5" }),
      el("rect", { x: 0, y: 350, width: 960, height: 190, fill: "#D6B68A" }),
      ...planks,
      ...windows,
      board.g,
      screen.g,
      teacher.g,
      students
    );
    if (container) container.appendChild(svg);
    return {
      svg,
      board,
      screen,
      teacher,
      reset() { teacher.reset(); screen.reset(); },
      setPaused(p) { if (container) container.classList.toggle("paused", p); setPaused(p); }
    };
  }

  // Board on its own (used on phones and in the device frames).
  function boardView(container, opts) {
    opts = opts || {};
    const prefix = opts.prefix || "board" + (++uid);
    const svg = el("svg", { viewBox: "-14 -14 528 278", class: "board-svg", role: "img", "aria-label": opts.label || "Whiteboard" });
    const board = createBoard(prefix, { role: opts.role, interactive: opts.interactive, onMark: opts.onMark });
    svg.append(board.g);
    if (container) container.appendChild(svg);
    return { svg, board };
  }

  /* ---------- question card (teacher inbox) ---------- */
  function questionCard(q, handlers) {
    const card = document.createElement("article");
    card.className = "q-card" + (q.status === "done" ? " is-done" : "") + (q.pinned ? " is-pinned" : "");
    card.dataset.id = q.id;
    const snap = document.createElement("div");
    snap.className = "q-snap";
    if (q.snapHTML) snap.innerHTML = q.snapHTML;
    const body = document.createElement("div");
    body.className = "q-body";
    const meta = document.createElement("div");
    meta.className = "q-meta";
    const who = document.createElement("strong");
    who.textContent = q.student;
    const when = document.createElement("time");
    when.textContent = q.time;
    meta.append(who, when);
    const txt = document.createElement("p");
    txt.className = "q-text";
    txt.textContent = q.text;
    const chips = document.createElement("div");
    chips.className = "q-actions";
    const st = document.createElement("span");
    st.className = "chip " + (q.status === "done" ? "chip-done" : "chip-new");
    st.textContent = q.status === "done" ? "Answered" : "New";
    chips.append(st);
    if (q.pinned) {
      const pin = document.createElement("span");
      pin.className = "chip";
      pin.textContent = "Pinned";
      chips.append(pin);
    }
    const actions = document.createElement("div");
    actions.className = "q-actions";
    const ans = document.createElement("button");
    ans.className = "btn btn-sm";
    ans.type = "button";
    ans.textContent = q.status === "done" ? "Undo answered" : "Mark answered";
    ans.addEventListener("click", () => handlers && handlers.onAnswer && handlers.onAnswer(q));
    const pin = document.createElement("button");
    pin.className = "btn btn-sm";
    pin.type = "button";
    pin.setAttribute("aria-pressed", String(!!q.pinned));
    pin.textContent = q.pinned ? "Unpin" : "Pin";
    pin.addEventListener("click", () => handlers && handlers.onPin && handlers.onPin(q));
    actions.append(ans, pin);
    body.append(meta, txt, chips, actions);
    card.append(snap, body);
    return card;
  }

  window.Chalk = {
    NS, BOARD_ORIGIN, INK, PAPER, TEAL, ORANGE, HAND, UI,
    bus, track, setPaused, reduceMotion, wobble, qr, room, boardView, questionCard,
    createBoard, createScreen, createTeacher, el, text
  };
})();
