/* ===================================================================
   CrediAyudarte — Formulario de solicitud (versión 2026-10)
   Al enviar:
   1) registra la solicitud en el CRM (n8n -> Supabase), sin bloquear;
   2) abre WhatsApp con el mensaje armado con lo que escribió la persona;
   3) muestra "Falta un paso: envía el mensaje en WhatsApp" (nunca un
      "solicitud recibida": la conversación empieza cuando ella lo envía).
   Ya no se piden edad ni archivos: el desprendible se solicita después,
   por WhatsApp, solo si el caso lo necesita.
   =================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '573152474348'; // número de CrediAyudarte
  var LEAD_WEBHOOK = 'https://flujos.crediayudarte.co/webhook/landing-lead-score'; // n8n -> Supabase (lead + scoring)
  var VERSION = 'form-2026-10';
  var AUTORIZACION = 'Autorizo a Marilú Arévalo Toro (CrediAyudarte) a tratar mis datos para contactarme por WhatsApp y estudiar mi solicitud; si avanzo, podrán compartirse con entidades o financiadores que estudien mi caso, con mi autorización. Política: crediayudarte.com/privacy/';

  var form = document.getElementById('creditForm');
  var errorBox = document.getElementById('formError');
  var next = document.getElementById('formNext');
  var nextLink = document.getElementById('formNextLink');
  if (!form) return;

  function medir(ev, datos) { if (typeof window.caMedir === 'function') window.caMedir(ev, datos); }

  var formStarted = false;
  form.addEventListener('focusin', function () {
    if (formStarted) return;
    formStarted = true;
    medir('form_start', { ubicacion: 'solicitar' });
  });

  form.addEventListener('input', hideError);
  form.addEventListener('change', hideError);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var perfil = checked('perfil');
    var pagaduria = val('pagaduria');
    var ciudad = val('ciudad');
    var objetivo = val('objetivo');
    var situacion = checked('situacion');
    var nombre = val('nombre');
    var telefono = val('telefono');
    var autorizo = document.getElementById('autorizo');

    // En orden de aparición: el foco va al primer campo que falta
    var faltan = [
      [!perfil, 'tu perfil', form.querySelector('input[name="perfil"]')],
      [!pagaduria, 'tu pagaduría', document.getElementById('pagaduria')],
      [!ciudad, 'tu ciudad', document.getElementById('ciudad')],
      [!objetivo, 'qué necesitas', document.getElementById('objetivo')],
      [!situacion, 'tu situación', form.querySelector('input[name="situacion"]')],
      [!nombre, 'tu nombre', document.getElementById('nombre')],
      [!telefono, 'tu número de WhatsApp', document.getElementById('telefono')]
    ].filter(function (f) { return f[0]; });
    if (faltan.length) {
      showError('Falta completar: ' + faltan.map(function (f) { return f[1]; }).join(', ') + '.', faltan[0][2]);
      return;
    }
    // El número es la llave con la que el CRM une el lead web y la
    // conversación de WhatsApp posterior. Celular colombiano de 10 dígitos, o
    // un número internacional escrito con "+" (p. ej. familiares en el exterior).
    var telDigits = telefono.replace(/[^0-9]/g, '');
    var internacional = /^\s*\+/.test(telefono) && !/^573\d{9}$/.test(telDigits);
    if (!internacional) telDigits = telDigits.replace(/^57(?=3\d{9}$)/, '');
    if (internacional ? !/^\d{8,15}$/.test(telDigits) : !/^3\d{9}$/.test(telDigits)) {
      showError('Escribe un celular de WhatsApp válido: 10 dígitos que empiezan por 3, o el número con "+" y el indicativo del país.', document.getElementById('telefono'));
      return;
    }
    if (!autorizo || !autorizo.checked) {
      showError('Para continuar necesitamos tu autorización para tratar tus datos.', autorizo);
      return;
    }

    hideError();
    var origen = typeof window.caOrigen === 'function' ? window.caOrigen() : {};

    // 1) Solicitud -> n8n -> Supabase (no bloquea). Se conservan las claves que
    //    ya recibía el flujo (nombre, nombres, apellido, edad, telefono, perfil,
    //    vida_crediticia, tiene_desprendible, origen) y se agregan las nuevas.
    try {
      fetch(LEAD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          nombres: nombre,
          apellido: '',
          edad: null,
          telefono: telDigits,
          perfil: perfil,
          vida_crediticia: vidaCrediticia(situacion),
          tiene_desprendible: false,
          origen: 'landing-web',
          pagaduria: pagaduria,
          ciudad: ciudad,
          objetivo: objetivo,
          situacion: situacion,
          autorizacion_datos: true,
          autorizacion_texto: AUTORIZACION,
          autorizacion_fecha: new Date().toISOString(),
          formulario_version: VERSION,
          utm_source: origen.utm_source || '',
          utm_medium: origen.utm_medium || '',
          utm_campaign: origen.utm_campaign || '',
          utm_content: origen.utm_content || '',
          utm_term: origen.utm_term || '',
          pagina_entrada: origen.landing || '',
          referrer: origen.referrer || ''
        }),
        keepalive: true
      }).catch(function () {});
    } catch (err) { /* no bloquear la experiencia si falla el envío */ }
    medir('form_submit', { ubicacion: 'solicitar' });

    // 2) Mensaje de WhatsApp con lo que escribió la persona
    var lineas = [
      'Hola, CrediAyudarte. Quiero que evalúen mi caso.',
      '',
      'Nombre: ' + nombre,
      'Perfil: ' + perfil,
      'Pagaduría: ' + pagaduria,
      'Ciudad: ' + ciudad,
      'Necesito: ' + objetivo,
      'Situación: ' + situacion,
      '',
      'Envié mis datos desde el formulario de la página web.'
    ];
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lineas.join('\n'));

    // 3) Abrir WhatsApp. En pestaña nueva la página queda para recordar el
    //    paso que falta; si el navegador lo bloquea, se navega en la misma.
    var w = null;
    try { w = window.open(url, '_blank'); } catch (err) { w = null; }
    if (w) { try { w.opener = null; } catch (err) { /* nada */ } }
    medir('whatsapp_open_form', { ubicacion: 'solicitar' });
    if (nextLink) nextLink.href = url;
    if (next) { next.hidden = false; next.focus(); }
    if (!w) window.location.href = url;
  });

  // Equivalencia con los valores que ya entendía el CRM ("Bien/Mal reportado")
  function vidaCrediticia(s) {
    if (s === 'Buen historial') return 'Bien reportado';
    if (s === 'Tengo reportes o mora' || s === 'Tengo embargo') return 'Mal reportado';
    return s;
  }

  /* ---------- helpers ---------- */
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function checked(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function showError(msg, field) {
    if (errorBox) { errorBox.textContent = msg; errorBox.classList.add('is-visible'); }
    if (field && field.focus) field.focus();
  }
  function hideError() { if (errorBox) errorBox.classList.remove('is-visible'); }
})();
