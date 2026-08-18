/* ===================================================================
   CrediAyudarte — Motor de movimiento
   Acompaña a css/motion.css. Todo es progresivo: si este archivo no
   carga, la página sigue funcionando exactamente igual.

   · Nada bloquea el render (se carga con defer).
   · Todo el trabajo de scroll pasa por requestAnimationFrame.
   · Si el sistema pide menos movimiento, el motor no arranca.
   =================================================================== */
(function () {
  'use strict';

  var menosMovimiento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (fn) { return setTimeout(fn, 16); };

  var hayIO = 'IntersectionObserver' in window;

  /* ---------------------------------------------------------------
     1. Barra de progreso de lectura + header compacto
     --------------------------------------------------------------- */
  (function progresoYHeader() {
    var header = document.querySelector('.header');
    var raiz = document.documentElement;
    var pendiente = false;

    function pintar() {
      pendiente = false;
      var alto = raiz.scrollHeight - window.innerHeight;
      var y = window.scrollY || window.pageYOffset || 0;
      var avance = alto > 0 ? Math.min(1, Math.max(0, y / alto)) : 0;
      raiz.style.setProperty('--scroll-progreso', avance.toFixed(4));
      if (header) header.classList.toggle('is-stuck', y > 40);
    }

    function alScroll() {
      if (!pendiente) { pendiente = true; raf(pintar); }
    }

    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll, { passive: true });
    pintar();
  })();

  if (menosMovimiento) return;   // a partir de aquí, todo es decoración

  // Marca que el motor arrancó: los efectos que necesitan JS para
  // completarse solo se activan si esta clase está puesta.
  document.documentElement.classList.add('motion-viva');

  /* ---------------------------------------------------------------
     2. Titulares que entran palabra por palabra

     Se parten SOLO los nodos de texto. Los elementos hijos (<mark>,
     <span class="hl-green">, .h1-kicker) se dejan intactos y se les
     da su propio retardo, así no se rompe ni el resaltado amarillo ni
     el salto de línea en móvil. El texto del documento no cambia.
     --------------------------------------------------------------- */
  (function titularesAnimados() {
    var titulares = document.querySelectorAll(
      '.hero h1, .page-hero h1, .pitch-info h1, .section__head h2, ' +
      '.testimonios__copy h2, .codigo__intro h2, .fb__copy h2, ' +
      '.mapa__copy h2, .contacto__copy h2'
    );
    if (!titulares.length) return;

    function partir(titular) {
      var piezas = [];
      var hijos = Array.prototype.slice.call(titular.childNodes);

      hijos.forEach(function (nodo) {
        if (nodo.nodeType === 3) {
          // Nodo de texto: se parte en palabras conservando los espacios
          var trozos = nodo.nodeValue.split(/(\s+)/);
          var fragmento = document.createDocumentFragment();
          trozos.forEach(function (t) {
            if (t === '') return;
            if (/^\s+$/.test(t)) {
              fragmento.appendChild(document.createTextNode(t));
            } else {
              var s = document.createElement('span');
              s.className = 'pal';
              s.textContent = t;
              fragmento.appendChild(s);
              piezas.push(s);
            }
          });
          if (nodo.parentNode) nodo.parentNode.replaceChild(fragmento, nodo);
        } else if (nodo.nodeType === 1) {
          // Elemento hijo: entra entero, sin tocar su contenido
          nodo.classList.add('pal-lista');
          piezas.push(nodo);
        }
      });

      piezas.forEach(function (p, i) {
        p.style.setProperty('--pal-retardo', Math.min(i * 32, 380) + 'ms');
      });
      titular.classList.add('titulo-anim');
    }

    titulares.forEach(partir);

    // El h1 está sobre el pliegue: se muestra en cuanto la página pinta
    var primeros = document.querySelectorAll('h1.titulo-anim');
    raf(function () {
      raf(function () {
        primeros.forEach(function (h) { h.classList.add('is-visible'); });
      });
    });

    // Los h2 esperan a que el usuario llegue a ellos
    var resto = Array.prototype.filter.call(titulares, function (t) {
      return t.tagName !== 'H1';
    });
    if (!resto.length) return;

    if (!hayIO) {
      resto.forEach(function (t) { t.classList.add('is-visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.25, rootMargin: '0px 0px -60px 0px' });
    resto.forEach(function (t) { obs.observe(t); });
  })();

  /* ---------------------------------------------------------------
     3. Las cifras cuentan hasta su valor
     --------------------------------------------------------------- */
  (function cifrasQueCuentan() {
    var cifras = document.querySelectorAll('.hero__mini strong, .testimonios__stats strong');
    if (!cifras.length || !hayIO) return;

    function animar(el) {
      var original = el.textContent.trim();
      var partes = original.match(/^(\D*?)(\d+)(\D*)$/);
      if (!partes) return;

      var prefijo = partes[1], destino = parseInt(partes[2], 10), sufijo = partes[3];
      if (destino === 0) return;                 // el "0 anticipos" se queda quieto
      var duracion = 1100, inicio = null;

      // Se reserva el ancho final para que el texto no salte mientras cuenta
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
      el.textContent = prefijo + '0' + sufijo;

      function paso(t) {
        if (inicio === null) inicio = t;
        var p = Math.min(1, (t - inicio) / duracion);
        var suave = 1 - Math.pow(1 - p, 3);      // easeOutCubic
        el.textContent = prefijo + Math.round(destino * suave) + sufijo;
        if (p < 1) raf(paso);
        else el.textContent = original;
      }
      raf(paso);
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        animar(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    cifras.forEach(function (c) { obs.observe(c); });
  })();

  /* ---------------------------------------------------------------
     4. Tarjetas: luz que sigue al cursor e inclinación 3D
     --------------------------------------------------------------- */
  (function tarjetasVivas() {
    var finoYConHover = window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!finoYConHover) return;

    var tarjetas = document.querySelectorAll('.who-card, .svc-card, .step, .perfil-card');
    tarjetas.forEach(function (tarjeta) {
      tarjeta.classList.add('tarjeta-3d');
      var caja = null, encolado = false, ultimo = null;

      function aplicar() {
        encolado = false;
        if (!caja || !ultimo) return;
        var x = (ultimo.clientX - caja.left) / caja.width;
        var y = (ultimo.clientY - caja.top) / caja.height;
        tarjeta.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        tarjeta.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        tarjeta.style.setProperty('--tilt-x', ((x - 0.5) * 7).toFixed(2));
        tarjeta.style.setProperty('--tilt-y', ((0.5 - y) * 7).toFixed(2));
      }

      tarjeta.addEventListener('pointerenter', function (ev) {
        caja = tarjeta.getBoundingClientRect();
        ultimo = ev;
        tarjeta.classList.add('is-tilting');
        if (!encolado) { encolado = true; raf(aplicar); }
      });

      tarjeta.addEventListener('pointermove', function (ev) {
        ultimo = ev;
        if (!encolado) { encolado = true; raf(aplicar); }
      });

      tarjeta.addEventListener('pointerleave', function () {
        tarjeta.classList.remove('is-tilting');
        tarjeta.style.setProperty('--tilt-x', 0);
        tarjeta.style.setProperty('--tilt-y', 0);
        caja = null;
      });
    });
  })();

  /* ---------------------------------------------------------------
     5. El hilo del proceso se dibuja al llegar
     --------------------------------------------------------------- */
  (function hiloDelProceso() {
    var pasos = document.querySelector('.steps');
    if (!pasos || !hayIO) return;
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-drawn');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    obs.observe(pasos);
  })();

  /* ---------------------------------------------------------------
     6. Tira de confianza en desfile continuo (solo en pantallas
        estrechas, donde si no se parte en varias líneas)
     --------------------------------------------------------------- */
  (function desfileDeConfianza() {
    var tira = document.querySelector('.trust-strip');
    var pista = tira && tira.querySelector('.trust-strip__inner');
    if (!pista) return;

    var clonado = false;

    function revisar() {
      var estrecho = window.innerWidth < 900;
      if (estrecho && !clonado) {
        var copia = pista.cloneNode(true);
        // La copia es puramente visual: no debe leerse dos veces
        copia.setAttribute('aria-hidden', 'true');
        while (copia.firstChild) pista.appendChild(copia.firstChild);
        tira.classList.add('es-desfile');
        clonado = true;
      } else if (!estrecho && clonado) {
        tira.classList.remove('es-desfile');
      } else if (estrecho && clonado) {
        tira.classList.add('es-desfile');
      }
    }

    revisar();
    var temporizador;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(revisar, 200);
    }, { passive: true });
  })();

  /* ---------------------------------------------------------------
     7. El botón de WhatsApp saluda de vez en cuando
     --------------------------------------------------------------- */
  (function saludoDeWhatsapp() {
    var wa = document.querySelector('.wa-float');
    if (!wa) return;
    setInterval(function () {
      if (document.hidden) return;
      wa.classList.add('saluda');
      setTimeout(function () { wa.classList.remove('saluda'); }, 1200);
    }, 14000);
  })();

  /* ---------------------------------------------------------------
     8. La tarjeta del hero sigue suavemente al cursor
     --------------------------------------------------------------- */
  (function tarjetaQueSigue() {
    var tarjeta = document.querySelector('.hero__card');
    var hero = document.querySelector('.hero');
    if (!tarjeta || !hero) return;
    if (!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches)) return;

    var encolado = false, ev = null;

    function mover() {
      encolado = false;
      if (!ev) return;
      var caja = hero.getBoundingClientRect();
      var x = ((ev.clientX - caja.left) / caja.width - 0.5) * 18;
      var y = ((ev.clientY - caja.top) / caja.height - 0.5) * 14;
      tarjeta.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    }

    hero.addEventListener('pointermove', function (e) {
      ev = e;
      if (!encolado) { encolado = true; raf(mover); }
    });
    hero.addEventListener('pointerleave', function () {
      ev = null;
      tarjeta.style.transform = '';
    });
  })();

})();
