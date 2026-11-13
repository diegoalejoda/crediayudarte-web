/* ===================================================================
   CrediAyudarte — Formulario de solicitud (versión 2026-10)
   Al enviar:
   1) registra la solicitud en el CRM (n8n -> Supabase), sin bloquear;
   2) abre WhatsApp con el mensaje armado con lo que escribió la persona;
   3) muestra "Falta un paso: envía el mensaje en WhatsApp" (nunca un
      "solicitud recibida": la conversación empieza cuando ella lo envía).
   Campos (2026-11): nombre, edad, perfil (pensionado / empleado del
   gobierno) y reporte. El número de WhatsApp no se pregunta: el flujo lo
   toma cuando la persona envía el mensaje (telefono llega vacío al CRM). Sin archivos: el desprendible se solicita
   después, por WhatsApp, solo si el caso lo necesita. Pagaduría, ciudad y
   objetivo ya no se preguntan: el CRM los recibe vacíos.
   =================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '573152474348'; // número de CrediAyudarte
  var LEAD_WEBHOOK = 'https://flujos.crediayudarte.co/webhook/landing-lead-score'; // n8n -> Supabase (lead + scoring)
  var VERSION = 'form-2026-11';
  var AUTORIZACION = 'Autorizo a Marilú Arévalo Toro (CrediAyudarte) a tratar mis datos para contactarme por WhatsApp y estudiar mi solicitud; si avanzo, podrán compartirse con entidades o financiadores que estudien mi caso, con mi autorización. Política: crediayudarte.com/privacy/';

  var form = document.getElementById('creditForm');
  var errorBox = document.getElementById('formError');
  var next = document.getElementById('formNext');
  var nextLink = document.getElementById('formNextLink');
  if (!form) return;

  // Perfil preseleccionado cuando se llega desde la página de un perfil
  // (solicitar.html?perfil=pensionado|empleado)
  try {
    var pre = { pensionado: 'Pensionado', empleado: 'Empleado público' }[new URLSearchParams(location.search).get('perfil')];
    var radio = pre && form.querySelector('input[name="perfil"][value="' + pre + '"]');
    if (radio) radio.checked = true;
  } catch (err) { /* navegadores sin URLSearchParams: no se preselecciona */ }

  function medir(ev, datos) { if (typeof window.caMedir === 'function') window.caMedir(ev, datos); }

  // Los botones flotantes (WhatsApp, volver arriba) se esconden mientras el
  // formulario está en pantalla, para no tapar campos en el celular
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle('form-a-la-vista', entries[0].isIntersecting);
    }, { threshold: 0.05 }).observe(form);
  }

  var formStarted = false;
  var ultimoEnvio = ''; // evita registrar dos veces la misma solicitud en el CRM
  form.addEventListener('focusin', function () {
    if (formStarted) return;
    formStarted = true;
    medir('form_start', { ubicacion: 'solicitar' });
  });

  form.addEventListener('input', hideError);
  form.addEventListener('change', hideError);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre = val('nombre');
    var edadTxt = val('edad');
    var perfil = checked('perfil');
    var situacion = checked('situacion');
    var pagaduria = '', ciudad = '', objetivo = '';
    var autorizo = document.getElementById('autorizo');

    // En orden de aparición: el foco va al primer campo que falta
    var faltan = [
      [!nombre, 'tu nombre', document.getElementById('nombre')],
      [!edadTxt, 'tu edad', document.getElementById('edad')],
      [!perfil, 'si eres pensionado o empleado del gobierno', form.querySelector('input[name="perfil"]')],
      [!situacion, 'cómo está tu reporte', form.querySelector('input[name="situacion"]')]
    ].filter(function (f) { return f[0]; });
    if (faltan.length) {
      showError('Falta completar: ' + faltan.map(function (f) { return f[1]; }).join(', ') + '.', faltan[0][2]);
      return;
    }
    var edad = parseInt(edadTxt.replace(/[^0-9]/g, ''), 10);
    if (!(edad >= 18 && edad <= 100)) {
      showError('Escribe tu edad en años, con números (por ejemplo: 62).', document.getElementById('edad'));
      return;
    }
    if (!autorizo || !autorizo.checked) {
      showError('Para continuar necesitamos tu autorización para tratar tus datos.', autorizo);
      return;
    }

    hideError();
    var origen = typeof window.caOrigen === 'function' ? window.caOrigen() : {};

    // Trampa anti-spam: las personas no ven ese campo; un robot lo llena
    var trampa = val('sitio_web');
    // Mismo contenido enviado otra vez (doble clic, o volver a tocar el botón):
    // solo se reabre WhatsApp, sin duplicar el registro en el CRM
    var huella = [nombre, edad, perfil, situacion].join('|');
    var repetido = huella === ultimoEnvio;
    ultimoEnvio = huella;
    var btn = form.querySelector('.btn-submit');
    if (btn) {
      btn.setAttribute('aria-busy', 'true');
      setTimeout(function () { btn.removeAttribute('aria-busy'); }, 2500);
    }

    // 1) Solicitud -> n8n -> Supabase (no bloquea). Se conservan las claves que
    //    ya recibía el flujo (nombre, nombres, apellido, edad, telefono, perfil,
    //    vida_crediticia, tiene_desprendible, origen) y se agregan las nuevas.
    if (!trampa && !repetido) try {
      fetch(LEAD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          nombres: nombre,
          apellido: '',
          edad: edad,
          telefono: '', // lo toma el flujo de WhatsApp
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
    if (!trampa && !repetido) medir('form_submit', { ubicacion: 'solicitar' });

    // 2) Mensaje de WhatsApp con lo que escribió la persona
    var lineas = [
      'Hola, CrediAyudarte. Quiero que evalúen mi caso.',
      '',
      'Nombre: ' + nombre,
      'Edad: ' + edad + ' años',
      'Perfil: ' + (perfil === 'Empleado público' ? 'Empleado(a) del gobierno' : 'Pensionado(a)'),
      'Reporte: ' + situacion,
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
    if (s === 'Buen reporte') return 'Bien reportado';
    if (s === 'Mal reporte') return 'Mal reportado';
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
