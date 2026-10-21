/* ===================================================================
   CrediAyudarte — Medición de conversiones (sin datos personales)
   Un solo punto de entrada: window.caMedir(evento, datos).

   Destinos:
   - window.dataLayer: siempre (sirve a GTM o GA4 el día que se instalen).
   - GA4 (gtag): solo si GA4_ID tiene un ID real. Vacío = no se carga nada.
   - Meta Pixel: solo en las páginas que ya lo cargan (Inicio y Solicitar).

   Eventos y qué significan (no confundir clics con resultados):
   - whatsapp_click ....... clic en un enlace a WhatsApp. NO es una conversación:
                            la persona puede no enviar ningún mensaje.
   - phone_click .......... clic en un enlace tel:.
   - form_start ........... primera interacción con el formulario de /solicitar.
   - form_submit .......... formulario válido y enviado al CRM. Es una solicitud
                            registrada, no un crédito ni un desembolso.
   - whatsapp_open_form ... se abrió WhatsApp con el mensaje del formulario
                            (la persona aún debe tocar "Enviar" allí).
   Conversaciones reales, solicitudes atendidas y créditos desembolsados se
   miden en WhatsApp Business y en el CRM, no aquí.

   NUNCA se envían nombres, teléfonos, cédulas, ingresos, deudas, reportes,
   embargos ni texto libre: solo se aceptan las claves de PERMITIDOS.
   =================================================================== */
(function () {
  'use strict';

  var GA4_ID = ''; // Pendiente: ID de medición de GA4 (formato G-XXXXXXXXXX)
  var PERMITIDOS = { ubicacion: 1, pagina: 1, destino: 1 };
  var META = {
    whatsapp_click: ['trackCustom', 'WhatsAppClick'],
    phone_click: ['trackCustom', 'PhoneClick'],
    form_start: ['trackCustom', 'FormStart'],
    form_submit: ['track', 'Lead'], // mismo evento que ya usaba el formulario
    whatsapp_open_form: ['trackCustom', 'WhatsAppOpenForm']
  };

  window.dataLayer = window.dataLayer || [];

  if (/^G-[A-Z0-9]{6,}$/.test(GA4_ID)) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

  function limpiar(datos) {
    var out = { pagina: location.pathname };
    if (datos) for (var k in datos) if (PERMITIDOS[k] && datos[k] != null) out[k] = String(datos[k]).slice(0, 80);
    return out;
  }

  window.caMedir = function (evento, datos) {
    var d = limpiar(datos);
    try {
      window.dataLayer.push(Object.assign({ event: evento }, d));
      if (typeof window.gtag === 'function' && GA4_ID) window.gtag('event', evento, d);
      var m = META[evento];
      if (m && typeof window.fbq === 'function') {
        if (m[0] === 'track') window.fbq('track', m[1]);
        else window.fbq('trackCustom', m[1], { ubicacion: d.ubicacion || '' });
      }
    } catch (e) { /* la medición nunca debe romper la página */ }
  };

  /* ---- Origen de la visita: UTM de la primera página de la sesión ----
     Solo para adjuntarlo a la solicitud del CRM (saber si vino de Google
     Business Profile, de orgánico o de una campaña). No va a la analítica. */
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  try {
    if (!sessionStorage.getItem('ca-origen')) {
      var q = new URLSearchParams(location.search), o = {};
      UTM.forEach(function (k) { if (q.get(k)) o[k] = q.get(k).slice(0, 100); });
      o.landing = location.pathname;
      if (document.referrer) { try { o.referrer = new URL(document.referrer).hostname; } catch (e) { /* nada */ } }
      sessionStorage.setItem('ca-origen', JSON.stringify(o));
    }
  } catch (e) { /* sin sessionStorage no hay origen */ }
  window.caOrigen = function () {
    try { return JSON.parse(sessionStorage.getItem('ca-origen') || '{}'); } catch (e) { return {}; }
  };

  /* ---- Clics en WhatsApp y teléfono, en todo el sitio ---- */
  function ubicacion(a) {
    if (a.getAttribute('data-ubic')) return a.getAttribute('data-ubic');
    if (a.closest('.wa-float')) return 'boton-flotante';
    if (a.closest('header')) return 'menu';
    if (a.closest('footer')) return 'pie';
    if (a.closest('form')) return 'formulario';
    var sec = a.closest('section[id], section[class], div.cap');
    return sec ? (sec.id || sec.className.split(' ')[0]) : 'enlace';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) window.caMedir('whatsapp_click', { ubicacion: ubicacion(a) });
    else if (/^tel:/.test(href)) window.caMedir('phone_click', { ubicacion: ubicacion(a) });
  }, true);
})();
