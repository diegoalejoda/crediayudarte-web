/* ===================================================================
   CrediAyudarte — Home y /solicitar: navegación, acordeón de preguntas,
   línea de pasos, WhatsApp flotante y medición de CTA.
   (Menú móvil, año, revelado y botón "volver arriba": js/script.js)
   =================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var nav = document.querySelector('.cnav');
  var hero = document.getElementById('inicio');
  var wa = document.querySelector('.wa-float');

  /* ---- Navbar: pasa a superficie blanca al empezar el scroll;
          WhatsApp flotante solo después del hero (que ya tiene su botón) ---- */
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (nav) nav.classList.toggle('is-solid', window.pageYOffset > 24);
    if (wa) {
      var hide = hero ? hero.getBoundingClientRect().bottom > window.innerHeight * 0.3 : false;
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

  /* ---- contadores [data-count]: el número corre al entrar en pantalla ---- */
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

  /* ---- Medición: clic en "Solicita tu análisis" (sin datos personales) ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="solicitar"]') : null;
    if (a && typeof window.fbq === 'function') {
      window.fbq('trackCustom', 'cta_solicitar_click', { ubicacion: a.getAttribute('data-ubic') || 'enlace' });
    }
  });
})();
