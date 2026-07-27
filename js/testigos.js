/* ===================================================================
   CrediAyudarte — Galería de testigos: filtros, preview y lightbox
   Los videos SIEMPRE van sin sonido (muted)
   =================================================================== */
(function () {
  'use strict';

  var masonry = document.getElementById('masonry');
  if (!masonry) return;

  var items = Array.prototype.slice.call(masonry.querySelectorAll('.masonry__item'));
  var filterBtns = document.querySelectorAll('.filter-btn');

  /* ---- Filtros Todo / Fotos / Videos ---- */
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var filter = btn.getAttribute('data-filter');
      items.forEach(function (item) {
        var show = filter === 'all' || item.getAttribute('data-type') === filter;
        item.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---- Vista previa: al pasar el mouse, el video se reproduce en silencio ---- */
  items.forEach(function (item) {
    var video = item.querySelector('video');
    if (!video) return;
    video.muted = true; // garantizar sin sonido
    item.addEventListener('mouseenter', function () {
      video.muted = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });
    item.addEventListener('mouseleave', function () {
      video.pause();
      video.currentTime = 0.1;
    });
  });

  /* ---- Lightbox ---- */
  var lightbox = document.getElementById('lightbox');
  var lbInner = document.getElementById('lbInner');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var current = -1;

  function visibleItems() {
    return items.filter(function (i) { return !i.classList.contains('is-hidden'); });
  }

  function openAt(item) {
    var list = visibleItems();
    current = list.indexOf(item);
    render(list[current]);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function render(item) {
    var type = item.getAttribute('data-type');
    var src = item.getAttribute('data-src');
    lbInner.innerHTML = '';
    if (type === 'video') {
      var v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.muted = true;      // sin sonido
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      lbInner.appendChild(v);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.alt = 'Testigo de CrediAyudarte';
      lbInner.appendChild(img);
    }
  }

  function move(dir) {
    var list = visibleItems();
    if (!list.length) return;
    current = (current + dir + list.length) % list.length;
    render(list[current]);
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lbInner.innerHTML = '';
    document.body.style.overflow = '';
    current = -1;
  }

  items.forEach(function (item) {
    item.addEventListener('click', function () { openAt(item); });
  });
  if (lbClose) lbClose.addEventListener('click', close);
  if (lbPrev) lbPrev.addEventListener('click', function () { move(-1); });
  if (lbNext) lbNext.addEventListener('click', function () { move(1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'ArrowRight') move(1);
  });
})();
