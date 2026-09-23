/* ===================================================================
   CrediAyudarte — El camino del crédito (hero de solicitar.html)
   El avance del scroll dentro de la sección (0 → 1) decide qué
   fotograma se pinta en el lienzo y cuál de los cinco tramos de texto
   está encendido. Los fotogramas son imágenes sueltas: se cargan de
   forma escalonada (primero uno de cada ocho, luego se rellenan) y
   mientras tanto se pinta el más cercano que ya esté listo.
   =================================================================== */
(function () {
  'use strict';

  var sec = document.getElementById('camino');
  var lienzo = document.getElementById('caminoLienzo');
  if (!sec || !lienzo || !lienzo.getContext) return;

  var pasos = sec.querySelectorAll('.camino__paso');
  var segs = sec.querySelectorAll('.camino__seg');
  var N = parseInt(sec.getAttribute('data-frames'), 10) || 100;
  // Dónde arranca cada tramo (fracción del recorrido). Coinciden con el
  // momento en que cada fundido entre escenas termina (video de 10s: recibimos
  // 0-3s, orientamos 3-4.7s, opciones 4.7-7s, escenarios 7-10s).
  var TRAMOS = [0, 0.30, 0.53, 0.77];

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var ahorro = !!(conn && (conn.saveData || /^(slow-)?2g$/.test(conn.effectiveType || '')));
  var movil = window.matchMedia && window.matchMedia('(max-width: 860px)').matches;
  var base = 'assets/generative/camino/' + (movil ? 'm/' : 'd/');

  sec.classList.add('is-js');

  // El header es sticky y ocupa flujo: el panel se mete debajo de él para
  // arrancar pegado arriba, y deja su altura como margen interior.
  var cabecera = document.querySelector('.header');
  function medirCabecera() {
    if (cabecera) sec.style.setProperty('--cab', cabecera.offsetHeight + 'px');
  }
  medirCabecera();

  var ctx = lienzo.getContext('2d');
  var frames = new Array(N);
  var idxActual = 0;
  var idxPintado = -1;
  var tramoActual = -1;
  var listo = false;

  /* ---- Lienzo: tamaño real y dibujo tipo object-fit: cover ---- */
  function medir() {
    var r = lienzo.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w === lienzo.width && h === lienzo.height) return;
    lienzo.width = w; lienzo.height = h;
    idxPintado = -1;
    pintar();
  }

  function masCercano(i) {
    for (var d = 0; d < N; d++) {
      var a = frames[i - d], b = frames[i + d];
      if (a && a.naturalWidth) return a;
      if (b && b.naturalWidth) return b;
    }
    return null;
  }

  function pintar() {
    var img = masCercano(idxActual);
    if (!img || img.__i === idxPintado) return;
    var cw = lienzo.width, ch = lienzo.height;
    var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    idxPintado = img.__i;
    if (!listo) { listo = true; lienzo.classList.add('is-listo'); }
  }

  /* ---- Carga escalonada: 1 de cada 8, luego 4, 2, 1 ---- */
  function cargar() {
    var orden = [], visto = {};
    [8, 4, 2, 1].forEach(function (salto) {
      for (var i = 0; i < N; i += salto) { if (!visto[i]) { visto[i] = 1; orden.push(i); } }
    });
    var cursor = 0, activos = 0;
    function siguiente() {
      while (activos < 4 && cursor < orden.length) {
        var i = orden[cursor++];
        var im = new Image();
        im.decoding = 'async';
        im.__i = i;
        activos++;
        im.onload = im.onerror = function () {
          activos--;
          if (this.naturalWidth) {
            frames[this.__i] = this;
            if (Math.abs(this.__i - idxActual) <= 8) pintar();
          }
          siguiente();
        };
        im.src = base + (i < 10 ? '00' : i < 100 ? '0' : '') + i + '.webp';
      }
    }
    siguiente();
  }

  /* ---- Avance del scroll → fotograma + tramo ---- */
  function avance() {
    var r = sec.getBoundingClientRect();
    var recorrido = r.height - window.innerHeight;
    if (recorrido <= 0) return 0;
    var p = -r.top / recorrido;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function tramoDe(p) {
    var t = 0;
    for (var k = 1; k < TRAMOS.length; k++) if (p >= TRAMOS[k]) t = k;
    return t;
  }

  function aplicar() {
    var p = avance();
    var idx = Math.round(p * (N - 1));
    if (idx !== idxActual) { idxActual = idx; pintar(); }

    var t = tramoDe(p);
    if (t !== tramoActual) {
      tramoActual = t;
      for (var i = 0; i < pasos.length; i++) {
        var on = i === t;
        pasos[i].classList.toggle('is-on', on);
        if (on) pasos[i].removeAttribute('inert'); else pasos[i].setAttribute('inert', '');
      }
      for (var j = 0; j < segs.length; j++) {
        segs[j].classList.toggle('is-done', j <= t);
        segs[j].classList.toggle('is-actual', j === t);
      }
      sec.setAttribute('data-tramo', String(t));
    }
  }

  var pendiente = false;
  function programar() {
    if (pendiente) return;
    pendiente = true;
    window.requestAnimationFrame(function () { pendiente = false; aplicar(); });
  }

  window.addEventListener('scroll', programar, { passive: true });
  window.addEventListener('resize', function () { medirCabecera(); medir(); programar(); }, { passive: true });

  medir();
  aplicar();

  // Con ahorro de datos o sin animaciones se queda el póster; el texto sigue relevándose.
  if (!reduce && !ahorro) cargar();
})();
