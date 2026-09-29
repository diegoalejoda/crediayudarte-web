/* ===================================================================
   CrediAyudarte — Experiencia cinematográfica de la Home
   Un escenario sticky (100svh) que recorre con el scroll un solo video
   (assets/cine/v/d|m/hero.webm|mp4). Cada capítulo está anclado a un tramo del
   video y decide cuándo entra y sale su copy. Mientras el video carga
   (o con ahorro de datos / movimiento reducido) se ven fotogramas fijos.
   Sin librerías.
   =================================================================== */
(function () {
  'use strict';

  var sec = document.getElementById('experiencia');
  if (!sec || !sec.querySelector('.cine__stage')) return;

  var root = document.documentElement;
  var stage = sec.querySelector('.cine__stage');
  var media = sec.querySelector('.cine__media');
  var track = sec.querySelector('.cine__track');
  var imgs = Array.prototype.slice.call(sec.querySelectorAll('.cine__img'));
  var caps = Array.prototype.slice.call(sec.querySelectorAll('.cap'));
  var hud = sec.querySelector('.cine__hud');
  var N = caps.length;

  /* Ritmo de cada capítulo.
     len   = largo en svh (en retrato se multiplica por K_BAND)
     h/b/c = progreso en que entran titular, texto y CTA
     out   = progreso en que sale el copy
     tv    = tramo del video: pares [progreso, segundo]; entre pares, lineal.
             Los tramos lentos coinciden con la lectura del copy.
     seq   = ventana en que aparecen, de a uno, los hijos de .seq
             (capas, revisión, variables, perfiles, claridad, fotos)
     (en retrato el video va entero en un cuadro 16:9 arriba del texto) */
  var CFG = [
    { len: 150, h: 0,   b: 0,   c: 0,   out: .42, tv: [[0, 0], [.38, .2], [1, 2.25]] },
    { len: 175, h: .1,  b: .2,          out: .76, tv: [[0, 2.25], [.18, 2.83], [.74, 3.67], [1, 5.1]], seq: [.28, .5] },
    { len: 165, h: .12, b: .22,         out: .78, tv: [[0, 5.1], [.22, 5.65], [.78, 5.92], [1, 6.3]], seq: [.32, .58] },
    { len: 175, h: .1,  b: .2,          out: .78, tv: [[0, 6.3], [.2, 7], [.78, 8.05], [1, 9.03]], seq: [.26, .5] },
    { len: 175, h: .12, b: .22, c: .32, out: .78, tv: [[0, 9.03], [.22, 10.4], [.78, 12.1], [1, 13.25]] },
    { len: 180, h: .12, b: .22,         out: .8,  tv: [[0, 13.25], [.24, 14.2], [.8, 14.8], [1, 15.7]], seq: [.26, .5] },
    { len: 170, h: .1,  b: .16,         out: .82, tv: [[0, 15.7], [.16, 16.23], [.82, 16.9], [1, 17.48]], seq: [.24, .52] },
    { len: 200, h: .1,  b: .2,          out: .84, tv: [[0, 17.48], [.2, 18.15], [.84, 19.18], [1, 19.82]], seq: [.3, .52] },
    { len: 140, h: .2,  b: .32, c: .42, out: 9,   tv: [[0, 19.82], [.55, 21.27], [1, 21.45]] }
  ];
  var TAIL = 45;          // svh finales: el universo se despide mientras entra la página
  var K_BAND = 0.85;      // en retrato los capítulos son algo más cortos
  var VW = 1920, VH = 1082; // proporción del video (para ubicar los rótulos de los pedestales)
  var MV = '?v=20260929';     // versión de los medios (caché de 7 días en nginx): subirla al cambiar el video

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqBand = window.matchMedia('(max-aspect-ratio: 1/1)');
  var conn = navigator.connection || {};
  var lite = mqReduce.matches || conn.saveData === true ||
    /(^|-)2g$/.test(conn.effectiveType || '') ||
    (navigator.deviceMemory && navigator.deviceMemory <= 2);
  var appleVideo = /Apple/.test(navigator.vendor || '');

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function setCls(el, c, on) { if (el.classList.contains(c) !== on) el.classList.toggle(c, on); }

  // Segundo del video para el capítulo i con progreso p
  function timeAt(i, p) {
    var k = CFG[i].tv;
    for (var j = 1; j < k.length; j++) {
      if (p <= k[j][0]) {
        var a = k[j - 1], b = k[j];
        return a[1] + (b[1] - a[1]) * ((p - a[0]) / (b[0] - a[0]));
      }
    }
    return k[k.length - 1][1];
  }

  /* ---------- Medidas ---------- */
  var starts = [], lens = [], endCaps = 0, tailPx = 1, band = mqBand.matches;
  var perfiles = Array.prototype.slice.call(sec.querySelectorAll('.perfiles li'));

  function layout() {
    band = mqBand.matches;
    var unit = stage.offsetHeight / 100;
    var k = band ? K_BAND : 1;
    var acc = 0;
    for (var i = 0; i < N; i++) {
      starts[i] = acc;
      lens[i] = CFG[i].len * k * unit;
      acc += lens[i];
    }
    endCaps = acc;
    tailPx = TAIL * unit;
    track.style.height = Math.round(endCaps + tailPx) + 'px';
    // La sección siguiente sube sobre la cola: el final se funde con la página
    sec.style.marginBottom = -Math.round(tailPx) + 'px';
    sec.cineInfo = { starts: starts.slice(), lens: lens.slice(), end: endCaps, tail: tailPx };
    placeLabels();
  }

  // Rótulos bajo cada pedestal: el video va en "cover", así que se recalcula su recorte
  function placeLabels() {
    if (!perfiles.length) return;
    var W = stage.offsetWidth, H = stage.offsetHeight;
    var s = Math.max(W / VW, H / VH), dw = VW * s, dh = VH * s;
    perfiles.forEach(function (li) {
      if (band) { li.style.removeProperty('--lx'); li.style.removeProperty('--ly'); return; }
      var vx = parseFloat(li.style.getPropertyValue('--vx')) || 0.5;
      var x = (vx - 0.5) * dw + W / 2;
      var y = (0.69 - 0.5) * dh + H / 2;
      // que ningún rótulo se salga por los lados
      x = Math.max(li.offsetWidth / 2 + 16, Math.min(W - li.offsetWidth / 2 - 16, x));
      li.style.setProperty('--lx', Math.round(x) + 'px');
      li.style.setProperty('--ly', Math.round(Math.min(y, H - 70)) + 'px');
    });
  }

  /* ---------- Fotogramas fijos: carga bajo demanda ---------- */
  function loadImg(j) {
    var im = imgs[j];
    if (!im || im.getAttribute('src')) return;
    var n = im.getAttribute('data-n');
    im.setAttribute('sizes', '100vw');
    im.setAttribute('srcset', 'assets/cine/v/m/k' + n + '.webp' + MV + ' 1280w, assets/cine/v/d/k' + n + '.webp' + MV + ' 1920w');
    im.setAttribute('src', 'assets/cine/v/d/k' + n + '.webp' + MV);
  }

  var imgState = [];
  function setImg(j, o, s) {
    var st = imgState[j] || (imgState[j] = { o: -1, s: -1 });
    if (Math.abs(st.o - o) > 0.002) { imgs[j].style.opacity = o.toFixed(3); st.o = o; }
    if (Math.abs(st.s - s) > 0.0004) { imgs[j].style.transform = s === 1 ? '' : 'scale(' + s.toFixed(4) + ')'; st.s = s; }
  }

  /* ---------- Video: se adjunta con el primer scroll (no compite con el LCP) ---------- */
  var vid = null, armed = false, vidDir = '';

  function attach() {
    if (lite || !armed || vid) return;
    var v = document.createElement('video');
    v.className = 'cine__vid';
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
    v.disablePictureInPicture = true;
    v.preload = 'auto';
    vidDir = band || window.innerWidth < 900 ? 'm' : 'd';
    var webm = !appleVideo && v.canPlayType('video/webm; codecs="vp9"');
    v.src = 'assets/cine/v/' + vidDir + '/hero' + (webm ? '.webm' : '.mp4') + MV;
    v._ready = false; v._goal = 0; v._shown = 0;
    v.addEventListener('loadeddata', function () {
      if (!isFinite(v.duration) || v.duration <= 0) return;
      v._ready = true;
      v._shown = v._goal;
      // iOS solo pinta fotogramas al buscar si el video se "activó" una vez
      var pr = v.play();
      if (pr && pr.then) pr.then(function () { v.pause(); }, function () {});
      else v.pause();
      requestFrame();
    });
    v.addEventListener('error', function () { lite = true; release(); requestFrame(); });
    media.appendChild(v);
    vid = v;
    // iOS Safari ignora preload="auto": no baja datos (y nunca dispara
    // "loadeddata") hasta que alguien llama play(). Sin esto el iPhone se
    // quedaba para siempre en los fotogramas fijos. Silenciado + playsinline
    // se permite sin gesto; se pausa en cuanto arranca (sigue oculto hasta
    // estar listo, así que no se ve reproducirse).
    var kick = v.play();
    if (kick && kick.then) kick.then(function () { v.pause(); }, function () {});
    v.addEventListener('playing', function once() { v.removeEventListener('playing', once); v.pause(); });
  }

  function release() {
    if (!vid) return;
    var v = vid;
    vid = null;
    try { v.pause(); } catch (e) { /* nada */ }
    v.removeAttribute('src');
    try { v.load(); } catch (e) { /* nada */ }
    if (v.parentNode) v.parentNode.removeChild(v);
  }

  // El fotograma mostrado persigue al objetivo con suavizado: el scroll nunca "salta"
  var seekRunning = false;
  function seekLoop() {
    var v = vid, busy = false;
    if (v && v._ready) {
      var goal = Math.min(v._goal, v.duration - 0.04);
      var diff = goal - v._shown;
      if (Math.abs(diff) > 0.003) {
        v._shown += diff * 0.3;
        if (Math.abs(goal - v._shown) < 0.006) v._shown = goal;
        busy = true;
      }
      if (!v.seeking && Math.abs(v.currentTime - v._shown) > 0.015) {
        v.currentTime = v._shown;
        busy = true;
      }
    }
    if (busy) requestAnimationFrame(seekLoop); else seekRunning = false;
  }
  function kickSeek() { if (!seekRunning) { seekRunning = true; requestAnimationFrame(seekLoop); } }

  /* ---------- Copy ---------- */
  // Titulares palabra por palabra: <span class="w"><span class="wi">palabra</span></span>
  function splitWords(el) {
    var k = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 1) { if (ch.tagName !== 'BR') walk(ch); return; }
        if (ch.nodeType !== 3 || !ch.nodeValue.trim()) return;
        var frag = document.createDocumentFragment();
        ch.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span'), wi = document.createElement('span');
          w.className = 'w'; wi.className = 'wi';
          wi.style.setProperty('--i', k++);
          wi.textContent = part;
          w.appendChild(wi);
          frag.appendChild(w);
        });
        ch.parentNode.replaceChild(frag, ch);
      });
    })(el);
  }
  var heroSplit = 0;
  Array.prototype.forEach.call(sec.querySelectorAll('.split'), function (el) {
    splitWords(el);
    // la segunda mitad del titular del hero sigue la cuenta de la primera
    if (el.classList.contains('hero__b')) el.querySelectorAll('.wi').forEach(function (wi, n) { wi.style.setProperty('--i', heroSplit + n + 1); });
    if (el.classList.contains('hero__a')) heroSplit = el.querySelectorAll('.wi').length;
  });

  caps.forEach(function (el) {
    el._seq = Array.prototype.slice.call(el.querySelectorAll('.seq > *'));
    el._count = Array.prototype.slice.call(el.querySelectorAll('[data-count]'));
    el._name = el.getAttribute('data-name') || '';
    el._cp = '';
  });

  // Contador que corre de 0 a su valor cuando el capítulo muestra su texto
  function countUp(node) {
    var to = +node.getAttribute('data-count'), t0 = null;
    if (lite) { node.textContent = to; return; }
    node.textContent = '0';
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = clamp((ts - t0) / 1100);
      node.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function copy(i, p) {
    for (var j = 0; j < N; j++) {
      var c = CFG[j], el = caps[j], act = j === i;
      setCls(el, 'is-act', act);
      setCls(el, 'is-h', act && p >= c.h);
      setCls(el, 'is-b', act && c.b != null && p >= c.b);
      setCls(el, 'is-c', act && c.c != null && p >= c.c);
      setCls(el, 'is-out', act ? p >= c.out : j < i);
      if (el._seq.length) {
        var n = 0;
        if (act && c.seq) n = Math.ceil(clamp((p - c.seq[0]) / (c.seq[1] - c.seq[0])) * el._seq.length);
        for (var q = 0; q < el._seq.length; q++) setCls(el._seq[q], 'is-on', q < n);
      }
      if (el._count.length) {
        var on = act && c.b != null && p >= c.b;
        if (on && !el._counted) { el._counted = true; el._count.forEach(countUp); }
        else if (!act) el._counted = false;
      }
      // progreso del capítulo para la deriva de las piezas (fotos del 08)
      if (act) {
        var cp = p.toFixed(3);
        if (cp !== el._cp) { el.style.setProperty('--cp', cp); el._cp = cp; }
      }
    }
  }

  /* ---------- Índice lateral ---------- */
  var hudN = hud && hud.querySelector('.hud__n');
  var hudT = hud && hud.querySelector('.hud__t');
  var hudName = hud && hud.querySelector('.hud__name');
  var hudBar = hud && hud.querySelector('.hud__bar');
  var lastHud = -1, lastHp = '';
  if (hudT) hudT.textContent = pad(N);

  function hudUpdate(i, d) {
    if (!hud) return;
    if (i !== lastHud) {
      lastHud = i;
      hudN.textContent = pad(i + 1);
      hudName.textContent = caps[i]._name;
    }
    var hp = clamp(d / endCaps).toFixed(3);
    if (hp !== lastHp) { hudBar.style.setProperty('--hp', hp); lastHp = hp; }
  }

  /* ---------- Visual ---------- */
  var lastCam = null;

  function visual(i, p, tail) {
    var c = CFG[i];
    var v = vid;
    var useVid = !!(v && v._ready);

    if (useVid) {
      v._goal = timeAt(i, p);
      kickSeek();
    }
    setCls(media, 'has-vid', useVid);
    if (v) setCls(v, 'is-on', useVid);

    // Fotogramas fijos: el del capítulo, y fundido al siguiente en el último tramo
    var t = i < N - 1 ? clamp((p - 0.82) / 0.18) : 0;
    var e = ease(t);
    for (var j = 0; j < N; j++) {
      var o = 0, s = 1;
      if (!useVid) {
        if (j === i) { o = 1; s = lite ? 1 : 1 + 0.025 * p; }
        else if (j === i + 1 && t > 0) { o = e; s = lite ? 1 : 1.02 - 0.02 * e; }
      } else if (j === i) {
        o = 1; // queda debajo del video como red de seguridad
      }
      setImg(j, o, s);
    }

    // Cola: el universo sube y se desvanece mientras entra la página.
    // (En retrato el video va entero en un cuadro 16:9 arriba: ya no se
    // reencuadra ni se escala por capítulo.)
    var te = ease(tail);
    var key = te.toFixed(3);
    if (key !== lastCam) {
      lastCam = key;
      var y = -6 * te;
      media.style.transform = y ? 'translate3d(0,' + y.toFixed(2) + '%,0)' : '';
      media.style.opacity = te > 0 ? (1 - 0.88 * te).toFixed(3) : '';
    }
  }

  /* ---------- Carga anticipada de fotogramas ---------- */
  function preload(i) {
    attach();
    for (var j = Math.max(0, i - 1); j <= Math.min(N - 1, i + 2); j++) loadImg(j);
  }

  /* ---------- Medición (Meta Pixel, sin datos personales) ---------- */
  var fired = {};
  function sendEvent(name) {
    if (fired[name]) return;
    fired[name] = true;
    if (typeof window.fbq === 'function') window.fbq('trackCustom', name);
  }
  function measure(d) {
    var pct = d / endCaps;
    if (pct >= 0.25) sendEvent('home_scroll_25');
    if (pct >= 0.5) sendEvent('home_scroll_50');
    if (pct >= 0.75) sendEvent('home_scroll_75');
    if (d >= starts[N - 1] + lens[N - 1] * 0.3) sendEvent('home_scroll_complete');
  }

  /* ---------- Bucle ---------- */
  var cur = -1, ticking = false;

  function frame() {
    ticking = false;
    var d = -sec.getBoundingClientRect().top;
    var i = 0, p = 0, tail = 0;
    if (d <= 0) { i = 0; p = 0; }
    else if (d >= endCaps) { i = N - 1; p = 1; tail = clamp((d - endCaps) / tailPx); }
    else {
      while (i < N - 1 && d >= starts[i + 1]) i++;
      p = (d - starts[i]) / lens[i];
    }
    cur = i;
    setCls(sec, 'is-moved', d > lens[0] * 0.4);
    setCls(sec, 'is-end', tail > 0.15);
    preload(i);
    copy(i, p);
    // el cierre se despide junto con el universo, antes de que suba la página
    if (tail > 0.3) setCls(caps[N - 1], 'is-out', true);
    visual(i, p, tail);
    hudUpdate(i, d);
    measure(d);
  }

  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  // Teclado: si el foco cae en un capítulo que no está en pantalla, llevamos el scroll hasta él
  caps.forEach(function (el, j) {
    el.addEventListener('focusin', function () {
      if (cur === j) return;
      var top = sec.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo(0, Math.round(top + starts[j] + lens[j] * (j === N - 1 ? 0.6 : 0.4)));
    });
  });

  /* ---------- Arranque ---------- */
  root.classList.add('js', 'cine-on');
  layout();
  frame();

  window.addEventListener('scroll', function () {
    if (!armed && window.pageYOffset > 0) armed = true;
    requestFrame();
  }, { passive: true });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      layout();
      // cambia la resolución del video si cambió de banda a escritorio o viceversa
      if (vid && vidDir !== (band || window.innerWidth < 900 ? 'm' : 'd')) release();
      requestFrame();
    }, 120);
  });

  // Con la página ya cargada, el resto de fotogramas baja en segundo plano, de a uno
  window.addEventListener('load', function () {
    placeLabels();
    var j = 1;
    (function next() {
      while (j < N && imgs[j].getAttribute('src')) j++;
      if (j >= N) return;
      loadImg(j);
      imgs[j].addEventListener('load', function () { setTimeout(next, 120); }, { once: true });
      imgs[j].addEventListener('error', function () { setTimeout(next, 120); }, { once: true });
    })();
  });
})();
