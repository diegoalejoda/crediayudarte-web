/* ===================================================================
   CrediAyudarte — interacciones globales
   Menú móvil · revelado al scroll · sombra del header · año
   =================================================================== */
(function () {
  'use strict';

  /* ---- Menú móvil ---- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Año automático en el footer ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Añadir la clase .reveal a elementos comunes que no la tengan ---- */
  var autoReveal = document.querySelectorAll(
    '.who-card, .svc-card, .step, .q-card, .codigo__list li, .faq__item, .section__head, .masonry__item, .gallery__filters'
  );
  autoReveal.forEach(function (el) { el.classList.add('reveal'); });

  /* ---- Revelar todos los .reveal al hacer scroll ---- */
  var targets = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = parseFloat(el.getAttribute('data-delay')) || 0;
          // pequeño escalonado entre hermanos de un mismo grupo
          var siblings = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).filter(function (c) { return c.classList.contains('reveal'); }) : [];
          var idx = siblings.indexOf(el);
          if (idx > 0) delay += Math.min(idx * 70, 350);
          setTimeout(function () { el.classList.add('is-visible'); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Paginación de Preguntas (10 por página) ---- */
  var faqWrap = document.getElementById('faqPages');
  var faqPager = document.getElementById('faqPager');
  if (faqWrap && faqPager) {
    var pages = faqWrap.querySelectorAll('.faq[data-faq-page]');
    var nums = faqPager.querySelectorAll('.pager__num');
    var prevBtn = faqPager.querySelector('[data-go="prev"]');
    var nextBtn = faqPager.querySelector('[data-go="next"]');
    var total = pages.length;
    var currentPage = 1;

    var showPage = function (n) {
      currentPage = Math.max(1, Math.min(total, n));
      pages.forEach(function (p) {
        var pg = parseInt(p.getAttribute('data-faq-page'), 10);
        p.hidden = pg !== currentPage;
        // cerrar acordeones ocultos
        if (pg !== currentPage) {
          p.querySelectorAll('details[open]').forEach(function (d) { d.open = false; });
        }
      });
      nums.forEach(function (b) {
        b.classList.toggle('is-active', parseInt(b.getAttribute('data-page'), 10) === currentPage);
      });
      if (prevBtn) prevBtn.disabled = currentPage === 1;
      if (nextBtn) nextBtn.disabled = currentPage === total;
      // subir al inicio de la sección al cambiar de página
      var sec = document.getElementById('preguntas');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    nums.forEach(function (b) {
      b.addEventListener('click', function () { showPage(parseInt(b.getAttribute('data-page'), 10)); });
    });
    if (prevBtn) prevBtn.addEventListener('click', function () { showPage(currentPage - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showPage(currentPage + 1); });
  }

  /* ---- Sombra del header al hacer scroll ---- */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () {
      header.style.boxShadow = window.scrollY > 8
        ? '0 12px 34px -18px rgba(30,42,25,.45)'
        : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
