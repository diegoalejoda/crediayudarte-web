/* ===================================================================
   CrediAyudarte — Recorrido automático de la Home
   Un botón en el hero hace que la página avance sola, parada por parada,
   por los mismos 15 destinos del índice numerado (#snav). Pensado para
   gente mayor: en cada parada se queda el tiempo necesario para leer
   (según cuánto texto hay), y cualquier gesto de la persona (rueda,
   toque, tecla de scroll, clic fuera del control) lo PAUSA en vez de
   pelear con ella. Pausar / Seguir / Salir siempre visibles.
   En los capítulos de la experiencia (video por scroll) el texto queda
   fijo en pantalla y durante la lectura el video avanza despacio.
   =================================================================== */
(function () {
  'use strict';

  var btn = document.getElementById('tourBtn');
  var ui = document.getElementById('tour');
  if (!btn || !ui) return;

  var root = document.documentElement;
  var cine = document.getElementById('experiencia');
  var caps = cine ? Array.prototype.slice.call(cine.querySelectorAll('.cap')) : [];
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var playBtn = document.getElementById('tourPlay');
  var closeBtn = document.getElementById('tourClose');
  var lbl = ui.querySelector('.tour__lbl');
  var nameEl = ui.querySelector('.tour__name');
  var stepEl = ui.querySelector('.tour__step');
  var bar = ui.querySelector('.tour__bar i');

  // Paradas = los destinos del índice numerado (una sola fuente de verdad)
  var stops = Array.prototype.slice.call(document.querySelectorAll('#snav .snav__list a')).map(function (a) {
    var t = a.querySelector('.snav__t');
    return { el: document.getElementById(a.getAttribute('href').slice(1)), name: t ? t.textContent.trim() : '' };
  }).filter(function (s) { return s.el; });
  var N = stops.length;
  if (N < 2) return;

  root.classList.add('tour-on');

  /* ---------- Utilidades ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function words(el) { return (el.textContent || '').trim().split(/\s+/).filter(Boolean).length; }
  function navH() { var n = document.querySelector('.cnav'); return n ? n.offsetHeight : 0; }
  function maxY() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
  function cineReady() { return !!(cine && cine.cineInfo && root.classList.contains('cine-on')); }
  function easeInOut(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function easeSine(k) { return -(Math.cos(Math.PI * k) - 1) / 2; }
  function track(name) { if (typeof window.fbq === 'function') window.fbq('trackCustom', name); }

  // Tramo [desde, hasta] (scroll de página) en que se lee la parada i.
  // Capítulo: entra al 30 % (titular y texto ya visibles) y avanza despacio
  // hasta el 66 % (todas las piezas en pantalla, antes de que el copy salga).
  function span(i) {
    var s = stops[i], j = caps.indexOf(s.el), y = window.pageYOffset;
    if (j >= 0 && cineReady()) {
      var info = cine.cineInfo, top = cine.getBoundingClientRect().top + y;
      if (j === 0) return [top, top];
      var last = j === info.starts.length - 1;
      // 0.38: a esa altura ya entraron titular, texto y piezas (fases h/b/c ≤ .32),
      // así en paradas cortas no se llega a medio fundido
      return [top + info.starts[j] + info.lens[j] * 0.38, top + info.starts[j] + info.lens[j] * (last ? 0.6 : 0.66)];
    }
    var t = s.el.getBoundingClientRect().top + y - navH() - 12;
    return [t, t];
  }

  // Duración total del recorrido (decisión del dueño 2026-09-29: 26 s en total).
  // Se reparte entre las paradas según cuánto texto tiene cada una (readMs como
  // peso); de cada tramo, un 35 % es el desplazamiento y un 65 % la lectura.
  var TOTAL_MS = 26000, MOVE_SHARE = 0.35;
  var budget = [];
  function plan(from) {
    var sum = 0, k;
    for (k = from; k < N; k++) sum += readMs(k);
    for (k = 0; k < N; k++) budget[k] = k < from ? 0 : TOTAL_MS * readMs(k) / sum;
  }

  // Peso de lectura de cada parada: ~230 ms por palabra con mínimos y máximos
  // (ya no es el tiempo real: solo decide qué parada recibe más de los 26 s).
  function readMs(i) {
    var s = stops[i];
    if (caps.indexOf(s.el) >= 0) return clamp(1200 + words(s.el) * 230, 4500, 11000);
    var head = s.el.querySelector('.hsec__head') || s.el;
    return clamp(3000 + words(head) * 230, 5000, 10000);
  }

  /* ---------- Motor: un tramo animado a la vez (movimiento o lectura) ---------- */
  var seg = null, raf = 0;
  var running = false, paused = false, done = false, i = 0;

  function runSeg(from, to, dur, ease, kind, then) {
    cancelAnimationFrame(raf);
    seg = { from: from, to: to, dur: Math.max(1, dur), ease: ease, kind: kind, then: then, t0: performance.now(), k: 0 };
    raf = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!seg || paused) return;
    var k = clamp((now - seg.t0) / seg.dur, 0, 1);
    seg.k = k;
    if (seg.to !== seg.from) window.scrollTo(0, Math.round(seg.from + (seg.to - seg.from) * seg.ease(k)));
    progress();
    if (k >= 1) { var t = seg.then; seg = null; t(); return; }
    raf = requestAnimationFrame(tick);
  }

  function goTo(n) {
    i = n;
    render();
    var sp = span(i), m = maxY();
    var a = Math.min(sp[0], m), b = Math.min(sp[1], m);
    var dist = Math.abs(a - window.pageYOffset);
    var total = budget[i] || 1800;
    var dur = mqReduce.matches || dist < 4 ? 0 : total * MOVE_SHARE;
    runSeg(window.pageYOffset, a, dur, easeInOut, 'move', function () {
      runSeg(a, mqReduce.matches ? a : b, total - dur, easeSine, 'hold', next);
    });
  }
  function next() {
    if (i + 1 < N) goTo(i + 1);
    else finish();
  }

  /* ---------- Estados ---------- */
  function start() {
    running = true; paused = false; done = false;
    ui.hidden = false;
    requestAnimationFrame(function () { ui.classList.add('is-on'); });
    root.classList.add('tour-running');
    playBtn.focus({ preventScroll: true });
    track('home_tour_start');
    // Si ya se está en el inicio se arranca por la parada 2 (el hero ya se vio)
    var first = window.pageYOffset < 40 ? 1 : 0;
    plan(first);
    goTo(first);
  }
  function pause() {
    if (!running || paused || done) return;
    paused = true;
    cancelAnimationFrame(raf);
    if (seg) { seg.left = seg.dur * (1 - seg.k); seg.at = window.pageYOffset; }
    render();
  }
  function resume() {
    if (!running || !paused) return;
    paused = false;
    render();
    // Si se pausó leyendo y nadie movió la página, sigue donde iba;
    // si la persona se movió, se vuelve a entrar a la parada actual.
    if (seg && seg.kind === 'hold' && Math.abs(window.pageYOffset - seg.at) < 40) {
      var s = seg;
      runSeg(window.pageYOffset, s.to, s.left, s.ease, 'hold', s.then);
    } else {
      goTo(i);
    }
  }
  function finish() {
    done = true; paused = false; seg = null;
    track('home_tour_complete');
    render();
  }
  function stop() {
    running = false; paused = false; done = false; seg = null;
    cancelAnimationFrame(raf);
    root.classList.remove('tour-running');
    ui.classList.remove('is-on');
    setTimeout(function () { if (!running) ui.hidden = true; }, 350);
    if (ui.contains(document.activeElement)) btn.focus({ preventScroll: true });
  }

  /* ---------- Interfaz ---------- */
  function render() {
    if (done) {
      nameEl.textContent = '¡Listo!';
      stepEl.textContent = '';
      lbl.textContent = 'Ver otra vez';
      ui.classList.add('is-paused');
      bar.style.transform = 'scaleX(1)';
      return;
    }
    nameEl.textContent = stops[i].name;
    stepEl.textContent = '· ' + (i + 1) + ' de ' + N;
    lbl.textContent = paused ? 'Seguir' : 'Pausar';
    ui.classList.toggle('is-paused', paused);
    playBtn.setAttribute('aria-label', paused ? 'Seguir el recorrido' : 'Pausar el recorrido');
    progress();
  }
  function progress() {
    var base = Math.max(0, i - 1), frac = 0;
    if (seg) frac = seg.kind === 'hold' ? 0.25 + 0.75 * seg.k : 0.25 * seg.k;
    bar.style.transform = 'scaleX(' + clamp((base + frac) / (N - 1), 0, 1).toFixed(4) + ')';
  }

  btn.addEventListener('click', function () { if (running) stop(); start(); });
  playBtn.addEventListener('click', function () {
    if (done) { window.scrollTo(0, 0); stop(); start(); return; }
    if (paused) resume(); else pause();
  });
  closeBtn.addEventListener('click', stop);

  /* ---------- La persona manda: cualquier gesto propio pausa ---------- */
  function fromUser(e) { return !ui.contains(e.target); }
  window.addEventListener('wheel', function () { if (done) stop(); else pause(); }, { passive: true });
  window.addEventListener('touchstart', function (e) { if (fromUser(e)) { if (done) stop(); else pause(); } }, { passive: true });
  document.addEventListener('pointerdown', function (e) { if (running && fromUser(e) && e.target !== btn && !btn.contains(e.target)) pause(); });
  document.addEventListener('keydown', function (e) {
    if (!running) return;
    if (e.key === 'Escape') { stop(); return; }
    if (/^(PageDown|PageUp|ArrowDown|ArrowUp|Home|End| )$/.test(e.key) && fromUser(e)) pause();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
})();
