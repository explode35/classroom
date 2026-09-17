/* ==========================================================================
   Doodle Desk — playable whiteboard demo
   A real, working mini version of the student board: pens, highlighter,
   eraser, emoji stamps, undo and PNG export. Strokes are kept as data so
   undo and re-draws stay crisp at any size.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("board");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var W = 1200;
  var H = 740;
  canvas.width = W;
  canvas.height = H;

  var items = [];        /* every stroke and stamp, in drawing order */
  var current = null;    /* the stroke being drawn right now */
  var tool = "pen";
  var colour = "#7c3aed";
  var size = 8;
  var stamp = null;

  /* ---- Drawing ---------------------------------------------------------- */
  function drawStroke(s) {
    if (s.points.length < 2) {
      /* A single tap should still leave a dot */
      ctx.beginPath();
      ctx.fillStyle = s.mode === "erase" ? "#ffffff" : s.colour;
      ctx.globalAlpha = s.alpha;
      ctx.arc(s.points[0].x, s.points[0].y, s.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    ctx.beginPath();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = s.width;
    ctx.globalAlpha = s.alpha;
    ctx.strokeStyle = s.mode === "erase" ? "#ffffff" : s.colour;
    ctx.moveTo(s.points[0].x, s.points[0].y);

    /* Quadratic midpoints — keeps handwriting smooth instead of jagged */
    for (var i = 1; i < s.points.length - 1; i++) {
      var mx = (s.points[i].x + s.points[i + 1].x) / 2;
      var my = (s.points[i].y + s.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(s.points[i].x, s.points[i].y, mx, my);
    }
    var last = s.points[s.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawStamp(s) {
    ctx.font = s.size + "px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(s.emoji, s.x, s.y);
  }

  function redraw() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    /* Faint ruled guide lines, like a real classroom board */
    ctx.strokeStyle = "rgba(124, 58, 237, 0.10)";
    ctx.lineWidth = 2;
    for (var y = 74; y < H; y += 74) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    items.forEach(function (item) {
      if (item.type === "stamp") drawStamp(item);
      else drawStroke(item);
    });

    if (current) drawStroke(current);
    updateCount();
  }

  function updateCount() {
    var badge = document.querySelector("[data-item-count]");
    if (badge) badge.textContent = items.length;
  }

  /* ---- Pointer handling ------------------------------------------------- */
  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height)
    };
  }

  canvas.addEventListener("pointerdown", function (e) {
    canvas.setPointerCapture(e.pointerId);
    var p = pos(e);

    if (tool === "stamp" && stamp) {
      items.push({ type: "stamp", emoji: stamp, x: p.x, y: p.y, size: size * 7 });
      redraw();
      return;
    }

    current = {
      type: "stroke",
      colour: colour,
      width: tool === "erase" ? size * 3 : tool === "marker" ? size * 3.2 : size,
      alpha: tool === "marker" ? 0.35 : 1,
      mode: tool === "erase" ? "erase" : "draw",
      points: [p]
    };
    redraw();
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!current) return;
    current.points.push(pos(e));
    redraw();
  });

  function endStroke() {
    if (!current) return;
    items.push(current);
    current = null;
    redraw();
  }

  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);
  canvas.addEventListener("pointerleave", endStroke);

  /* ---- Toolbar ---------------------------------------------------------- */
  function press(selector, activeEl) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.setAttribute("aria-pressed", String(el === activeEl));
    });
  }

  document.querySelectorAll("[data-colour]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      colour = btn.getAttribute("data-colour");
      if (tool === "erase" || tool === "stamp") setTool("pen");
      press("[data-colour]", btn);
    });
  });

  document.querySelectorAll("[data-size]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      size = parseInt(btn.getAttribute("data-size"), 10);
      press("[data-size]", btn);
    });
  });

  document.querySelectorAll("[data-stamp]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      stamp = btn.getAttribute("data-stamp");
      setTool("stamp");
      press("[data-stamp]", btn);
    });
  });

  function setTool(next) {
    tool = next;
    document.querySelectorAll("[data-tool]").forEach(function (el) {
      el.setAttribute("aria-pressed", String(el.getAttribute("data-tool") === next));
    });
    if (next !== "stamp") {
      stamp = null;
      press("[data-stamp]", null);
    }
    canvas.style.cursor = next === "stamp" ? "copy" : "crosshair";
  }

  document.querySelectorAll("[data-tool]").forEach(function (btn) {
    btn.addEventListener("click", function () { setTool(btn.getAttribute("data-tool")); });
  });

  var undoBtn = document.querySelector("[data-undo]");
  if (undoBtn) {
    undoBtn.addEventListener("click", function () {
      items.pop();
      redraw();
    });
  }

  var clearBtn = document.querySelector("[data-clear]");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      items = [];
      redraw();
    });
  }

  var saveBtn = document.querySelector("[data-save]");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      var link = document.createElement("a");
      link.download = "my-doodle-desk-board.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }

  /* Ctrl/Cmd+Z, because muscle memory is universal */
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      items.pop();
      redraw();
    }
  });

  /* ---- Fake "teacher sees everyone" panel ------------------------------- */
  var mini = document.querySelector("[data-mini-boards]");
  if (mini) {
    var names = ["Ava", "Ben", "Chloe", "Dev", "Esi", "Finn", "Gita", "Hugo"];
    var doodles = ["3x4=12", "H₂O", "🌋", "¾", "🐉", "y=mx+b", "🎻", "Σ"];
    mini.innerHTML = names.map(function (n, i) {
      return '<div class="board' + (i === 0 ? " board--live" : "") + '" data-name="' + n + '">' +
        "<span>" + doodles[i] + "</span></div>";
    }).join("");
  }

  setTool("pen");
  redraw();
})();
