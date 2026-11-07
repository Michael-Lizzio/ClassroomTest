/*
 * Questions inbox: the teacher's private queue of student questions.
 * Each question carries a snapshot of the board (never shown on the board itself).
 */
(function () {
  "use strict";
  const C = window.Chalk;

  // board: the teacher's board API. Snapshots are taken from it when a question arrives.
  function createInbox(container, board, opts) {
    opts = opts || {};
    const items = [];
    let arriving = null;
    let onChange = opts.onChange || function () {};

    function withSnapshot(q) {
      const svg = board.snapshot(q.region, [Object.assign({ kind: "ring" }, q.ring)]);
      q.snapHTML = svg.outerHTML;
      return q;
    }

    function render() {
      container.replaceChildren();
      // Pinned first, then newest first.
      const ordered = items.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.seq - a.seq);
      if (!ordered.length) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "No questions yet. They arrive here, never on the board.";
        container.append(empty);
      }
      for (const q of ordered) {
        const card = C.questionCard(q, {
          onAnswer: (item) => { item.status = item.status === "done" ? "new" : "done"; C.bus.emit("question:status", { id: item.id, status: item.status }); render(); },
          onPin: (item) => { item.pinned = !item.pinned; render(); }
        });
        if (arriving === q.id) card.classList.add("is-arriving");
        container.append(card);
      }
      arriving = null;
      onChange(stats());
    }

    function stats() {
      const done = items.filter((q) => q.status === "done").length;
      return { total: items.length, open: items.length - done, done };
    }

    let seq = 0;
    function add(q) {
      if (items.some((x) => x.id === q.id)) return;
      const item = withSnapshot(Object.assign({ status: "new", pinned: false, seq: ++seq }, q));
      items.push(item);
      arriving = item.id;
      render();
      if (opts.onArrive) opts.onArrive(item);
      return item;
    }

    return {
      add,
      render,
      stats,
      setAnswered(id, val) { const q = items.find((x) => x.id === id); if (q) { q.status = val ? "done" : "new"; C.bus.emit("question:status", { id, status: q.status }); render(); } },
      setPinned(id, val) { const q = items.find((x) => x.id === id); if (q) { q.pinned = val; render(); } },
      has(id) { return items.some((x) => x.id === id); },
      clear() { items.length = 0; render(); },
      set onChange(fn) { onChange = fn; }
    };
  }

  window.ChalkInbox = { create: createInbox };
})();
