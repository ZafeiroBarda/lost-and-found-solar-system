/* Lost & Found core: language, texts, sources and calculations.
 * Needs window.LF_CONTENT from content.js (made by tools/build.py).
 *
 *   LF.ui('back')                 interface text in the current language
 *   LF.text(obj, {n: 3})          any bilingual text object from content.json
 *   LF.sources(obj)               source records listed in obj.src
 *   LF.setLanguage('el')          switch language, fires the 'lf:language' event
 *   LF.calc.distanceKm('moon')    distance now from the Horizons table, null outside the table
 *   LF.fmt.km(), LF.fmt.duration(), LF.fmt.when()
 */
(function () {
  'use strict';
  var C = window.LF_CONTENT;
  if (!C) { throw new Error('content.js is missing. Run tools/build.py first.'); }

  var LOCALE = { en: 'en-GB' };
  var lang = 'en';
  try {
    var saved = localStorage.getItem('lf.lang');
    lang = saved === 'el' || saved === 'en' ? saved : (C.meta.default_language || 'en');
  } catch (e) { lang = C.meta.default_language || 'en'; }

  function fill(s, vars) {
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return vars && Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
    });
  }

  function text(obj, vars) {
    if (!obj) return '';
    if (typeof obj === 'string') return fill(obj, vars);
    return fill(obj.text || obj.en || '', vars);
  }

  function ui(key, vars) {
    var t = C.ui[key];
    if (!t) { console.warn('LF: missing ui text', key); return key; }
    return text(t, vars);
  }

  function sources(obj) {
    return ((obj && obj.src) || []).map(function (id) {
      var s = C.sources[id];
      return s ? Object.assign({ id: id }, s) : { id: id, title: id, publisher: '?', url: '' };
    });
  }

  /* ---------- calculations ---------- */
  var C_KM_S = C.constants.speed_of_light_km_s.value;

  function table(name) {
    var t = C.calc && C.calc[name];
    if (!t || !t.points || t.points.length < 2) return null;
    if (!t._parsed) {
      t._parsed = t.points.map(function (p) { return [Date.parse(p.at_utc), p.distance_km]; });
    }
    return t._parsed;
  }

  function distanceKm(name, date) {
    var pts = table(name);
    if (!pts) return null;
    var t = (date || new Date()).getTime();
    if (t < pts[0][0] || t > pts[pts.length - 1][0]) return null;  // no guessing outside the table
    var i = 1;
    while (i < pts.length - 1 && pts[i][0] < t) i++;
    var a = pts[i - 1], b = pts[i];
    return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
  }

  function tableEnd(name) {
    var pts = table(name);
    return pts ? new Date(pts[pts.length - 1][0]) : null;
  }

  var calc = {
    speedOfLightKmS: C_KM_S,
    distanceKm: distanceKm,
    tableEnd: tableEnd,
    lightSeconds: function (km) { return km == null ? null : km / C_KM_S; },
    echoSeconds: function (km) { return km == null ? null : 2 * km / C_KM_S; }
  };

  /* ---------- formatting ---------- */
  var fmt = {
    number: function (n, digits) {
      return Number(n).toLocaleString(LOCALE[lang], { maximumFractionDigits: digits || 0, minimumFractionDigits: digits || 0 });
    },
    km: function (km) {
      return km == null ? ui('pendingSource') : fmt.number(Math.round(km)) + ' km';
    },
    duration: function (seconds) {
      if (seconds == null) return ui('pendingSource');
      if (seconds < 60) return ui('secondsUnit', { n: fmt.number(seconds, 2) });
      var mins = Math.floor(seconds / 60);   /* cut, never round up: 23 h 59.6 min must not read as 1 day */
      var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
      if (d === 1) return ui('oneDayHoursMinutes', { h: h, m: m });
      return d > 0 ? ui('daysHoursMinutes', { d: d, h: h, m: m }) : ui('hoursMinutes', { h: h, m: m });
    },
    when: function (date) {
      return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'long', timeStyle: 'short' }).format(date);
    },
    day: function (date) {
      return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'long' }).format(date);
    }
  };

  window.LF = {
    content: C,
    get lang() { return lang; },
    ui: ui,
    text: text,
    fill: fill,
    sources: sources,
    calc: calc,
    fmt: fmt,
    setLanguage: function (l) {
      lang = l === 'el' ? 'el' : 'en';
      try { localStorage.setItem('lf.lang', lang); } catch (e) { /* private mode */ }
      document.documentElement.lang = lang;
      document.dispatchEvent(new CustomEvent('lf:language', { detail: { lang: lang } }));
    }
  };
  document.documentElement.lang = lang;
})();
