/* Chalkie app — interactions */
(function () {
  'use strict';

  /* ---------- dropdown menus ---------- */
  document.querySelectorAll('[data-menu-trigger]').forEach(function (trigger) {
    var menu = trigger.parentElement.querySelector('.menu');
    if (!menu) return;
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.contains('is-open');
      document.querySelectorAll('.menu.is-open').forEach(function (m) { m.classList.remove('is-open'); });
      menu.classList.toggle('is-open', !open);
      trigger.setAttribute('aria-expanded', String(!open));
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.menu.is-open').forEach(function (m) { m.classList.remove('is-open'); });
  });

  /* ---------- filter pills ---------- */
  document.querySelectorAll('.filters').forEach(function (group) {
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      group.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      var filter = btn.dataset.filter;
      document.querySelectorAll('[data-type]').forEach(function (card) {
        card.style.display = (!filter || filter === 'all' || card.dataset.type === filter) ? '' : 'none';
      });
    });
  });

  /* ---------- inspector tabs ---------- */
  document.querySelectorAll('.insp-tabs button').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.insp-tabs button').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      document.querySelectorAll('.insp-panel').forEach(function (p) {
        p.classList.toggle('is-active', p.id === tab.dataset.panel);
      });
    });
  });

  /* ---------- theme swatches ---------- */
  document.querySelectorAll('.swatch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      document.querySelectorAll('.swatch').forEach(function (s) { s.classList.toggle('is-active', s === sw); });
      var slide = document.querySelector('.slide');
      if (slide && sw.dataset.accent) {
        slide.style.setProperty('--brand', sw.dataset.accent);
        document.querySelectorAll('.slide .kicker').forEach(function (k) { k.style.color = sw.dataset.accent; });
      }
    });
  });

  /* ---------- slide editor ---------- */
  var SLIDES = window.CHALKIE_SLIDES || [];
  var canvas = document.querySelector('[data-canvas]');
  var current = 0;

  function paint(i) {
    if (!canvas || !SLIDES[i]) return;
    var s = SLIDES[i];
    canvas.innerHTML =
      '<div class="kicker">' + s.kicker + '</div>' +
      '<h2>' + s.title + '</h2>' +
      '<ul>' + s.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
      '<div class="slide-foot"><span>' + s.foot + '</span><span>Slide ' + (i + 1) + ' of ' + SLIDES.length + '</span></div>';
    document.querySelectorAll('.thumb').forEach(function (t, n) { t.classList.toggle('is-active', n === i); });
    current = i;
  }

  document.querySelectorAll('.thumb').forEach(function (thumb, i) {
    thumb.addEventListener('click', function () { paint(i); });
  });
  if (canvas && SLIDES.length) paint(0);

  document.querySelectorAll('[data-nav-slide]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = current + Number(btn.dataset.navSlide);
      if (next >= 0 && next < SLIDES.length) paint(next);
    });
  });

  /* ---------- Edit with AI ---------- */
  var chat = document.querySelector('[data-chat]');
  var chatForm = document.querySelector('[data-chat-form]');

  var REPLIES = [
    { match: /simpl|easier|lower|scaffold|accessible/i,
      say: '<b>Updated slide ' + '{n}' + '.</b> Reduced the reading level, split the explanation into three shorter steps and added a labelled diagram.',
      apply: function (s) { s.points = ['Water heats up and turns into vapour', 'Vapour rises and cools into clouds', 'Clouds get heavy and rain falls', 'Rain flows back to rivers and the sea']; } },
    { match: /extension|stretch|challenge|early finisher|higher/i,
      say: '<b>Added an extension task.</b> Two stretch questions and a discussion prompt for early finishers.',
      apply: function (s) { s.points = s.points.concat(['<strong>Stretch:</strong> Explain why the water cycle is described as a closed system']); } },
    { match: /vocab|key word|glossar/i,
      say: '<b>Added key vocabulary.</b> Six tier-two terms with student-friendly definitions.',
      apply: function (s) { s.points = ['Evaporation', 'Condensation', 'Precipitation', 'Transpiration', 'Collection', 'Run-off']; } },
    { match: /question|quiz|check|assess/i,
      say: '<b>Added a check for understanding.</b> Four questions that build from recall to application.',
      apply: function (s) { s.points = ['What happens to water when it is heated?', 'Where does condensation take place?', 'Name two forms of precipitation', 'Why does the cycle never run out of water?']; } },
    { match: /short|fewer|trim|concise/i,
      say: '<b>Trimmed slide {n}.</b> Cut it back to three key points so it fits the time you have.',
      apply: function (s) { s.points = s.points.slice(0, 3); } }
  ];

  function addBubble(html, cls) {
    var el = document.createElement('div');
    el.className = 'bubble ' + cls;
    el.innerHTML = html;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
  }

  function askAI(text) {
    if (!text.trim()) return;
    addBubble(text.replace(/</g, '&lt;'), 'bubble--me');
    var thinking = addBubble('Editing slide ' + (current + 1) + '…', 'bubble--ai is-thinking');
    setTimeout(function () {
      var rule = REPLIES.find(function (r) { return r.match.test(text); });
      if (rule) {
        rule.apply(SLIDES[current]);
        paint(current);
        thinking.className = 'bubble bubble--ai';
        thinking.innerHTML = rule.say.replace('{n}', current + 1);
      } else {
        thinking.className = 'bubble bubble--ai';
        thinking.innerHTML = '<b>Updated slide ' + (current + 1) + '.</b> Rewrote the content to match your instruction. Tell me what else to change.';
      }
    }, 900);
  }

  if (chatForm) {
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = chatForm.querySelector('textarea');
      askAI(box.value);
      box.value = '';
    });
    chatForm.querySelector('textarea').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatForm.requestSubmit(); }
    });
  }
  document.querySelectorAll('.suggest button').forEach(function (b) {
    b.addEventListener('click', function () { askAI(b.textContent); });
  });

  /* ---------- generate flow ---------- */
  var genForm = document.querySelector('[data-generate]');
  if (genForm) {
    genForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var overlay = document.querySelector('.overlay');
      overlay.classList.add('is-open');
      var steps = overlay.querySelectorAll('.gen-step');
      steps.forEach(function (s, i) {
        setTimeout(function () {
          s.classList.add('is-done');
          s.querySelector('.dot').textContent = '✓';
          if (i === steps.length - 1) setTimeout(function () { window.location.href = 'lesson.html'; }, 700);
        }, 700 * (i + 1));
      });
    });
  }

  /* ---------- export toast ---------- */
  document.querySelectorAll('[data-export]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var note = document.querySelector('[data-export-note]');
      if (!note) return;
      note.textContent = 'Exporting to ' + btn.dataset.export + '…';
      note.style.opacity = '1';
      setTimeout(function () {
        note.textContent = 'Exported to ' + btn.dataset.export;
        setTimeout(function () { note.style.opacity = '0'; }, 1800);
      }, 1100);
    });
  });
})();
