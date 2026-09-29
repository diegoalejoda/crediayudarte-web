/* ===================================================================
   CrediAyudarte — Home: navegación, acordeón de preguntas,
   línea de pasos, WhatsApp flotante y medición de CTA.
   (Menú móvil, año y paginación de preguntas: js/script.js)
   =================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var nav = document.querySelector('.cnav');
  var cine = document.getElementById('experiencia');
  var wa = document.querySelector('.wa-float');

  /* ---- Navbar: pasa a superficie blanca al empezar el scroll;
          WhatsApp flotante solo cuando termina la experiencia ---- */
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (nav) nav.classList.toggle('is-solid', window.pageYOffset > 24);
    if (wa) {
      var hide = cine ? cine.getBoundingClientRect().bottom > window.innerHeight * 0.55 : false;
      wa.classList.toggle('is-hidden', hide);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---- Acordeón de preguntas: <button aria-expanded> + región ---- */
  var btns = document.querySelectorAll('.acc__btn');
  if (btns.length) {
    root.classList.add('acc-on');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.acc__item');
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        item.classList.toggle('is-open', open);
      });
    });
  }

  /* ---- Cómo funciona: la línea verde se completa al entrar ---- */
  var pasos = document.querySelector('.pasos');
  if (pasos) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { pasos.classList.add('is-in'); io.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(pasos.querySelector('.pasos__list') || pasos);
    } else {
      pasos.classList.add('is-in');
    }
  }

  /* ---- Liquid glass: el reflejo especular sigue al puntero ---- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fine && !still) {
    var glass = null, gx = 0, gy = 0, gTick = false;
    document.addEventListener('pointermove', function (e) {
      glass = e.target.closest ? e.target.closest('.lg') : null;
      if (!glass) return;
      gx = e.clientX; gy = e.clientY;
      if (!gTick) {
        gTick = true;
        requestAnimationFrame(function () {
          gTick = false;
          if (!glass) return;
          var r = glass.getBoundingClientRect();
          glass.style.setProperty('--mx', ((gx - r.left) / r.width * 100).toFixed(1) + '%');
          glass.style.setProperty('--my', ((gy - r.top) / r.height * 100).toFixed(1) + '%');
        });
      }
    }, { passive: true });
  }

  /* ---- "9 años": el número corre al entrar en pantalla ---- */
  var counters = document.querySelectorAll('.hsec [data-count]');
  if (counters.length && 'IntersectionObserver' in window && !still) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var node = en.target, to = +node.getAttribute('data-count'), t0 = null;
        node.textContent = '0';
        (function loop() {
          requestAnimationFrame(function (ts) {
            if (t0 === null) t0 = ts;
            var k = Math.min(1, (ts - t0) / 1100);
            node.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
            if (k < 1) loop();
          });
        })();
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (n) { co.observe(n); });
  }

  /* ---- Índice numerado de secciones ----
     Los 9 capítulos de la experiencia no tienen posición propia en la página
     (viven en un escenario sticky): su destino sale de los tramos que publica
     cine.js (sec.cineInfo). Las secciones normales usan su posición real. */
  var snav = document.getElementById('snav');
  if (snav) {
    var navH = function () { return nav ? nav.offsetHeight : 0; };
    var enlaces = Array.prototype.slice.call(snav.querySelectorAll('a'));
    var destinos = enlaces.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var capIdx = destinos.map(function (el) { return el && el.classList.contains('cap') && cine ? Array.prototype.indexOf.call(cine.querySelectorAll('.cap'), el) : -1; });

    // En teléfono el mismo índice va dentro del menú de la cápsula
    var menu = document.getElementById('nav');
    var copia = null;
    if (menu) {
      copia = document.createElement('div');
      copia.className = 'cnav__secs';
      copia.innerHTML = '<p>Secciones</p>';
      var ol = snav.querySelector('ol').cloneNode(true);
      ol.className = '';
      copia.appendChild(ol);
      menu.appendChild(copia);
    }
    var todos = enlaces.concat(copia ? Array.prototype.slice.call(copia.querySelectorAll('a')) : []);

    // Scroll (en px de página) en que se ve el destino i
    function yDe(i) {
      var info = cine && cine.cineInfo;
      if (capIdx[i] >= 0 && info && root.classList.contains('cine-on')) {
        var top = cine.getBoundingClientRect().top + window.pageYOffset;
        var j = capIdx[i];
        if (j === 0) return top;
        // mitad de la lectura del capítulo (el copy ya entró y aún no sale)
        return top + info.starts[j] + info.lens[j] * (j === info.starts.length - 1 ? 0.6 : 0.42);
      }
      var el = destinos[i];
      return el ? el.getBoundingClientRect().top + window.pageYOffset - navH() : 0;
    }

    // Umbral (en scroll de página) desde el que cuenta cada destino: los capítulos cambian
    // exactamente cuando cambia cine.js; las secciones, al pasar el 35 % superior de la pantalla
    var activo = -1;
    function marcar() {
      var y = window.pageYOffset;
      var info = cine && cine.cineInfo;
      var conCine = info && root.classList.contains('cine-on');
      var secTop = cine ? cine.getBoundingClientRect().top + y : 0;
      var n = 0;
      for (var i = 1; i < destinos.length; i++) {
        var ini;
        if (capIdx[i] >= 0 && conCine) ini = secTop + info.starts[capIdx[i]];
        else if (destinos[i]) ini = destinos[i].getBoundingClientRect().top + y - window.innerHeight * 0.35;
        else continue;
        if (ini <= y) n = i;
      }
      if (n === activo) return;
      activo = n;
      var k = enlaces.length;
      todos.forEach(function (a, idx) {
        var on = idx % k === n;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }

    todos.forEach(function (a, idx) {
      a.addEventListener('click', function (e) {
        var i = idx % enlaces.length;
        e.preventDefault();
        if (copia && menu.classList.contains('is-open')) {
          menu.classList.remove('is-open');
          var tg = document.getElementById('navToggle');
          if (tg) { tg.classList.remove('is-open'); tg.setAttribute('aria-expanded', 'false'); }
        }
        window.scrollTo({ top: Math.max(0, Math.round(yDe(i))), behavior: still ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
      });
    });

    var mTick = false;
    window.addEventListener('scroll', function () {
      if (!mTick) { mTick = true; requestAnimationFrame(function () { mTick = false; marcar(); }); }
    }, { passive: true });
    window.addEventListener('resize', marcar, { passive: true });
    window.addEventListener('load', marcar);
    marcar();
  }

  /* ---- Medición: clic en "Solicita tu análisis" (sin datos personales) ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="solicitar"]') : null;
    if (a && typeof window.fbq === 'function') {
      window.fbq('trackCustom', 'cta_solicitar_click', { ubicacion: a.getAttribute('data-ubic') || 'enlace' });
    }
  });
})();
