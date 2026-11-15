/* Line drawings of the six machines, drawn for this project. viewBox 0 0 120 100. */
(function () {
  'use strict';
  var INK = 'stroke="#2b2110" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  var ground = '<path d="M6 94 Q60 88 114 94" fill="none" stroke="#6b5233" stroke-width="2" stroke-dasharray="3 4"/>';

  var ICONS = {
    reflector:
      ground +
      '<g ' + INK + '>' +
      '<line x1="42" y1="66" x2="36" y2="92"/><line x1="80" y1="60" x2="88" y2="92"/>' +
      '<g transform="rotate(-14 60 48)">' +
      '<rect x="24" y="30" width="72" height="40" rx="3" fill="#c9d3dd"/>' +
      '<g fill="#e9eef3" stroke-width="1.6">' +
      [0, 1, 2, 3, 4, 5].map(function (c) {
        return [0, 1, 2].map(function (r) {
          return '<circle cx="' + (32 + c * 11.2) + '" cy="' + (38 + r * 12) + '" r="4.2"/>';
        }).join('');
      }).join('') +
      '</g></g></g>',

    descent:
      ground +
      '<g ' + INK + '>' +
      '<line x1="34" y1="66" x2="14" y2="90"/><line x1="86" y1="66" x2="106" y2="90"/>' +
      '<line x1="50" y1="70" x2="44" y2="92"/><line x1="70" y1="70" x2="76" y2="92"/>' +
      '<ellipse cx="14" cy="91" rx="7" ry="2.5" fill="#d4a237"/><ellipse cx="106" cy="91" rx="7" ry="2.5" fill="#d4a237"/>' +
      '<polygon points="30,38 90,38 100,52 90,70 30,70 20,52" fill="#d4a237"/>' +
      '<path d="M30 38 L40 52 L30 70 M90 38 L80 52 L90 70 M40 52 H80" fill="none" stroke-width="1.6"/>' +
      '<rect x="54" y="72" width="12" height="18" fill="none" stroke-width="1.8"/>' +
      '<path d="M54 78 H66 M54 84 H66" stroke-width="1.4"/>' +
      '</g>',

    surveyor:
      ground +
      '<g ' + INK + '>' +
      '<line x1="48" y1="64" x2="18" y2="90"/><line x1="72" y1="64" x2="102" y2="90"/><line x1="60" y1="68" x2="60" y2="92"/>' +
      '<circle cx="18" cy="90" r="4" fill="#e9eef3"/><circle cx="102" cy="90" r="4" fill="#e9eef3"/><circle cx="60" cy="93" r="4" fill="#e9eef3"/>' +
      '<polygon points="44,56 76,56 72,68 48,68" fill="#e9eef3"/>' +
      '<line x1="60" y1="56" x2="60" y2="14"/>' +
      '<rect x="40" y="8" width="40" height="11" fill="#5b7fa6" transform="rotate(-8 60 13)"/>' +
      '<path d="M60 30 l22 -8" fill="none"/><ellipse cx="86" cy="21" rx="6" ry="9" fill="#e9eef3" transform="rotate(-20 86 21)"/>' +
      '<rect x="36" y="48" width="10" height="8" rx="2" fill="#d4a237"/>' +
      '</g>',

    spirit:
      ground +
      '<g ' + INK + '>' +
      '<path d="M30 80 L42 64 L56 64 L66 80 M66 80 L78 64 L90 80" fill="none"/>' +
      '<rect x="30" y="50" width="62" height="16" rx="2" fill="#e9eef3"/>' +
      '<rect x="18" y="44" width="86" height="7" fill="#5b7fa6"/>' +
      '<line x1="82" y1="44" x2="82" y2="16"/><rect x="74" y="10" width="18" height="9" rx="2" fill="#e9eef3"/>' +
      '<circle cx="79" cy="14.5" r="2" fill="#2b2110"/><circle cx="87" cy="14.5" r="2" fill="#2b2110"/>' +
      '<circle cx="30" cy="82" r="9" fill="#8a8f96"/><circle cx="66" cy="82" r="9" fill="#8a8f96"/><circle cx="90" cy="82" r="9" fill="#8a8f96" class="wheel-front"/>' +
      '</g>',

    ingenuity:
      ground +
      '<g ' + INK + '>' +
      '<line x1="50" y1="70" x2="32" y2="90"/><line x1="70" y1="70" x2="88" y2="90"/>' +
      '<line x1="54" y1="70" x2="48" y2="92"/><line x1="66" y1="70" x2="72" y2="92"/>' +
      '<rect x="46" y="54" width="28" height="18" rx="4" fill="#e9eef3"/>' +
      '<line x1="60" y1="54" x2="60" y2="16"/>' +
      '<g class="rotor rotor-a"><ellipse cx="60" cy="34" rx="50" ry="3.2" fill="#d9c49a"/></g>' +
      '<g class="rotor rotor-b"><ellipse cx="60" cy="24" rx="50" ry="3.2" fill="#d9c49a"/></g>' +
      '<rect x="46" y="9" width="28" height="6" fill="#5b7fa6"/>' +
      '</g>',

    voyager:
      '<g ' + INK + '>' +
      '<line x1="62" y1="52" x2="114" y2="18" stroke-width="1.6"/>' +
      '<line x1="56" y1="60" x2="98" y2="86"/><rect x="92" y="80" width="16" height="9" rx="2" fill="#8a8f96" transform="rotate(30 100 84)"/>' +
      '<line x1="50" y1="60" x2="18" y2="88" stroke-width="1.8"/><circle cx="18" cy="88" r="3" fill="#e9eef3"/>' +
      '<polygon points="46,52 64,52 68,62 60,70 50,70 42,62" fill="#e9eef3"/>' +
      '<ellipse cx="52" cy="34" rx="34" ry="30" fill="#f2f0ea"/>' +
      '<ellipse cx="52" cy="34" rx="22" ry="19" fill="none" stroke-width="1.4"/>' +
      '<circle cx="52" cy="34" r="4" fill="#d4a237"/>' +
      '<circle cx="74" cy="60" r="5" fill="#d4a237"/>' +
      '</g>',

    ascent:
      '<g ' + INK + '>' +
      '<polygon points="34,30 60,14 86,30 92,62 28,62" fill="#c9d3dd"/>' +
      '<rect x="50" y="40" width="20" height="22" fill="#e9eef3"/>' +
      '<polygon points="40,34 52,26 52,38 40,40" fill="#1a2238"/>' +
      '<circle cx="58" cy="50" r="5" fill="#f2f0ea"/><circle cx="66" cy="50" r="5" fill="#f2f0ea"/>' +
      '<path d="M44 62 L40 74 L80 74 L76 62" fill="#8a8f96"/>' +
      '<path d="M60 74 L60 90" stroke="#e0573f" stroke-width="4" stroke-dasharray="3 3"/>' +
      '</g>',

    rocks:
      ground +
      '<g ' + INK + '>' +
      '<rect x="22" y="44" width="76" height="40" rx="5" fill="#aab4bf"/>' +
      '<line x1="22" y1="56" x2="98" y2="56"/><rect x="52" y="48" width="16" height="6" rx="2" fill="#2b2110"/>' +
      '<polygon points="30,44 38,30 50,34 54,44" fill="#7b7f86"/><polygon points="58,44 66,26 80,30 86,44" fill="#9a9ea5"/>' +
      '</g>',

    camera:
      ground +
      '<g ' + INK + '>' +
      '<rect x="30" y="34" width="44" height="44" rx="4" fill="#e9eef3"/>' +
      '<rect x="74" y="44" width="18" height="18" fill="#c9d3dd"/>' +
      '<polygon points="74,40 98,26 98,58" fill="#f2f0ea"/>' +
      '<circle cx="52" cy="56" r="10" fill="#1a2238"/><circle cx="52" cy="56" r="4" fill="#5b7fa6"/>' +
      '<path d="M40 78 Q36 90 20 90" fill="none" stroke="#d4a237"/>' +
      '</g>',

    lander:
      '<g ' + INK + '>' +
      '<g data-part="legs" class="part"><line x1="96" y1="128" x2="34" y2="186"/><line x1="144" y1="128" x2="206" y2="186"/><line x1="120" y1="136" x2="120" y2="194"/>' +
      '<circle cx="34" cy="186" r="8" fill="#e9eef3"/><circle cx="206" cy="186" r="8" fill="#e9eef3"/><circle cx="120" cy="196" r="8" fill="#e9eef3"/></g>' +
      '<g data-part="whole" class="part body"><polygon points="86,110 154,110 146,136 94,136" fill="#e9eef3"/><line x1="120" y1="110" x2="120" y2="30"/>' +
      '<rect x="80" y="18" width="80" height="20" fill="#5b7fa6" transform="rotate(-8 120 28)"/>' +
      '<path d="M120 58 l40 -14" fill="none"/><ellipse cx="168" cy="40" rx="11" ry="17" fill="#e9eef3" transform="rotate(-20 168 40)"/></g>' +
      '<g data-part="tubes" class="part"><line x1="100" y1="110" x2="78" y2="84" stroke="#b9c2cc" stroke-width="6"/><line x1="140" y1="110" x2="160" y2="86" stroke="#f2f0ea" stroke-width="6"/></g>' +
      '<g data-part="camera" class="part"><rect x="64" y="86" width="26" height="24" rx="3" fill="#e9eef3"/><polygon points="64,90 48,80 48,104" fill="#f2f0ea"/><circle cx="77" cy="98" r="5" fill="#1a2238"/></g>' +
      '<g data-part="cable" class="part"><path d="M90 104 Q104 122 98 140 Q94 156 112 160" fill="none" stroke="#d4a237" stroke-width="4"/></g>' +
      '<g data-part="scoop" class="part"><path d="M150 120 L182 142 L196 150" fill="none" stroke-width="3"/><path d="M190 146 l12 0 l-2 10 l-10 0 z" fill="#8a8f96"/></g>' +
      '</g>',

    reserved:
      '<g fill="none" stroke="#d4a237" stroke-width="2.6" stroke-dasharray="6 6" stroke-linecap="round">' +
      '<rect x="22" y="14" width="76" height="74" rx="10"/></g>' +
      '<g fill="#d4a237"><circle cx="60" cy="72" r="3.4"/></g>' +
      '<path d="M50 40 a10 10 0 1 1 14 9 c-3 1.6 -4 3.6 -4 7" fill="none" stroke="#d4a237" stroke-width="3.4" stroke-linecap="round"/>',


    lrv:
      ground +
      '<g ' + INK + '>' +
      '<line x1="34" y1="68" x2="86" y2="68"/><line x1="48" y1="68" x2="42" y2="50"/><line x1="72" y1="68" x2="78" y2="48"/>' +
      '<rect x="34" y="60" width="52" height="8" rx="2" fill="#e9eef3"/>' +
      '<path d="M52 44 l12 0 l-2 16 l-10 0 z" fill="#c9d3dd"/>' +
      '<ellipse cx="78" cy="40" rx="10" ry="6" fill="#d4a237" transform="rotate(-22 78 40)"/>' +
      '<circle cx="34" cy="80" r="11" fill="#8a8f96"/><circle cx="86" cy="80" r="11" fill="#8a8f96"/>' +
      '</g>',

    sojourner:
      ground +
      '<g ' + INK + '>' +
      '<rect x="30" y="54" width="60" height="14" rx="2" fill="#e9eef3"/>' +
      '<rect x="24" y="48" width="72" height="6" fill="#5b7fa6"/>' +
      '<circle cx="34" cy="82" r="8" fill="#8a8f96"/><circle cx="60" cy="82" r="8" fill="#8a8f96"/><circle cx="86" cy="82" r="8" fill="#8a8f96"/>' +
      '</g>',

    lander_mars:
      ground +
      '<g ' + INK + '>' +
      '<line x1="42" y1="64" x2="22" y2="90"/><line x1="78" y1="64" x2="98" y2="90"/><line x1="60" y1="66" x2="60" y2="92"/>' +
      '<polygon points="34,48 86,48 78,66 42,66" fill="#e9eef3"/>' +
      '<circle cx="48" cy="36" r="8" fill="#d4a237"/><line x1="74" y1="48" x2="74" y2="24"/>' +
      '<ellipse cx="74" cy="22" rx="12" ry="5" fill="#f2f0ea"/>' +
      '</g>',

    orbiter:
      '<g ' + INK + '>' +
      '<rect x="10" y="42" width="32" height="16" fill="#5b7fa6"/><rect x="78" y="42" width="32" height="16" fill="#5b7fa6"/>' +
      '<rect x="44" y="36" width="32" height="28" rx="4" fill="#d4a237"/>' +
      '<ellipse cx="60" cy="24" rx="16" ry="7" fill="#f2f0ea"/>' +
      '</g>',

    telescope:
      '<g ' + INK + '>' +
      '<rect x="14" y="44" width="24" height="14" fill="#5b7fa6"/><rect x="82" y="44" width="24" height="14" fill="#5b7fa6"/>' +
      '<rect x="42" y="22" width="36" height="58" rx="5" fill="#e9eef3"/>' +
      '<ellipse cx="60" cy="22" rx="18" ry="6" fill="#1a2238"/>' +
      '</g>',

    archie:
      '<g ' + INK + '>' +
      '<line x1="60" y1="16" x2="60" y2="6"/><circle cx="60" cy="5" r="4" fill="#e0573f"/>' +
      '<rect x="22" y="16" width="76" height="60" rx="16" fill="#d4a237"/>' +
      '<rect x="32" y="28" width="56" height="34" rx="10" fill="#1a2238"/>' +
      '<circle cx="48" cy="44" r="6" fill="#7fe0d0" stroke="none" class="eye"/><circle cx="72" cy="44" r="6" fill="#7fe0d0" stroke="none" class="eye"/>' +
      '<path d="M50 54 Q60 60 70 54" fill="none" stroke="#7fe0d0" stroke-width="2.4"/>' +
      '<rect x="14" y="36" width="8" height="20" rx="3" fill="#9a7018"/><rect x="98" y="36" width="8" height="20" rx="3" fill="#9a7018"/>' +
      '<rect x="40" y="76" width="40" height="14" rx="4" fill="#9a7018"/>' +
      '</g>'
  };

  /* Every drawing carries a visible watermark, as the Space Apps rules ask for SI-assisted images. */
  function mark(vb) {
    var p = vb.split(/\s+/).map(Number), w = p[2], h = p[3];
    var txt = (window.LF && LF.ui) ? LF.ui('siMark') : '';
    txt = String(txt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<text class="si-mark" x="' + (p[0] + w - 1.5) + '" y="' + (p[1] + h - 1.5) + '" text-anchor="end" font-size="' + Math.min(w * 0.055, 7).toFixed(1) + '">' + txt + '</text>';
  }
  window.LF_ICON = function (name, cls, viewBox) {
    var vb = viewBox || '0 0 120 100';
    return '<svg class="icon ' + (cls || '') + '" viewBox="' + vb + '" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + mark(vb) + '</svg>';
  };
  window.LF_ICON_EXISTS = function (name) { return Object.prototype.hasOwnProperty.call(ICONS, name); };
})();
