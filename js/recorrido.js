/* CrediAyudarte — Recorrido apilado (01–04) y modal de preguntas.
   Solo actúa si existe .stack en la página. */
(function () {
  'use strict';

  var stack = document.querySelector('.stack');
  if (!stack) return;

  var paneles = Array.prototype.slice.call(stack.querySelectorAll('.stack__panel'));
  var indice = document.querySelector('.stack__index');
  var items = indice ? Array.prototype.slice.call(indice.querySelectorAll('li')) : [];
  var hayIO = 'IntersectionObserver' in window;

  /* ---------------------------------------------------------------
     1. Panel activo por posición de scroll.
        Los paneles son sticky y se cubren unos a otros, así que un
        IntersectionObserver no sirve: el panel tapado sigue "intersectando"
        al 100 % y nunca vuelve a disparar al subir. Se calcula con el scroll:
        el panel i empieza en stackTop + i·alto; se activa cuando ya asoma
        más de un tercio. Un panel visto se queda visible (no se vuelve a
        ocultar) y su video se reanuda al volver a él, en ambas direcciones.
     --------------------------------------------------------------- */
  var activo = -1;

  function reproducir(v) {
    if (!v || !v.paused) return;
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
  }

  function activar(n) {
    if (n === activo) return;
    activo = n;
    items.forEach(function (li, i) { li.classList.toggle('is-active', i === n); });
    // El panel con el texto a la derecha manda el índice al lado izquierdo
    if (indice) indice.classList.toggle('stack__index--izq', paneles[n].classList.contains('stack__panel--der'));
    paneles.forEach(function (p, i) {
      if (i === n) p.classList.add('is-visible');
      var v = p.querySelector('video');
      if (!v) return;
      if (i === n) reproducir(v); else if (!v.paused) v.pause();
    });
  }

  var pendiente = false;
  function medir() {
    pendiente = false;
    var alto = window.innerHeight || 1;
    var top = stack.getBoundingClientRect().top;          // ≤ 0 mientras el recorrido está pegado
    var enPantalla = top < alto && top + stack.offsetHeight > 0;
    if (indice) indice.classList.toggle('is-on', enPantalla);
    if (!enPantalla) return;
    var n = Math.floor((-top) / alto + 0.65);             // activa al asomar ~35 %
    n = Math.max(0, Math.min(paneles.length - 1, n));
    activar(n);
  }
  function alScroll() { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } }
  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', alScroll, { passive: true });
  medir();

  items.forEach(function (li, i) {
    li.addEventListener('click', function () {
      window.scrollTo({ top: stack.offsetTop + i * window.innerHeight, behavior: 'smooth' });
    });
  });

  /* El hero tiene dos videos (uno de escritorio, uno de celular) pero un
     celular solo debe cargar el suyo: si al de escritorio (4K, pesado) le
     queda "autoplay" aunque esté oculto, compite por el ancho de banda con
     todo lo demás y hace que el resto de la página cargue a medias.
     Aquí se elige por ancho de pantalla, se reproduce solo ese y al otro
     se le quita cualquier intento de carga (preload="none"). */
  var heroD = document.querySelector('.hero__v-d');
  var heroM = document.querySelector('.hero__v-m');
  var heroVideos = Array.prototype.slice.call(document.querySelectorAll('.hero video'));
  if (heroD && heroM) {
    var mqMovil = window.matchMedia('(max-width:860px)');
    var ajustando = false;
    function elegirVideoHero() {
      if (ajustando) return; ajustando = true;
      var activo = mqMovil.matches ? heroM : heroD;
      var inactivo = mqMovil.matches ? heroD : heroM;
      if (!inactivo.paused) inactivo.pause();
      inactivo.preload = 'none';
      activo.preload = 'auto';
      reproducir(activo);
      ajustando = false;
    }
    elegirVideoHero();
    if (mqMovil.addEventListener) mqMovil.addEventListener('change', elegirVideoHero);
    else if (mqMovil.addListener) mqMovil.addListener(elegirVideoHero);
  }

  /* El video del hero se reproduce una vez; si el usuario vuelve arriba,
     se reinicia para que la escena se vea de nuevo. */
  if (heroVideos.length && hayIO) {
    var fuera = false;
    var ioHero = new IntersectionObserver(function (entradas) {
      var e = entradas[0];
      if (!e.isIntersecting) { fuera = true; heroVideos.forEach(function (v) { if (!v.paused) v.pause(); }); return; }
      heroVideos.forEach(function (v) {
        if (v.preload === 'none') return; // es el que no corresponde a este ancho de pantalla
        if (fuera) { try { v.currentTime = 0; } catch (err) {} }
        reproducir(v);
      });
      fuera = false;
    }, { threshold: 0.35 });
    ioHero.observe(heroVideos[0].closest('.hero') || heroVideos[0]);
  }

  /* ---------------------------------------------------------------
     2. Modal de preguntas. El texto es el mismo del FAQ del sitio.
     --------------------------------------------------------------- */
  var PANELES = [
    { id: 'analisis',   titulo: 'Un análisis honesto de tu caso',  foto: 'assets/generative/p01-poster.webp' },
    { id: 'pagaduria',  titulo: 'Tu pagaduría y tus descuentos',   foto: 'assets/generative/p02.webp' },
    { id: 'opciones',   titulo: 'Tus opciones antes de firmar',    foto: 'assets/generative/p03-poster.webp' },
    { id: 'acompanamos',titulo: 'Acompañamiento humano',           foto: 'assets/generative/p04.webp' }
  ];

  var PREGUNTAS = [
    { id: 'que-es-libranza', panel: 'analisis',
      titulo: '¿Qué es un crédito por libranza?',
      cuerpo: ['Es un crédito cuya cuota se descuenta directamente de tu nómina o pensión. Suele tener condiciones más ordenadas, pero igual conviene revisar plazo, costo total y descuentos antes de decidir.'],
      puntos: ['La cuota sale de tu pensión o nómina, no la pagas tú cada mes', 'Que sea ordenado no significa que siempre convenga', 'Lo que importa es plazo, costo total y descuentos'] },
    { id: 'cuanto-cuesta', panel: 'analisis',
      titulo: '¿Cuánto cuesta que revisen mi caso?',
      cuerpo: ['El preanálisis se hace sin costo y sin compromiso. Si una gestión tuviera costos u honorarios, te los explicamos con claridad antes de que decidas avanzar.'],
      puntos: ['El preanálisis no tiene costo', 'Sin compromiso de avanzar', 'Cualquier costo se explica antes, nunca después'] },
    { id: 'garantizan', panel: 'analisis',
      titulo: '¿Me garantizan que me aprueban el crédito?',
      cuerpo: ['No. Nadie serio puede garantizarte una aprobación. La decisión depende de tu perfil, pagaduría, capacidad, reporte y las políticas de cada entidad. Te decimos con honestidad qué tan viable se ve tu caso.'],
      puntos: ['La aprobación la decide la entidad, no nosotros', 'Te decimos qué tan viable se ve tu caso', 'Desconfía de quien te garantice una aprobación'] },

    { id: 'pagaduria', panel: 'pagaduria',
      titulo: '¿Qué es la pagaduría y por qué la preguntan?',
      cuerpo: ['La pagaduría es la entidad que te paga la pensión o la nómina. Es clave porque define qué opciones y qué entidades son compatibles con tu perfil.'],
      puntos: ['Es quien te paga: Colpensiones, FOPEP, Fiduprevisora, CASUR, CREMIL…', 'Define con qué entidades hay convenio', 'Es lo primero que revisamos'] },
    { id: 'desprendible', panel: 'pagaduria',
      titulo: '¿Qué es un desprendible y para qué lo necesitan?',
      cuerpo: ['Es tu comprobante de pago de pensión o nómina. Cuando corresponda, te pediremos una foto o PDF legible para revisar tu caso con precisión. Solo lo pedimos en el momento adecuado.'],
      puntos: ['Es tu comprobante de pago mensual', 'Ahí vemos tus descuentos reales', 'Solo lo pedimos cuando el caso lo amerita'] },
    { id: 'datos', panel: 'pagaduria',
      titulo: '¿Qué datos me van a pedir?',
      cuerpo: ['Solo lo necesario para orientarte, como tu pagaduría o entidad y tu situación general. No pedimos número de cédula, fecha de nacimiento, cuentas bancarias ni claves en el primer contacto.'],
      puntos: ['Pagaduría y situación general, nada más al inicio', 'Sin cédula, cuentas ni claves en frío', 'Los datos sensibles, si hacen falta, los gestiona una persona'] },

    { id: 'compra-cartera', panel: 'opciones',
      titulo: '¿La compra de cartera siempre conviene?',
      cuerpo: ['No siempre. Puede ser útil, pero también puede alargar la deuda o subir el costo total. Por eso la comparamos contra otras opciones: plazo, costo total, liquidez real y cuota.'],
      puntos: ['Puede alargar la deuda o subir el costo total', 'La comparamos contra otras opciones', 'Miramos liquidez real, no solo la cuota'] },
    { id: 'bajar-cuota', panel: 'opciones',
      titulo: '¿Me pueden ayudar a bajar la cuota?',
      cuerpo: ['A veces sí, pero recuerda: una cuota más baja no siempre es un mejor crédito si te agregan años de deuda. Revisamos si realmente te deja mejor después de costos y plazo.'],
      puntos: ['Cuota más baja no siempre es mejor crédito', 'Más años de deuda pueden costar más', 'Revisamos si de verdad quedas mejor'] },
    { id: 'total', panel: 'opciones',
      titulo: '¿Cómo sé cuánto voy a pagar en total?',
      cuerpo: ['Te ayudamos a mirar el panorama completo: cuota, plazo, costo total y descuentos. Lo importante no es solo cuánto recibes, sino cuánto pagas y por cuánto tiempo.'],
      puntos: ['Cuota, plazo, costo total y descuentos, juntos', 'No solo cuánto recibes: cuánto pagas y por cuánto tiempo', 'Te lo explicamos antes de que firmes'] },

    { id: 'despues', panel: 'acompanamos',
      titulo: '¿Qué pasa después de que les escribo?',
      cuerpo: ['Te orientamos, entendemos tu perfil y, cuando corresponde, hacemos el preanálisis. Con eso te decimos si vale la pena avanzar o si es mejor no hacerlo porque no te conviene.'],
      puntos: ['Primero te orientamos y entendemos tu perfil', 'Luego el preanálisis, si corresponde', 'Te decimos si vale la pena avanzar… o no'] },
    { id: 'pais', panel: 'acompanamos',
      titulo: '¿Atienden en todo el país o solo en Cúcuta?',
      cuerpo: ['Tenemos oficina en Cúcuta y atendemos a todo el país de forma virtual por WhatsApp. Si estás en otra ciudad, te atendemos virtualmente. Escríbenos y coordinamos.'],
      puntos: ['Oficina en Cúcuta, C.C. International', 'Todo el país por WhatsApp', 'Presencial si estás en Cúcuta y lo prefieres'] },
    { id: 'seguro', panel: 'acompanamos',
      titulo: '¿Es seguro darles mi información?',
      cuerpo: ['Sí. Pedimos solo lo indispensable y no compartimos tu información con terceros ajenos al proceso. Los datos sensibles, si algún día se requieren, los gestiona el equipo humano en el momento adecuado.'],
      puntos: ['Solo lo indispensable', 'No se comparte con terceros ajenos al proceso', 'Lo sensible lo maneja una persona, en el momento adecuado'] }
  ];

  var modal = document.querySelector('.faq-modal');
  if (!modal || typeof modal.showModal !== 'function') return;

  var rail = modal.querySelector('.faq-modal__rail');
  var shot = modal.querySelector('.faq-modal__shot img');
  var h3 = modal.querySelector('.faq-modal__body h3');
  var cuerpo = modal.querySelector('.faq-modal__texto');
  var pasos = modal.querySelector('.faq-modal__pasos');
  var origen = null;

  // Carril izquierdo: todas las preguntas agrupadas por panel
  PANELES.forEach(function (p) {
    var h4 = document.createElement('h4'); h4.textContent = p.titulo; rail.appendChild(h4);
    PREGUNTAS.filter(function (q) { return q.panel === p.id; }).forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = q.titulo; b.dataset.q = q.id;
      b.addEventListener('click', function () { mostrar(q.id); });
      rail.appendChild(b);
    });
  });

  function mostrar(id) {
    var q = PREGUNTAS.filter(function (x) { return x.id === id; })[0];
    if (!q) return;
    var p = PANELES.filter(function (x) { return x.id === q.panel; })[0];
    shot.src = p.foto; shot.alt = '';
    h3.textContent = q.titulo;
    cuerpo.innerHTML = '';
    q.cuerpo.forEach(function (t) { var el = document.createElement('p'); el.textContent = t; cuerpo.appendChild(el); });
    pasos.innerHTML = '';
    q.puntos.forEach(function (t, i) {
      var li = document.createElement('li'); var n = document.createElement('i'); n.textContent = i + 1;
      li.appendChild(n); li.appendChild(document.createTextNode(t)); pasos.appendChild(li);
    });
    Array.prototype.forEach.call(rail.querySelectorAll('button'), function (b) {
      b.classList.toggle('is-active', b.dataset.q === id);
    });
    modal.scrollTop = 0;
  }

  function abrir(id, desde) {
    origen = desde || null;
    mostrar(id);
    if (!modal.open) modal.showModal();
    document.documentElement.classList.add('modal-abierto');
  }
  function cerrar() {
    if (modal.open) modal.close();
  }
  modal.addEventListener('close', function () {
    document.documentElement.classList.remove('modal-abierto');
    if (origen && origen.focus) origen.focus();
  });
  modal.querySelector('.faq-modal__close').addEventListener('click', cerrar);
  modal.addEventListener('click', function (e) {
    // clic fuera de la tarjeta y fuera del carril
    if (e.target === modal || e.target.classList.contains('faq-modal__wrap')) cerrar();
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-pregunta]'), function (btn) {
    btn.addEventListener('click', function () { abrir(btn.getAttribute('data-pregunta'), btn); });
  });
})();
