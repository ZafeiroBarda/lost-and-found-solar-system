/* Lost & Found app: viewport window, shelves, case files, sources page, Archie, sound, progress.
 * Every word on screen comes from content.json through LF (core.js).
 */
(function () {
  'use strict';
  var C = LF.content;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- small storage helpers (never required to work) ---------- */
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }
  var solved = load('lf.solved', []);
  var soundOn = load('lf.sound', true);

  /* ---------- sound: tiny synthesized effects ---------- */
  var audio = null;
  function sfx(name) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var tones = {
        bell: [[1864, 'sine', 1.6], [3728, 'triangle', 1.2]], ok: [[880, 'sine', 0.18]], no: [[220, 'square', 0.22]],
        beep: [[1200, 'sine', 0.25]], echo: [[1320, 'sine', 0.3]], laser: [[650, 'sawtooth', 0.12]], grind: [[90, 'sawtooth', 0.6]],
        page: [[520, 'triangle', 0.08]]
      }[name] || [[600, 'sine', 0.1]];
      var now = audio.currentTime;
      tones.forEach(function (t) {
        var o = audio.createOscillator(), gn = audio.createGain();
        o.type = t[1];
        o.frequency.setValueAtTime(t[0], now);
        if (name === 'grind') o.frequency.linearRampToValueAtTime(60, now + t[2]);
        gn.gain.setValueAtTime(0.18, now);
        gn.gain.exponentialRampToValueAtTime(0.001, now + t[2]);
        o.connect(gn); gn.connect(audio.destination);
        o.start(now); o.stop(now + t[2]);
      });
    } catch (e) { /* no audio, no problem */ }
  }

  /* Texts are written plain. Their sources live in content.json and on the Sources page. */
  function writeText(el, obj, vars, prefix) {
    el.textContent = (prefix ? prefix + ' ' : '') + LF.text(obj, vars);
  }

  /* ---------- static texts marked in the HTML ---------- */
  function fillStatic() {
    document.title = LF.ui('appTitle');
    document.querySelectorAll('[data-ui]').forEach(function (el) { el.textContent = LF.ui(el.getAttribute('data-ui')); });
    document.querySelectorAll('[data-ui-attr]').forEach(function (el) {
      el.getAttribute('data-ui-attr').split(',').forEach(function (pair) {
        var p = pair.split(':'); el.setAttribute(p[0].trim(), LF.ui(p[1].trim()));
      });
    });
    var s = $('#sound');
    s.textContent = LF.ui(soundOn ? 'soundOn' : 'soundOff');
    s.setAttribute('aria-pressed', soundOn);
    $('#progress').textContent = LF.ui('progress', { n: solved.length, total: C.machines.length });
  }

  /* ---------- the viewport window: stars, Moon, Mars, Voyager ---------- */
  function renderViewport() {
    var vp = $('#viewport');
    vp.innerHTML = '<div class="vp-sky"><div class="vp-stars"></div></div>' +
      '<button type="button" class="vp-target vp-moon" data-file="reflector"><span class="vp-glint"></span></button>' +
      '<button type="button" class="vp-target vp-mars" data-file="spirit"></button>' +
      '<button type="button" class="vp-target vp-voyager" data-file="voyager"></button>' +
      '<span class="vp-shooting"></span><span class="vp-pane-h"></span><span class="vp-pane-v"></span>' +
      '<span class="vp-label mono"></span>';
    var stars = $('.vp-stars', vp), seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 70; i++) {
      var st = document.createElement('span');
      st.className = 'star' + (rnd() > 0.7 ? ' twinkle' : '');
      st.style.left = (rnd() * 100) + '%';
      st.style.top = (rnd() * 100) + '%';
      var size = 1 + rnd() * 2.2;
      st.style.width = st.style.height = size + 'px';
      st.style.animationDelay = (rnd() * 4) + 's';
      stars.appendChild(st);
    }
    $('.vp-label', vp).textContent = LF.ui('windowLabel');
    [['.vp-moon', 'windowMoon', 'shelf-moon'], ['.vp-mars', 'windowMars', 'shelf-mars'], ['.vp-voyager', 'windowVoyager', 'shelf-deep']].forEach(function (p) {
      var b = $(p[0], vp);
      b.setAttribute('aria-label', LF.ui(p[1]));
      b.title = LF.ui(p[1]);
      b.onclick = function () {
        sfx('beep');
        var target = document.getElementById(p[2]);
        if (target) {
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          target.classList.add('guide-highlight');
          setTimeout(function () { target.classList.remove('guide-highlight'); }, 1600);
        }
      };
    });
    if (!reduced) {
      vp.onpointermove = function (e) {
        var r = vp.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        $('.vp-stars', vp).style.transform = 'translate(' + (x * -8) + 'px,' + (y * -8) + 'px)';
        $('.vp-moon', vp).style.transform = 'translate(' + (x * -16) + 'px,' + (y * -16) + 'px)';
        $('.vp-mars', vp).style.transform = 'translate(' + (x * -11) + 'px,' + (y * -11) + 'px)';
      };
      vp.onpointerleave = function () { vp.querySelectorAll('.vp-stars,.vp-moon,.vp-mars').forEach(function (e) { e.style.transform = ''; }); };
    }
  }

  /* ---------- shelves ---------- */
  function renderShelves() {
    var root = $('#shelves');
    root.innerHTML = '';
    C.shelves.forEach(function (shelf) {
      var sec = document.createElement('section');
      sec.className = 'shelf';
      sec.id = 'shelf-' + shelf.id;
      sec.innerHTML = '<h2 class="shelf-title"></h2><div class="shelf-row"></div><div class="plank" aria-hidden="true"></div>';
      $('.shelf-title', sec).textContent = LF.text(shelf.title);
      var row = $('.shelf-row', sec);
      C.machines.filter(function (m) { return m.shelf === shelf.id; }).forEach(function (m) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'machine m-' + m.icon + (solved.indexOf(m.id) >= 0 ? ' is-solved' : '');
        b.setAttribute('data-id', m.id);
        b.innerHTML = window.LF_ICON(m.icon) +
          '<span class="tag"><span class="tag-code mono"></span><span class="tag-name"></span>' +
          '<span class="tag-status"><span class="dot ' + m.kind + '"></span><span class="status-text"></span></span></span>' +
          '<span class="solved-stamp"></span>';
        $('.tag-code', b).textContent = m.code;
        $('.tag-name', b).textContent = LF.text(m.name);
        $('.status-text', b).textContent = LF.text(m.status);
        $('.solved-stamp', b).textContent = LF.ui('solved');
        b.onclick = function () { location.hash = '#/file/' + m.id; };
        row.appendChild(b);
      });
      if (shelf.id === C.shelves[C.shelves.length - 1].id) row.appendChild(reservedSlot());
      root.appendChild(sec);
    });
  }

  function reservedSlot() {
    var d = document.createElement('div');
    d.className = 'machine reserved';
    d.id = 'reserved';
    d.innerHTML = window.LF_ICON('reserved') +
      '<span class="tag"><span class="tag-name"></span><span class="tag-text"></span>' +
      '<form class="tag-form"><input type="text" maxlength="60"><button type="submit" class="btn small"></button></form>' +
      '<span class="tag-saved" aria-live="polite"></span></span>';
    $('.tag-name', d).textContent = LF.ui('reservedTitle');
    $('.tag-text', d).textContent = LF.ui('reservedText');
    var input = $('input', d);
    input.placeholder = LF.ui('reservedPlaceholder');
    input.setAttribute('aria-label', LF.ui('reservedPlaceholder'));
    $('button', d).textContent = LF.ui('reservedButton');
    var savedEl = $('.tag-saved', d);
    function show(v) { savedEl.textContent = v ? LF.ui('reservedSaved', { value: v }) + ' ' + LF.ui('reservedLocal') : ''; }
    show(load('lf.reserved', ''));
    $('form', d).onsubmit = function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      save('lf.reserved', v);
      input.value = '';
      sfx('bell');
      d.classList.remove('tagged'); void d.offsetWidth; d.classList.add('tagged');
      show(v);
    };
    return d;
  }

  function renderMyth() {
    var root = $('#myth');
    root.classList.remove('revealed');
    root.innerHTML = '<h2 class="myth-title"></h2><blockquote class="myth-quote"></blockquote>' +
      '<div class="myth-guess"><button type="button" class="btn stamp-btn" data-guess="fact"></button>' +
      '<button type="button" class="btn stamp-btn" data-guess="myth"></button></div>' +
      '<span class="stamp red myth-verdict"></span><p class="myth-result"></p><p class="myth-text"></p>';
    $('.myth-title', root).textContent = LF.ui('mythTitle');
    $('.myth-quote', root).textContent = LF.text(C.myth.quote);
    $('[data-guess="fact"]', root).textContent = LF.ui('factStamp');
    $('[data-guess="myth"]', root).textContent = LF.text(C.myth.verdict);
    $('.myth-verdict', root).textContent = LF.text(C.myth.verdict);
    root.querySelectorAll('[data-guess]').forEach(function (b) {
      b.onclick = function () {
        var ok = b.getAttribute('data-guess') === 'myth';
        sfx(ok ? 'ok' : 'no');
        $('.myth-result', root).textContent = LF.ui(ok ? 'correct' : 'wrong');
        writeText($('.myth-text', root), C.myth.text);
        root.classList.add('revealed');
      };
    });
  }

  /* ---------- sources page: one list, grouped by file ---------- */
  function collectSrc(node, set) {
    if (Array.isArray(node)) { node.forEach(function (n) { collectSrc(n, set); }); return set; }
    if (node && typeof node === 'object') {
      Object.keys(node).forEach(function (k) {
        if ((k === 'src' || /_src$/.test(k)) && Array.isArray(node[k])) node[k].forEach(function (id) { set.push(id); });
        else collectSrc(node[k], set);
      });
    }
    return set;
  }
  function sourceItem(id) {
    var s = C.sources[id] || {}, li = document.createElement('li'), a = document.createElement('a');
    a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.title;
    var meta = document.createElement('span'); meta.className = 'src-meta';
    meta.textContent = ' ' + s.publisher + (s.date ? ', ' + s.date.slice(0, 4) : '');
    li.appendChild(a); li.appendChild(meta);
    return li;
  }
  function renderSources() {
    var box = $('#sources-body');
    box.innerHTML = '';
    var intro = document.createElement('p'); intro.textContent = LF.ui('sourcesIntro'); box.appendChild(intro);
    var counts = {};
    C.machines.forEach(function (m) {
      collectSrc(m, []).filter(function (v, i, a) { return a.indexOf(v) === i; }).forEach(function (id) { counts[id] = (counts[id] || 0) + 1; });
    });
    var shown = {};
    C.machines.forEach(function (m) {
      var ids = collectSrc(m, []).filter(function (v, i, a) { return a.indexOf(v) === i && counts[v] === 1; });
      if (!ids.length) return;
      var h = document.createElement('h3'); h.textContent = LF.text(m.name); box.appendChild(h);
      var ol = document.createElement('ul'); ol.className = 'src-list';
      ids.forEach(function (id) { shown[id] = 1; ol.appendChild(sourceItem(id)); });
      box.appendChild(ol);
    });
    var rest = Object.keys(C.sources).filter(function (id) { return !shown[id]; });
    var h = document.createElement('h3'); h.textContent = LF.ui('sourcesGeneral'); box.appendChild(h);
    var ul = document.createElement('ul'); ul.className = 'src-list';
    rest.forEach(function (id) { ul.appendChild(sourceItem(id)); });
    box.appendChild(ul);
  }
  function openSources() { renderSources(); var d = $('#sources'); d.hidden = false; $('#sources-close').focus(); }
  function closeSources() { $('#sources').hidden = true; $('#open-sources').focus(); }

  /* ---------- case file ---------- */
  var openId = null, openPage = 'why';
  function openFile(id) {
    var m = C.machines.filter(function (x) { return x.id === id; })[0];
    if (!m) { closeFile(); return; }
    if (openId !== id) openPage = 'why';
    openId = id;
    var view = $('#file-view');
    view.classList.remove('is-solved');
    view.innerHTML =
      '<div class="file-bar"><button type="button" class="btn back"></button><span class="file-progress mono"></span></div>' +
      '<article class="folder">' +
      '<span class="folder-tab mono"></span>' +
      '<header class="folder-head">' + window.LF_ICON(m.icon, 'file-icon') +
      '<div><h2 class="file-name"></h2><p class="file-meta"><span class="file-place"></span>' +
      '<span class="file-status"><span class="dot ' + m.kind + '"></span><span class="status-text"></span></span></p></div></header>' +
      '<div class="folder-body">' +
      '<section class="play"><h3 class="play-heading"></h3><div class="game"></div></section>' +
      '<aside class="dossier">' +
      '<figure class="photo"><img loading="lazy"><figcaption><span class="cap"></span><span class="credit"></span></figcaption></figure>' +
      '<div class="sticky"><span class="sticky-label"></span><p class="hand"></p></div>' +
      '<div class="pages"><div class="page-tabs" role="tablist"></div><div class="page" role="tabpanel"><span class="stamp"></span><p class="page-text"></p></div></div>' +
      '<p class="fiction-key"></p>' +
      '</aside></div>' +
      '<div class="file-actions"><button type="button" class="btn next"></button></div>' +
      '</article>';
    $('.back', view).textContent = LF.ui('back');
    $('.back', view).onclick = function () { location.hash = '#/'; };
    $('.file-progress', view).textContent = LF.ui('progress', { n: solved.length, total: C.machines.length });
    $('.folder-tab', view).textContent = LF.ui('caseFile') + ' ' + m.code;
    $('.file-name', view).textContent = LF.text(m.name);
    writeText($('.file-place', view), m.place);
    writeText($('.file-status .status-text', view), m.status);
    if (m.photo) {
      var img = $('.photo img', view);
      img.src = m.photo.file;
      img.alt = LF.text(m.photo.caption);
      writeText($('.photo .cap', view), m.photo.caption);
      $('.photo .credit', view).textContent = LF.ui('photoCredit', { credit: m.photo.credit });
      $('.photo', view).onclick = function () { $('.photo', view).classList.toggle('zoom'); };
    } else {
      $('.photo', view).remove();
    }
    $('.sticky-label', view).textContent = LF.ui('archivistNote');
    $('.hand', view).textContent = LF.text(m.archivist);
    $('.fiction-key', view).textContent = LF.ui('fictionKey');
    $('.play-heading', view).textContent = LF.ui('playHeading');

    /* the four fact pages as folder tabs */
    var tabs = $('.page-tabs', view), keys = ['why', 'how', 'found', 'now'];
    tabs.setAttribute('aria-label', LF.ui('factPages'));
    $('.page .stamp', view).textContent = LF.ui('factStamp');
    function showPage(k, focus) {
      openPage = k;
      tabs.querySelectorAll('button').forEach(function (b) {
        var on = b.getAttribute('data-page') === k;
        b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      var page = $('.page', view);
      page.classList.remove('flip'); void page.offsetWidth; page.classList.add('flip');
      writeText($('.page-text', view), m.file[k]);
    }
    keys.forEach(function (k, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-page', k);
      b.textContent = LF.ui(k);
      b.onclick = function () { sfx('page'); showPage(k); };
      b.onkeydown = function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); showPage(keys[(i + d + keys.length) % keys.length], true); }
      };
      tabs.appendChild(b);
    });
    showPage(openPage);

    var idx = C.machines.indexOf(m), next = C.machines[(idx + 1) % C.machines.length];
    $('.next', view).textContent = LF.ui('nextFile') + ': ' + LF.text(next.name);
    $('.next', view).onclick = function () { location.hash = '#/file/' + next.id; };

    var game = window.LF_GAMES[m.game.type];
    var g = {
      cfg: m.game,
      machine: m,
      reduced: reduced,
      t: function (key, vars) { return LF.text(m.game.texts[key], vars); },
      say: function (el, key, vars, prefix) { writeText(el, m.game.texts[key], vars, prefix); },
      sayObj: function (el, obj, vars, prefix) { writeText(el, obj, vars, prefix); },
      note: function (parent, key, vars) {
        var p = document.createElement('p'); p.className = 'note';
        writeText(p, m.game.texts[key], vars);
        parent.appendChild(p);
      },
      sfx: sfx,
      solved: function () {
        if (solved.indexOf(m.id) < 0) { solved.push(m.id); save('lf.solved', solved); }
        $('.file-progress', view).textContent = LF.ui('progress', { n: solved.length, total: C.machines.length });
        view.classList.add('is-solved');
      }
    };
    if (game) game($('.game', view), g);

    document.body.classList.add('file-open');
    view.hidden = false;
    window.scrollTo(0, 0);
    $('.back', view).focus();
  }

  function closeFile() {
    var view = $('#file-view');
    view.hidden = true;
    view.innerHTML = '';
    document.body.classList.remove('file-open');
    var was = openId;
    openId = null;
    fillStatic();
    renderShelves();
    if (was) { var b = document.querySelector('.machine[data-id="' + was + '"]'); if (b) b.focus(); }
  }

  function route() {
    var m = location.hash.match(/^#\/file\/(\w+)/);
    if (m) openFile(m[1]); else closeFile();
  }

  /* ---------- Archie, the desk robot ---------- */
  var tourAt = -1;
  function guideSay(text, buttons) {
    $('#guide').classList.remove('collapsed');
    $('#guide-text').textContent = text;
    var row = $('#guide-buttons');
    row.innerHTML = '';
    (buttons || []).forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'btn small' + (b[2] ? ' ghost' : '');
      el.textContent = b[0]; el.onclick = b[1];
      row.appendChild(el);
    });
  }
  function highlight(id) {
    document.querySelectorAll('.guide-highlight').forEach(function (e) { e.classList.remove('guide-highlight'); });
    var el = id && document.getElementById(id);
    if (el) { el.classList.add('guide-highlight'); el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
  }
  function tour(i) {
    var G = C.guide;
    if (openId) location.hash = '#/';
    if (i >= G.steps.length) { tourAt = -1; highlight(null); guideSay(LF.text(G.bye), [[LF.text(G.close), guideClose]]); return; }
    tourAt = i;
    highlight(G.steps[i].target);
    var b = [];
    if (i > 0) b.push([LF.text(G.back), function () { tour(i - 1); }, true]);
    b.push([LF.text(i === G.steps.length - 1 ? G.end : G.next), function () { tour(i + 1); }]);
    guideSay((i + 1) + '/' + G.steps.length + '  ' + LF.text(G.steps[i].text), b);
  }
  function greet() {
    var G = C.guide;
    tourAt = -1;
    guideSay(LF.text(G.hello), [[LF.text(G.yes), function () { tour(0); }], [LF.text(G.no), guideClose, true]]);
  }
  function guideClose() { tourAt = -1; highlight(null); $('#guide').classList.add('collapsed'); }

  /* ---------- language and controls ---------- */
  function rerender() {
    fillStatic();
    renderViewport();
    renderShelves();
    renderMyth();
    if (!$('#sources').hidden) renderSources();
    $('#guide-name').textContent = LF.text(C.guide.name);
    if (openId) openFile(openId);
    if (!$('#guide').classList.contains('collapsed')) { if (tourAt >= 0) tour(tourAt); else greet(); }
  }

  document.addEventListener('lf:language', rerender);
  $('#sound').onclick = function () { soundOn = !soundOn; save('lf.sound', soundOn); fillStatic(); if (soundOn) sfx('ok'); };
  $('#bell').onclick = function () { sfx('bell'); greet(); };
  $('#open-sources').onclick = openSources;
  /* progress is saved in this browser on purpose; this button starts the game over */
  $('#reset-progress').onclick = function () {
    solved = [];
    ['lf.solved', 'lf.reserved', 'lf.greeted'].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { /* private mode */ } });
    fillStatic();
    renderShelves();
    $('#reset-note').textContent = LF.ui('progressCleared');
    sfx('page');
  };
  $('#sources-close').onclick = closeSources;
  $('#sources').onclick = function (e) { if (e.target.id === 'sources') closeSources(); };
  $('#guide-avatar').innerHTML = window.LF_ICON('archie');
  $('#guide-avatar').onclick = function () { if ($('#guide').classList.contains('collapsed')) greet(); else guideClose(); };
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('#sources').hidden) closeSources();
    else if (openId) location.hash = '#/';
  });
  window.addEventListener('hashchange', route);

  rerender();
  route();
  if (!load('lf.greeted', false)) {
    setTimeout(function () { if (!openId) { save('lf.greeted', true); greet(); } }, 1200);
  }
  window.LF_APP = { resetProgress: function () { $('#reset-progress').click(); }, openFile: openFile, closeFile: closeFile, tour: tour, openSources: openSources, solved: function () { return solved.slice(); } };
})();
