/* The six mini games. Each one gets:
 *   root  the element to draw into
 *   g     helpers from app.js:
 *         g.cfg            the "game" object of this machine in content.json
 *         g.t(key, vars)   a text from g.cfg.texts in the current language
 *         g.say(el, key, vars, prefix)   write that text into el, with its source numbers
 *         g.sayObj(el, textObj, vars, prefix)
 *         g.note(parent, key, vars)      add a small note with sources
 *         g.sfx(name), g.solved(), g.reduced (prefers reduced motion)
 * No text is written here: every word comes from content.json.
 */
(function () {
  'use strict';
  var GAMES = {};
  function $(root, sel) { return root.querySelector(sel); }
  function button(cls, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + (cls || '');
    b.textContent = label;
    return b;
  }

/* ---------- laser reflector: aim at a mirror on the Moon, fire, time the real echo ---------- */
GAMES.laser = function (root, g) {
  root.innerHTML =
    '<p class="g-intro"></p>' +
    '<div class="moon-map"><div class="moon-disc"></div></div>' +
    '<p class="note map-note"></p>' +
    '<div class="laser-scene" aria-hidden="true"><span class="body earth"></span>' +
    '<span class="beam"><span class="photon"></span></span><span class="body moon"></span></div>' +
    '<div class="g-readout mono stopwatch"></div>' +
    '<div class="g-controls"></div><div class="g-out" aria-live="polite"></div><div class="g-notes"></div>';
  g.say($(root, '.g-intro'), 'intro');
  $(root, '.map-note').textContent = g.t('mapNote');
  var watch = $(root, '.stopwatch'), out = $(root, '.g-out'), notes = $(root, '.g-notes');
  var photon = $(root, '.photon'), disc = $(root, '.moon-disc');
  var aimed = null;
  watch.textContent = LF.ui('secondsUnit', { n: LF.fmt.number(0, 2) });
  var fire = button('primary', g.t('fire'));
  fire.disabled = true;
  $(root, '.g-controls').appendChild(fire);

  g.cfg.sites.forEach(function (site) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'site';
    b.style.left = site.x + '%';
    b.style.top = site.y + '%';
    b.setAttribute('data-site', site.id);
    b.innerHTML = '<span class="site-dot"></span><span class="site-label"></span>';
    $(b, '.site-label').textContent = LF.text(site.label);
    b.setAttribute('aria-label', LF.text(site.label));
    b.onclick = function (e) {
      e.stopPropagation();
      aimed = site;
      root.querySelectorAll('.site').forEach(function (x) { x.classList.toggle('aimed', x === b); });
      g.sfx('beep');
      g.say(out, 'aimed', { site: LF.text(site.label) });
      fire.disabled = false;
      fire.focus();
    };
    disc.appendChild(b);
  });
  disc.onclick = function () { g.sfx('no'); g.say(out, 'miss'); };

  fire.onclick = function () {
    if (!aimed) { g.say(out, 'needAim'); return; }
    var km = LF.calc.distanceKm('moon');
    if (km == null) {
      out.textContent = LF.ui('noData', { date: LF.fmt.day(LF.calc.tableEnd('moon')) });
      return;
    }
    var secs = LF.calc.echoSeconds(km);
    fire.disabled = true;
    notes.innerHTML = '';
    g.sfx('laser');
    g.say(out, 'waiting');
    disc.classList.add('firing');
    if (photon.animate) {
      photon.animate([{ left: '0%' }, { left: '100%' }, { left: '0%' }], { duration: secs * 1000, easing: 'linear' });
    }
    var start = performance.now(), done = false;
    (function tick() {            // display only; the end comes from the timer below
      if (done) return;
      var el = Math.min((performance.now() - start) / 1000, secs);
      watch.textContent = LF.ui('secondsUnit', { n: LF.fmt.number(el, 2) });
      requestAnimationFrame(tick);
    })();
    setTimeout(function () {      // a timer still fires when the tab is in the background
      done = true;
      disc.classList.remove('firing');
      watch.textContent = LF.ui('secondsUnit', { n: LF.fmt.number(secs, 2) });
      g.sfx('echo');
      g.say(out, 'result', { seconds: LF.fmt.duration(secs), km: LF.fmt.km(km) });
      g.note(notes, 'again');
      g.note(notes, 'method');
      fire.disabled = false;
      g.solved();
    }, secs * 1000);
  };
};

/* ---------- descent stage: drag each picture, stays on the Moon or flies home ---------- */
GAMES.sort = function (root, g) {
  root.innerHTML =
    '<p class="g-intro"></p><p class="note tap-hint"></p>' +
    '<div class="tray"></div>' +
    '<div class="zones">' +
    '<button type="button" class="zone zone-b" data-zone="B"><span class="zone-title"></span>' +
    '<span class="zone-art">' + window.LF_ICON('ascent') + '</span><span class="zone-items"></span></button>' +
    '<button type="button" class="zone zone-a" data-zone="A"><span class="zone-title"></span>' +
    '<span class="zone-art">' + window.LF_ICON('descent') + '</span><span class="zone-items"></span></button>' +
    '</div>' +
    '<div class="g-out" aria-live="polite"></div><div class="g-notes"></div>';
  g.say($(root, '.g-intro'), 'intro');
  $(root, '.tap-hint').textContent = g.t('tapHint');
  $(root, '.zone-a .zone-title').textContent = g.t('optionA');
  $(root, '.zone-b .zone-title').textContent = g.t('optionB');
  var tray = $(root, '.tray'), out = $(root, '.g-out'), notes = $(root, '.g-notes');
  var left = g.cfg.items.length, picked = null;

  function place(card, item, zone) {
    var ok = zone === item.answer;
    g.sfx(ok ? 'ok' : 'no');
    g.sayObj(out, item.why, null, LF.ui(ok ? 'correct' : 'wrong'));
    card.classList.remove('picked');
    picked = null;
    if (!ok) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); return; }
    card.disabled = true;
    card.classList.add('placed');
    $(root, '.zone-' + zone.toLowerCase() + ' .zone-items').appendChild(card);
    left -= 1;
    if (left === 0) finish();
  }
  function finish() {
    g.say(out, 'done');
    setTimeout(function () {
      $(root, '.zone-b').classList.add('liftoff');
      g.sfx('grind');
      g.note(notes, 'liftoff');
      g.solved();
    }, 500);
  }

  g.cfg.items.forEach(function (item) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.innerHTML = window.LF_ICON(item.icon) + '<span class="card-label"></span>';
    $(card, '.card-label').textContent = LF.text(item.label);
    card.setAttribute('data-item', item.id);
    card.onclick = function () {
      if (card.disabled || card.dragged) { card.dragged = false; return; }
      root.querySelectorAll('.card.picked').forEach(function (c) { if (c !== card) c.classList.remove('picked'); });
      card.classList.toggle('picked');
      picked = card.classList.contains('picked') ? { card: card, item: item } : null;
    };
    /* drag with mouse, pen or finger */
    card.onpointerdown = function (e) {
      if (card.disabled || e.button > 0) return;
      var sx = e.clientX, sy = e.clientY, moving = false;
      try { card.setPointerCapture(e.pointerId); } catch (err) { /* some browsers refuse; dragging still works */ }
      card.onpointermove = function (ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!moving && Math.abs(dx) + Math.abs(dy) < 8) return;
        moving = true;
        card.classList.add('dragging');
        card.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        root.querySelectorAll('.zone').forEach(function (z) {
          var r = z.getBoundingClientRect();
          z.classList.toggle('over', ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom);
        });
      };
      card.onpointerup = function (ev) {
        card.onpointermove = card.onpointerup = null;
        card.classList.remove('dragging');
        card.style.transform = '';
        root.querySelectorAll('.zone').forEach(function (z) { z.classList.remove('over'); });
        if (!moving) return;
        card.dragged = true;
        var target = null;
        root.querySelectorAll('.zone').forEach(function (z) {
          var r = z.getBoundingClientRect();
          if (ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom) target = z;
        });
        if (target) place(card, item, target.getAttribute('data-zone'));
      };
    };
    tray.appendChild(card);
  });

  root.querySelectorAll('.zone').forEach(function (z) {
    z.onclick = function () { if (picked) place(picked.card, picked.item, z.getAttribute('data-zone')); };
  });
};

/* ---------- Surveyor 3: click the parts Apollo 12 took off the lander ---------- */
GAMES.pick = function (root, g) {
  root.innerHTML =
    '<p class="g-intro"></p>' +
    '<div class="surveyor-scene"><div class="lander-wrap">' + window.LF_ICON('lander', 'lander', '0 0 240 210') + '</div>' +
    '<div class="bag"><span class="bag-title"></span><ul class="bag-items"></ul><span class="counter mono"></span></div></div>' +
    '<p class="note drawing-note"></p>' +
    '<div class="g-out" aria-live="polite"></div><div class="g-notes"></div>';
  g.say($(root, '.g-intro'), 'intro');
  $(root, '.bag-title').textContent = g.t('bag');
  $(root, '.drawing-note').textContent = g.t('drawingNote');
  var out = $(root, '.g-out'), counter = $(root, '.counter'), bag = $(root, '.bag-items');
  var total = g.cfg.items.filter(function (i) { return i.answer; }).length, found = 0;
  function count() { counter.textContent = g.t('found', { n: found, total: total }); }
  count();

  g.cfg.items.forEach(function (item) {
    var part = root.querySelector('[data-part="' + item.part + '"]');
    if (!part) return;
    part.setAttribute('tabindex', '0');
    part.setAttribute('role', 'button');
    part.setAttribute('aria-label', LF.text(item.label));
    var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = LF.text(item.label);
    part.insertBefore(title, part.firstChild);
    function choose(e) {
      if (e) e.stopPropagation();
      if (part.classList.contains('taken')) return;
      g.sfx(item.answer ? 'ok' : 'no');
      g.sayObj(out, item.why, null, LF.text(item.label) + ': ' + LF.ui(item.answer ? 'correct' : 'wrong'));
      if (!item.answer) { part.classList.remove('shake'); void part.getBoundingClientRect(); part.classList.add('shake'); return; }
      part.classList.add('taken');
      var li = document.createElement('li');
      li.textContent = LF.text(item.label);
      bag.appendChild(li);
      found += 1;
      count();
      if (found === total) { g.note($(root, '.g-notes'), 'done'); g.solved(); }
    }
    part.addEventListener('click', choose);
    part.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(e); } });
  });
};

/* ---------- Spirit: the stuck wheel digs up silica ---------- */
GAMES.spirit = function (root, g) {
  var need = g.cfg.drives_needed, drives = 0;
  root.innerHTML =
    '<p class="g-intro"></p>' +
    '<div class="mars-scene" aria-hidden="true"><span class="track"><span class="bright"></span></span>' +
    '<span class="rover">' + window.LF_ICON('spirit') + '</span><span class="dust"></span></div>' +
    '<div class="g-readout mono"><span class="warn wheel"></span><span class="drives"></span></div>' +
    '<div class="g-controls"></div>' +
    '<div class="meter hidden"><span class="meter-label"></span><span class="meter-bar"><span class="meter-fill"></span></span><span class="meter-value mono"></span></div>' +
    '<div class="g-out" aria-live="polite"></div><div class="g-notes"></div>';
  g.say($(root, '.g-intro'), 'intro');
  $(root, '.wheel').textContent = g.t('wheel');
  var drivesEl = $(root, '.drives'), out = $(root, '.g-out'), notes = $(root, '.g-notes');
  var rover = $(root, '.rover'), track = $(root, '.track'), dust = $(root, '.dust');
  function showDrives() { drivesEl.textContent = g.t('drives', { n: drives, total: need }); }
  showDrives();

  var START = 62, STEP = 14;
  var fwd = button('', g.t('forward')), rev = button('primary', g.t('reverse')), ana = button('', g.t('analyse'));
  ana.disabled = true;
  [fwd, rev, ana].forEach(function (b) { $(root, '.g-controls').appendChild(b); });

  fwd.onclick = function () {
    g.sfx('grind');
    rover.classList.remove('shake'); void rover.offsetWidth; rover.classList.add('shake');
    g.say(out, 'forwardResult');
  };
  rev.onclick = function () {
    if (drives >= need) return;
    drives += 1;
    g.sfx('grind');
    var x = START - STEP * drives;
    rover.style.left = x + '%';
    track.style.left = (x + 14) + '%';               // the dead front wheel sits at the rover's right end
    track.style.width = (STEP * drives) + '%';
    dust.style.left = (x + 16) + '%';
    dust.classList.remove('puff'); void dust.offsetWidth; dust.classList.add('puff');
    showDrives();
    if (drives < need) { g.say(out, 'reverseResult'); return; }
    track.classList.add('exposed');
    rev.disabled = true;
    fwd.disabled = true;
    ana.disabled = false;
    g.say(out, 'brightSoil');
    ana.focus();
  };
  ana.onclick = function () {
    ana.disabled = true;
    g.sfx('beep');
    g.say(out, 'analysing');
    var meter = $(root, '.meter'), fill = $(root, '.meter-fill'), val = $(root, '.meter-value');
    meter.classList.remove('hidden');
    $(root, '.meter-label').textContent = g.t('meter');
    var target = g.cfg.silica_percent, start = performance.now(), dur = g.reduced ? 1 : 1600, done = false;
    function show(p) { fill.style.width = (target * p) + '%'; val.textContent = '~' + Math.round(target * p) + '%'; }
    (function tick() {
      if (done) return;
      show(Math.min((performance.now() - start) / dur, 1));
      requestAnimationFrame(tick);
    })();
    setTimeout(function () {
      done = true;
      show(1);
      g.sfx('echo');
      g.say(out, 'result', { percent: target });
      g.note(notes, 'meaning');
      g.note(notes, 'rule');
      g.solved();
    }, dur);
  };
};

/* ---------- Ingenuity: hold to spin the rotors up, let go in the lift band ---------- */
GAMES.rotor = function (root, g) {
  var c = g.cfg, max = c.rpm_max;
  root.innerHTML =
    '<p class="g-intro"></p>' +
    '<div class="heli-scene" aria-hidden="true"><span class="heli">' + window.LF_ICON('ingenuity') + '</span><span class="heli-dust"></span></div>' +
    '<div class="gauge"><div class="gauge-bar"><span class="gauge-band ok"></span><span class="gauge-band high"></span><span class="gauge-fill"></span></div>' +
    '<span class="rpm-label mono"></span></div>' +
    '<div class="g-controls"></div><div class="g-out" aria-live="polite"></div><div class="g-notes"></div>';
  g.say($(root, '.g-intro'), 'intro');
  var heli = $(root, '.heli'), label = $(root, '.rpm-label'), fill = $(root, '.gauge-fill');
  var out = $(root, '.g-out'), notes = $(root, '.g-notes'), dust = $(root, '.heli-dust');
  $(root, '.gauge-band.ok').style.left = (c.lift_from / max * 100) + '%';
  $(root, '.gauge-band.ok').style.width = ((c.limit - c.lift_from) / max * 100) + '%';
  $(root, '.gauge-band.high').style.left = (c.limit / max * 100) + '%';
  $(root, '.gauge-band.high').style.width = ((max - c.limit) / max * 100) + '%';

  var rpm = 0, holding = false, flying = false, last = performance.now();
  var rate = max / c.spinup_seconds;
  function show() {
    label.textContent = g.t('rpm', { rpm: LF.fmt.number(Math.round(rpm / 10) * 10) });
    fill.style.width = (rpm / max * 100) + '%';
    heli.style.setProperty('--spin', rpm > 0 ? Math.max(40, 480000 / rpm) + 'ms' : '0ms');
    heli.classList.toggle('spinning', rpm > 50 && !g.reduced);
    dust.style.opacity = Math.min(rpm / max, 1).toFixed(2);
  }
  var timer = setInterval(function () {
    if (!root.isConnected) { clearInterval(timer); return; }
    var now = performance.now(), dt = (now - last) / 1000;
    last = now;
    if (holding) rpm = Math.min(max, rpm + rate * dt);
    else if (!flying) rpm = Math.max(0, rpm - rate * 1.5 * dt);
    show();
  }, 40);
  show();

  var hold = button('primary hold', g.t('hold'));
  $(root, '.g-controls').appendChild(hold);
  function press(e) {
    if (holding || flying) return;
    if (e && e.pointerId != null) { try { hold.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } }
    holding = true;
    hold.classList.add('pressed');
    heli.classList.remove('lift', 'wobble', 'shake');
    out.textContent = '';
    notes.innerHTML = '';
    g.sfx('grind');
  }
  function release() {
    if (!holding) return;
    holding = false;
    hold.classList.remove('pressed');
    var r = rpm;
    void heli.offsetWidth;
    if (r < c.lift_from) { g.sfx('no'); heli.classList.add('wobble'); g.say(out, 'low'); return; }
    if (r > c.limit) { g.sfx('no'); heli.classList.add('shake'); g.say(out, 'high'); return; }
    g.sfx('ok');
    flying = true;
    heli.classList.add('lift');
    g.say(out, 'ok');
    g.note(notes, 'done');
    g.note(notes, 'rule');
    g.solved();
    setTimeout(function () { flying = false; heli.classList.remove('lift'); hold.textContent = g.t('again'); }, 2600);
  }
  hold.addEventListener('pointerdown', press);
  hold.addEventListener('pointerup', release);
  hold.addEventListener('pointercancel', release);
  hold.addEventListener('lostpointercapture', release);
  hold.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
  hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); } });
  hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
};

/* ---------- Voyager 1: live distance, light time, a greeting that travels ---------- */
GAMES.voyager = function (root, g) {
  var ms = g.cfg.milestone, msDate = new Date(ms.at_utc);
  root.innerHTML =
    '<p class="g-intro"></p>' +
    '<dl class="live mono"><div><dt class="l-dist"></dt><dd class="v-dist"></dd></div>' +
    '<div><dt class="l-light"></dt><dd class="v-light"></dd></div></dl>' +
    '<p class="milestone"></p>' +
    '<div class="radio-scene" aria-hidden="true"><span class="body earth"></span><span class="beam"><span class="trail"></span><span class="photon"></span></span>' +
    '<span class="probe">' + window.LF_ICON('voyager') + '</span></div>' +
    '<p class="trip mono" aria-live="polite"></p>' +
    '<p class="record"></p>' +
    '<div class="send-row"><input type="text" class="msg" maxlength="120"></div>' +
    '<div class="g-controls"></div><div class="g-out" aria-live="polite"></div><div class="g-notes"></div>';
  g.say($(root, '.g-intro'), 'intro');
  g.say($(root, '.l-dist'), 'distance');
  g.say($(root, '.l-light'), 'light');
  g.say($(root, '.record'), 'record');
  var input = $(root, '.msg');
  input.placeholder = g.t('placeholder');
  input.setAttribute('aria-label', g.t('placeholder'));
  var notes = $(root, '.g-notes');
  ['simulationNote', 'localTime'].forEach(function (k) {
    var p = document.createElement('p'); p.className = 'note'; p.textContent = LF.ui(k); notes.appendChild(p);
  });
  g.note(notes, 'method');

  var dist = $(root, '.v-dist'), light = $(root, '.v-light'), mile = $(root, '.milestone');
  var photon = $(root, '.radio-scene .photon'), trail = $(root, '.radio-scene .trail'), trip = $(root, '.trip');
  var flight = null;   // {sent, secs, factor, simElapsed, last}
  function tick() {
    if (!root.isConnected) { clearInterval(timer); return; }
    var now = new Date(), km = LF.calc.distanceKm('voyager1', now);
    if (km == null) {
      dist.textContent = LF.ui('noData', { date: LF.fmt.day(LF.calc.tableEnd('voyager1')) });
      light.textContent = '';
    } else {
      dist.textContent = LF.fmt.km(km);
      light.textContent = LF.fmt.duration(LF.calc.lightSeconds(km));
    }
    if (now < msDate) g.say(mile, 'before', { countdown: LF.fmt.duration((msDate - now) / 1000), when: LF.fmt.when(msDate) });
    else g.say(mile, 'after', { when: LF.fmt.when(msDate) });
    if (flight) {
      var t = performance.now();
      flight.simElapsed += (t - flight.last) / 1000 * flight.factor;
      flight.last = t;
      var frac = Math.min(flight.simElapsed / flight.secs, 1);
      photon.style.left = (frac * 100) + '%';
      trail.style.width = (frac * 100) + '%';
      var pct = frac * 100;
      trip.textContent = g.t('progress', { pct: LF.fmt.number(pct, pct < 1 ? 4 : 1) + ' %' });
      if (frac >= 1) {
        trip.textContent = g.t('arrived');
        $(root, '.probe').classList.add('received');
        ff.disabled = true;
        g.sfx('echo');
        flight = null;
      }
    }
  }
  var timer = setInterval(tick, 100);
  tick();

  var send = button('primary', g.t('send')), ff = button('', g.t('fastForward'));
  ff.hidden = true;
  $(root, '.g-controls').appendChild(send);
  $(root, '.g-controls').appendChild(ff);
  send.onclick = function () {
    var now = new Date(), km = LF.calc.distanceKm('voyager1', now);
    if (km == null) return;
    var secs = LF.calc.lightSeconds(km);
    var msg = input.value.trim() || g.t('placeholder');
    g.sfx('laser');
    $(root, '.probe').classList.remove('received');
    flight = { secs: secs, factor: 1, simElapsed: 0, last: performance.now() };
    ff.hidden = false; ff.disabled = false; ff.setAttribute('aria-pressed', 'false');
    g.say($(root, '.g-out'), 'sent', {
      msg: msg,
      arrive: LF.fmt.when(new Date(now.getTime() + secs * 1000)),
      reply: LF.fmt.when(new Date(now.getTime() + 2 * secs * 1000))
    });
    g.solved();
  };
  ff.onclick = function () {
    if (!flight) return;
    flight.factor = flight.factor === 1 ? g.cfg.fast_factor : 1;
    ff.setAttribute('aria-pressed', String(flight.factor !== 1));
    g.sfx('beep');
  };
};


/* ---------- journey: drag each event onto the next stop, the machine travels the path ---------- */
GAMES.timeline = function (root, g) {
  var ev = g.cfg.events, n = ev.length, next = 0, picked = null;
  var m = g.machine || {}, land = m.shelf === 'deep' ? 'deep' : (m.shelf || 'moon');
  root.innerHTML =
    '<p class="g-intro"></p><p class="note tap-hint"></p>' +
    '<div class="journey journey-' + land + '"><div class="j-track"></div><div class="j-stops"></div>' +
    '<span class="j-craft"><span class="j-inner">' + window.LF_ICON(m.icon || 'reflector') + '</span></span><span class="j-dust"></span></div>' +
    '<div class="j-logbox"><span class="j-logtitle"></span><ol class="j-log"></ol></div>' +
    '<div class="j-pool"></div><div class="g-out" aria-live="polite"></div>';
  g.say($(root, '.g-intro'), 'intro');
  $(root, '.j-logtitle').textContent = g.t('log');
  $(root, '.tap-hint').textContent = g.t('tapHint');
  var stops = $(root, '.j-stops'), pool = $(root, '.j-pool'), out = $(root, '.g-out');
  var craft = $(root, '.j-craft'), scene = $(root, '.journey');
  var x = function (i) { return 8 + (84 * i) / Math.max(n - 1, 1); };   /* stop positions in % */
  craft.style.left = '0%';

  var slotEls = ev.map(function (e, i) {
    var s = document.createElement('button');
    s.type = 'button';
    s.className = 'j-stop';
    s.style.left = x(i) + '%';
    s.setAttribute('data-stop', i);
    s.innerHTML = '<span class="j-dot"></span><span class="j-label"></span>';
    $(s, '.j-label').textContent = g.t('stop', { n: i + 1 });
    s.onclick = function () { if (picked) place(picked.card, picked.i, i); };
    stops.appendChild(s);
    return s;
  });
  function glow() { slotEls.forEach(function (s, i) { s.classList.toggle('next', i === next); }); }
  glow();

  function place(card, i, stop) {
    picked = null;
    card.classList.remove('picked');
    if (stop !== next || i !== next) {
      g.sfx('no');
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      out.textContent = g.t('notYet');
      return;
    }
    g.sfx('ok');
    out.textContent = '';
    var s = slotEls[stop];
    s.classList.add('filled');
    s.setAttribute('aria-label', LF.text(ev[i]));
    s.title = LF.text(ev[i]);
    var li = document.createElement('li');
    li.textContent = LF.text(ev[i]);
    $(root, '.j-log').appendChild(li);
    $(root, '.j-logbox').classList.add('has-items');
    card.remove();
    /* move with the Web Animations API: unlike a CSS transition it is not cancelled by later class changes */
    var to = 'calc(' + x(stop) + '% - var(--half))';   /* centre the drawing over the stop */
    if (craft.getAnimations) craft.getAnimations().forEach(function (a) { a.finish(); });  /* a fast player never leaves a move half done */
    var from = getComputedStyle(craft).left;
    craft.style.left = to;
    if (craft.animate && !g.reduced) craft.animate([{ left: from }, { left: to }], { duration: 900, easing: 'ease-in-out' });
    next += 1;
    glow();
    if (next === n) {
      /* arrive after the drawing has reached the last stop */
      var arrivedOnce = false;
      var arrive = function () {
        if (arrivedOnce) return;
        arrivedOnce = true;
        if (craft.getAnimations) craft.getAnimations().forEach(function (a) { a.finish(); });
        craft.style.left = 'calc(' + x(n - 1) + '% - var(--half))';   /* lock the machine on the last stop */
        scene.classList.add('arrived');
        g.sfx(land === 'deep' ? 'echo' : 'grind');
        g.say(out, 'done');
        g.solved();
      };
      setTimeout(arrive, g.reduced ? 10 : 1000);
    }
  }

  /* cards start in a shifted order, so none sits in its answer place */
  var order = ev.map(function (e, i) { return i; });
  order = order.slice(1).concat(order.slice(0, 1));
  order.forEach(function (i) {
    var card = button('j-card', LF.text(ev[i]));
    card.setAttribute('data-event', i);
    card.onclick = function () {
      if (card.dragged) { card.dragged = false; return; }
      pool.querySelectorAll('.j-card.picked').forEach(function (c) { if (c !== card) c.classList.remove('picked'); });
      card.classList.toggle('picked');
      picked = card.classList.contains('picked') ? { card: card, i: i } : null;
    };
    card.onpointerdown = function (e) {
      if (e.button > 0) return;
      var sx = e.clientX, sy = e.clientY, moving = false;
      try { card.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      card.onpointermove = function (ev2) {
        var dx = ev2.clientX - sx, dy = ev2.clientY - sy;
        if (!moving && Math.abs(dx) + Math.abs(dy) < 8) return;
        moving = true;
        card.classList.add('dragging');
        card.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      };
      card.onpointerup = function (ev2) {
        card.onpointermove = card.onpointerup = null;
        card.classList.remove('dragging');
        card.style.transform = '';
        if (!moving) return;
        card.dragged = true;
        var hit = -1;
        slotEls.forEach(function (s, k) {
          var r = s.getBoundingClientRect();
          if (ev2.clientX > r.left - 30 && ev2.clientX < r.right + 30 && ev2.clientY > r.top - 40 && ev2.clientY < r.bottom + 40) hit = k;
        });
        if (hit < 0) {   /* dropped anywhere on the path counts for the next stop */
          var sr = scene.getBoundingClientRect();
          if (ev2.clientX > sr.left && ev2.clientX < sr.right && ev2.clientY > sr.top && ev2.clientY < sr.bottom) hit = next;
        }
        if (hit >= 0) place(card, i, hit);
      };
    };
    pool.appendChild(card);
  });
};

  window.LF_GAMES = GAMES;
})();
