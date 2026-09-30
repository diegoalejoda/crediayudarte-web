/* ===================================================================
   CrediAyudarte — Experiencia cinematográfica de la Home
   Un escenario sticky (100svh) que recorre con el scroll un solo video
   (assets/cine/v/d|m/hero.webm|mp4). Cada capítulo está anclado a un tramo del
   video y decide cuándo entra y sale su copy. Cada gesto (un clic de la
   rueda, un deslizamiento, una tecla) reproduce el video hasta la estación
   siguiente y se detiene ahí (ver "Paso a paso"). Mientras el video carga
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
             (capas, variables + revisión, perfiles, claridad + fotos)
     rest  = progreso en que se detiene la estación (todo su copy ya entró)
     hold  = hasta dónde avanza despacio el recorrido automático al leerla
     El túnel (5,1–6,3 s) abre el 03, las nubes (9,03–13,25 s) el 04 y el
     escudo (15,7–17,48 s) el 05: son transiciones sin texto que se atraviesan
     sin detenerse.
     (en retrato el video va entero en un cuadro 16:9 arriba del texto) */
  var CFG = [
    { len: 150, h: 0,   b: 0,   c: 0,   out: .42, rest: 0,   hold: 0,   tv: [[0, 0], [.38, .2], [1, 2.25]] },
    { len: 175, h: .1,  b: .2,          out: .76, rest: .56, hold: .68, tv: [[0, 2.25], [.18, 2.83], [.74, 3.67], [1, 5.1]], seq: [.28, .5] },
    { len: 300, h: .36, b: .42, c: .5,  out: .86, rest: .64, hold: .76, tv: [[0, 5.1], [.26, 6.3], [.4, 7], [.84, 8.05], [1, 9.03]], seq: [.44, .6] },
    { len: 320, h: .44, b: .5,  c: .6,  out: .88, rest: .66, hold: .78, tv: [[0, 9.03], [.34, 13.25], [.46, 14.2], [.86, 14.8], [1, 15.7]], seq: [.5, .6] },
    { len: 280, h: .34, b: .4,  c: .46, out: .88, rest: .68, hold: .78, tv: [[0, 15.7], [.24, 17.48], [.4, 18.15], [.86, 19.18], [1, 19.82]], seq: [.46, .62] },
    { len: 140, h: .2,  b: .32, c: .42, out: 9,   rest: .5,  hold: .62, tv: [[0, 19.82], [.55, 21.27], [1, 21.45]] }
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
    // rest/hold en px desde el inicio de la sección (los usan el índice y el recorrido automático)
    var rest = [], hold = [];
    for (var r = 0; r < N; r++) {
      rest[r] = starts[r] + lens[r] * CFG[r].rest;
      hold[r] = starts[r] + lens[r] * CFG[r].hold;
    }
    sec.cineInfo = { starts: starts.slice(), lens: lens.slice(), rest: rest, hold: hold, end: endCaps, tail: tailPx };
    placeLabels();
  }

  // Rótulos bajo cada pedestal: el video va en "cover", así que se recalcula su recorte.
  // El panorama va justo debajo de los rótulos (sin salirse por abajo).
  var panorama = sec.querySelector('.panorama');
  function placeLabels() {
    if (!perfiles.length) return;
    var W = stage.offsetWidth, H = stage.offsetHeight;
    var s = Math.max(W / VW, H / VH), dw = VW * s, dh = VH * s;
    if (band) {
      perfiles.forEach(function (li) { li.style.removeProperty('--lx'); li.style.removeProperty('--ly'); });
      return;
    }
    var ly = Math.min((0.69 - 0.5) * dh + H / 2, H - 70), liH = 0;
    perfiles.forEach(function (li) {
      var vx = parseFloat(li.style.getPropertyValue('--vx')) || 0.5;
      var x = (vx - 0.5) * dw + W / 2;
      // que ningún rótulo se salga por los lados
      x = Math.max(li.offsetWidth / 2 + 16, Math.min(W - li.offsetWidth / 2 - 16, x));
      li.style.setProperty('--lx', Math.round(x) + 'px');
      liH = Math.max(liH, li.offsetHeight);
    });
    if (panorama) {
      var top = ly + liH + 14, room = H - 16 - panorama.offsetHeight;
      // pantalla ancha y baja: si el panorama no cabe, los rótulos suben un poco
      if (top > room) { var up = Math.min(top - room, 80); ly -= up; top -= up; }
      sec.style.setProperty('--pan-top', Math.round(Math.min(top, room)) + 'px');
    }
    perfiles.forEach(function (li) { li.style.setProperty('--ly', Math.round(ly) + 'px'); });
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

  /* ---------- Paso a paso ----------
     Un gesto = una estación. Un clic de la rueda, un deslizamiento en pantalla
     táctil o una tecla de avance no mueven el video fotograma a fotograma: lo
     reproducen solo (animando el scroll) hasta la estación siguiente o la
     anterior, y ahí se detiene. Mientras corre la transición se ignoran los
     gestos, y la inercia del touchpad no cuenta como gesto nuevo: así nunca se
     salta una estación. Solo aplica al video: desde la última estación el
     siguiente gesto lleva a "Para quién" y de ahí en adelante el scroll es normal. */
  var STEP_GAP = 180;   // ms sin eventos de rueda para considerar que empieza un gesto nuevo
  var anim = null, wheelLock = false, lastWheel = 0, wheelAcc = 0, pressed = false, lastY = window.pageYOffset, lastDir = 1;

  function navH() { var n = document.querySelector('.cnav'); return n ? n.offsetHeight : 0; }
  function menuOpen() { var m = document.getElementById('nav'); return !!(m && m.classList.contains('is-open')); }

  // Posiciones de scroll (px de página) de cada estación y, al final, la salida
  function stations() {
    var top = sec.getBoundingClientRect().top + window.pageYOffset, list = [];
    for (var i = 0; i < N; i++) list.push(Math.round(top + starts[i] + lens[i] * CFG[i].rest));
    var nx = sec.nextElementSibling;
    var exit = nx ? nx.getBoundingClientRect().top + window.pageYOffset - navH() : top + endCaps + tailPx;
    var maxY = document.documentElement.scrollHeight - window.innerHeight;
    list.push(Math.round(Math.max(list[N - 1] + 1, Math.min(exit, maxY))));
    return list;
  }

  // Estación a la que lleva un gesto en la dirección dir desde y; null = scroll normal
  function stepTarget(dir, y) {
    var st = stations(), last = st.length - 1, k;
    if (dir > 0) {
      if (y >= st[last] - 2) return null;
      for (k = 0; k <= last; k++) if (st[k] > y + 2) return st[k];
      return null;
    }
    if (y > st[last] + 2 || y <= st[0] + 2) return null;
    for (k = last - 1; k >= 0; k--) if (st[k] < y - 2) return st[k];
    return null;
  }

  // Segundo del video en una posición de scroll (para medir cuánto video recorre un paso)
  function timeAtY(y) {
    var d = y - (sec.getBoundingClientRect().top + window.pageYOffset);
    if (d <= 0) return 0;
    if (d >= endCaps) return timeAt(N - 1, 1);
    var i = 0;
    while (i < N - 1 && d >= starts[i + 1]) i++;
    return timeAt(i, (d - starts[i]) / lens[i]);
  }

  function easeIO(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }

  function stopAnim() {
    if (!anim) return;
    cancelAnimationFrame(anim.raf);
    anim = null;
  }

  function goTo(to) {
    if (to == null) return;
    var from = window.pageYOffset;
    if (Math.abs(to - from) < 1) return;
    stopAnim();
    // ~0,3 s por segundo de video (el túnel y las nubes pasan rápido), entre 0,9 y 2,6 s
    var dt = Math.abs(timeAtY(to) - timeAtY(from));
    var dur = mqReduce.matches ? 1 : Math.max(900, Math.min(2600, 700 + dt * 300));
    var a = { t0: performance.now(), raf: 0 };
    anim = a;
    armed = true;
    (function step(now) {
      if (anim !== a) return;
      var k = clamp((now - a.t0) / dur);
      window.scrollTo(0, Math.round(from + (to - from) * easeIO(k)));
      if (k < 1) { a.raf = requestAnimationFrame(step); return; }
      anim = null;
      wheelLock = true; // la inercia que siga llegando no vale como gesto nuevo
    })(a.t0);
  }

  // Rueda del mouse y touchpad
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (!dy || Math.abs(dy) < Math.abs(e.deltaX) || menuOpen()) return;
    if (e.timeStamp - lastWheel > STEP_GAP) { wheelLock = false; wheelAcc = 0; }
    lastWheel = e.timeStamp;
    if (anim) { e.preventDefault(); return; }
    var to = stepTarget(dy > 0 ? 1 : -1, window.pageYOffset);
    if (to == null) return;
    e.preventDefault();
    if (wheelLock) return;
    wheelAcc += Math.abs(dy);
    if (wheelAcc < 8) return; // roce mínimo del touchpad: todavía no es un gesto
    wheelAcc = 0;
    goTo(to);
  }, { passive: false });

  // Teclas de avance (flechas, AvPág/RePág, espacio)
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key, dir = 0;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) dir = 1;
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) dir = -1;
    if (!dir || menuOpen()) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (k === ' ' && /^(A|BUTTON|SUMMARY)$/.test(t.tagName)))) return;
    if (anim) { e.preventDefault(); return; }
    var to = stepTarget(dir, window.pageYOffset);
    if (to == null) return;
    e.preventDefault();
    goTo(to);
  });

  // Pantalla táctil: un deslizamiento vertical = una estación
  var touch = null;
  window.addEventListener('touchstart', function (e) {
    touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, cap: anim ? true : null, used: false } : null;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (!touch) return;
    if (e.touches.length !== 1) { touch = null; return; }
    var dx = touch.x - e.touches[0].clientX, dy = touch.y - e.touches[0].clientY;
    if (touch.cap === null) {
      if (!dx && !dy) return;
      touch.cap = Math.abs(dy) >= Math.abs(dx) && !menuOpen() && stepTarget(dy > 0 ? 1 : -1, window.pageYOffset) != null;
    }
    if (!touch.cap) return;
    if (e.cancelable) e.preventDefault();
    if (!touch.used && !anim && Math.abs(dy) > 24) {
      touch.used = true;
      goTo(stepTarget(dy > 0 ? 1 : -1, window.pageYOffset));
    }
  }, { passive: false });
  window.addEventListener('touchend', function () { touch = null; }, { passive: true });
  window.addEventListener('touchcancel', function () { touch = null; }, { passive: true });

  // Con el mouse presionado (p. ej. arrastrando la barra) manda la persona
  window.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') { pressed = true; stopAnim(); } }, { passive: true });
  window.addEventListener('pointerup', function () { pressed = false; settleSoon(); }, { passive: true });

  // Si el scroll queda quieto entre dos estaciones (inercia del dedo, barra,
  // Inicio/Fin…), se completa el paso en la dirección en que venía
  var settleT = 0;
  function settleSoon() {
    clearTimeout(settleT);
    settleT = setTimeout(function () {
      if (anim || pressed || touch || root.classList.contains('tour-running')) return;
      var y = window.pageYOffset, st = stations();
      if (y <= st[0] + 2 || y >= st[st.length - 1] - 2) return;
      for (var k = 0; k < st.length; k++) if (Math.abs(st[k] - y) <= 3) return;
      goTo(stepTarget(lastDir, y));
    }, 220);
  }
  window.addEventListener('scroll', function () {
    var y = window.pageYOffset;
    if (y !== lastY) { lastDir = y > lastY ? 1 : -1; lastY = y; }
    if (!anim) settleSoon();
  }, { passive: true });

  // Teclado: si el foco cae en un capítulo que no está en pantalla, llevamos el scroll a su estación
  caps.forEach(function (el, j) {
    el.addEventListener('focusin', function () {
      if (cur === j) return;
      stopAnim();
      window.scrollTo(0, stations()[j]);
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
