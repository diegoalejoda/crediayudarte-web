/* ===================================================================
   CrediAyudarte — Formulario de solicitud (versión 2026-11)
   Campos: nombre, edad, perfil (pensionado / empleado del gobierno),
   reporte y "¿tienes tu desprendible?" (si dice Sí, se adjunta el archivo).
   El número de WhatsApp no se pregunta: el flujo lo toma cuando la persona
   envía el mensaje. Para unir el registro web, el desprendible y la
   conversación, cada solicitud lleva un código (solicitud_id) que va en el
   registro, en el envío del documento y en el mensaje de WhatsApp.
   Al enviar:
   1) registra la solicitud en el CRM (n8n -> Supabase), sin bloquear;
   2) abre WhatsApp en una pestaña nueva con el mensaje armado;
   3) si adjuntó el desprendible, lo sube (n8n -> Drive + Supabase) desde
      esta página, que queda abierta mostrando el estado de la subida;
   4) muestra "Falta un paso: envía el mensaje en WhatsApp".
   Sin casilla de autorización (pedido del dueño, 2026-11-13): el aviso bajo
   el botón informa que al enviar se aceptan el tratamiento y la política.
   =================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '573152474348'; // número de CrediAyudarte
  var LEAD_WEBHOOK = 'https://flujos.crediayudarte.co/webhook/landing-lead-score'; // n8n -> Supabase (lead + scoring)
  var DOC_WEBHOOK = 'https://flujos.crediayudarte.co/webhook/landing-desprendible-web'; // n8n -> Drive + Supabase (documento)
  var VERSION = 'form-2026-11';
  var MAX_MB = 10;
  var ESPERA_DOC_MS = 12000; // solo si el navegador no deja abrir otra pestaña
  var AVISO = 'Al enviar, la persona acepta que CrediAyudarte use estos datos (y el desprendible, si lo adjunta) para contactarla por WhatsApp y estudiar su caso. Política: crediayudarte.com/privacy/';

  var form = document.getElementById('creditForm');
  var errorBox = document.getElementById('formError');
  var next = document.getElementById('formNext');
  var nextLink = document.getElementById('formNextLink');
  var docEstado = document.getElementById('docEstado');
  if (!form) return;

  // Perfil preseleccionado cuando se llega desde la página de un perfil
  // (solicitar.html?perfil=pensionado|empleado)
  try {
    var pre = { pensionado: 'Pensionado', empleado: 'Empleado público' }[new URLSearchParams(location.search).get('perfil')];
    var radio = pre && form.querySelector('input[name="perfil"][value="' + pre + '"]');
    if (radio) radio.checked = true;
  } catch (err) { /* navegadores sin URLSearchParams: no se preselecciona */ }

  function medir(ev, datos) { if (typeof window.caMedir === 'function') window.caMedir(ev, datos); }

  // Los botones flotantes se esconden mientras el formulario está en pantalla
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle('form-a-la-vista', entries[0].isIntersecting);
    }, { threshold: 0.05 }).observe(form);
  }

  var formStarted = false;
  form.addEventListener('focusin', function () {
    if (formStarted) return;
    formStarted = true;
    medir('form_start', { ubicacion: 'solicitar' });
  });

  form.addEventListener('input', hideError);
  form.addEventListener('change', function (e) { if (e.target.type !== 'file') hideError(); });

  /* ---------- Desprendible: Sí abre la caja para adjuntar; No la cierra ---------- */
  var panel = document.getElementById('uploadPanel');
  var fileInput = document.getElementById('archivoDesprendible');
  var dropzone = document.getElementById('dropzone');
  var preview = document.getElementById('dropPreview');
  var thumb = document.getElementById('dropThumb');
  var nameEl = document.getElementById('dropName');
  var sizeEl = document.getElementById('dropSize');
  var removeBtn = document.getElementById('dropRemove');
  var archivo = null;

  Array.prototype.forEach.call(form.querySelectorAll('input[name="desprendible"]'), function (r) {
    r.addEventListener('change', function () {
      var si = checked('desprendible') === 'Sí';
      if (panel) panel.hidden = !si;
      if (!si) quitarArchivo();
    });
  });

  function tamano(b) { return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }

  function elegirArchivo(f) {
    if (!f) return;
    var tipoOk = /^image\//.test(f.type) || f.type === 'application/pdf' || /\.(pdf|jpe?g|png|heic|webp)$/i.test(f.name);
    if (!tipoOk) { quitarArchivo(); showError('El desprendible debe ser una foto o un PDF.', dropzone); return; }
    if (f.size > MAX_MB * 1048576) { quitarArchivo(); showError('El archivo pesa más de ' + MAX_MB + ' MB. Toma una foto más liviana o envíalo después por WhatsApp.', dropzone); return; }
    hideError();
    archivo = f;
    nameEl.textContent = f.name;
    sizeEl.textContent = tamano(f.size) + ' · listo para enviar';
    thumb.innerHTML = '';
    if (/^image\/(jpeg|png|webp|gif)$/.test(f.type)) {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover';
      img.onload = function () { URL.revokeObjectURL(img.src); };
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-file"/></svg>';
    }
    if (dropzone) dropzone.hidden = true;
    if (preview) preview.hidden = false;
  }

  function quitarArchivo() {
    archivo = null;
    if (fileInput) fileInput.value = '';
    if (preview) preview.hidden = true;
    if (dropzone) dropzone.hidden = false;
  }

  if (fileInput) fileInput.addEventListener('change', function () { elegirArchivo(fileInput.files && fileInput.files[0]); });
  if (removeBtn) removeBtn.addEventListener('click', function () { quitarArchivo(); if (fileInput) fileInput.focus(); });
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add('is-drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove('is-drag'); });
    });
    dropzone.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      elegirArchivo(f);
    });
  }

  function aBase64(f) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(r.result); };
      r.onerror = mal;
      r.readAsDataURL(f);
    });
  }

  /* ---------- Envío ---------- */
  var ultimoEnvio = '', ultimoId = '', docSubido = ''; // evita registrar o subir dos veces lo mismo

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre = val('nombre');
    var edadTxt = val('edad');
    var perfil = checked('perfil');
    var situacion = checked('situacion');
    var desprendible = checked('desprendible');

    // En orden de aparición: el foco va al primer campo que falta
    var faltan = [
      [!nombre, 'tu nombre', document.getElementById('nombre')],
      [!edadTxt, 'tu edad', document.getElementById('edad')],
      [!perfil, 'si eres pensionado o empleado del gobierno', form.querySelector('input[name="perfil"]')],
      [!situacion, 'cómo está tu reporte', form.querySelector('input[name="situacion"]')],
      [!desprendible, 'si tienes tu desprendible', form.querySelector('input[name="desprendible"]')]
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
    var conArchivo = desprendible === 'Sí';
    if (conArchivo && !archivo) {
      showError('Adjunta la foto o el PDF de tu desprendible, o marca "No" si no lo tienes a la mano.', fileInput || dropzone);
      return;
    }

    hideError();
    var origen = typeof window.caOrigen === 'function' ? window.caOrigen() : {};
    var trampa = val('sitio_web'); // campo invisible: si llega con texto, es un robot

    // Mismo contenido enviado otra vez: se reabre WhatsApp sin duplicar el registro
    var huella = [nombre, edad, perfil, situacion, desprendible].join('|');
    var repetido = huella === ultimoEnvio;
    ultimoEnvio = huella;
    var id = repetido && ultimoId ? ultimoId : nuevoId();
    ultimoId = id;
    var btn = form.querySelector('.btn-submit');
    if (btn) {
      btn.setAttribute('aria-busy', 'true');
      setTimeout(function () { btn.removeAttribute('aria-busy'); }, 2500);
    }

    // 1) Solicitud -> n8n -> Supabase (no bloquea). Se conservan las claves que
    //    ya recibía el flujo y se agregan las nuevas.
    if (!trampa && !repetido) try {
      fetch(LEAD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitud_id: id,
          nombre: nombre,
          nombres: nombre,
          apellido: '',
          edad: edad,
          telefono: '', // lo toma el flujo de WhatsApp
          perfil: perfil,
          vida_crediticia: vidaCrediticia(situacion),
          tiene_desprendible: conArchivo,
          origen: 'landing-web',
          pagaduria: '',
          ciudad: '',
          objetivo: '',
          situacion: situacion,
          autorizacion_datos: true,
          autorizacion_modo: 'aviso-al-enviar',
          autorizacion_texto: AVISO,
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

    // 2) Mensaje de WhatsApp con lo que escribió la persona y su código
    var lineas = [
      'Hola, CrediAyudarte. Quiero que evalúen mi caso.',
      '',
      'Nombre: ' + nombre,
      'Edad: ' + edad + ' años',
      'Perfil: ' + (perfil === 'Empleado público' ? 'Empleado(a) del gobierno' : 'Pensionado(a)'),
      'Reporte: ' + situacion,
      'Desprendible: ' + (conArchivo ? 'lo adjunté en el formulario' : 'no lo tengo a la mano'),
      '',
      'Código de solicitud: ' + id
    ];
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lineas.join('\n'));

    // 3) Abrir WhatsApp en pestaña nueva (debe ser en el mismo toque, o el
    //    navegador lo bloquea). Esta página queda abierta para subir el archivo.
    var w = null;
    try { w = window.open(url, '_blank'); } catch (err) { w = null; }
    if (w) { try { w.opener = null; } catch (err) { /* nada */ } }
    medir('whatsapp_open_form', { ubicacion: 'solicitar' });
    if (nextLink) nextLink.href = url;
    if (next) { next.hidden = false; next.focus(); }

    // 4) Subir el desprendible (una sola vez por archivo)
    var claveDoc = archivo ? id + '|' + archivo.name + '|' + archivo.size : '';
    var subida = Promise.resolve();
    if (conArchivo && archivo && !trampa && claveDoc !== docSubido) {
      docSubido = claveDoc;
      estado('subiendo', 'Subiendo tu desprendible… no cierres esta página.');
      var f = archivo;
      subida = aBase64(f).then(function (b64) {
        return fetch(DOC_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            solicitud_id: id,
            numero: '', // lo toma el flujo de WhatsApp
            nombres: nombre,
            apellidos: '',
            edad: edad,
            perfil: perfil,
            vida_crediticia: vidaCrediticia(situacion),
            origen: 'landing-web',
            formulario_version: VERSION,
            documento_nombre: f.name,
            documento_tipo: f.type || 'application/octet-stream',
            documento_base64: b64
          })
        });
      }).then(function (r) {
        if (!r || !r.ok) throw new Error('subida');
        estado('ok', 'Desprendible recibido.');
        medir('desprendible_subido', { ubicacion: 'solicitar' });
      }).catch(function () {
        docSubido = '';
        estado('error', 'No se pudo subir el desprendible. Envíalo como foto en el chat de WhatsApp.');
      });
    }

    // Si el navegador no dejó abrir otra pestaña, se va a WhatsApp en esta
    // (esperando primero a que termine la subida, con un tope de tiempo)
    if (!w) {
      Promise.race([subida, new Promise(function (ok) { setTimeout(ok, ESPERA_DOC_MS); })])
        .then(function () { window.location.href = url; });
    }
  });

  // Equivalencia con los valores que ya entendía el CRM ("Bien/Mal reportado")
  function vidaCrediticia(s) {
    if (s === 'Buen reporte') return 'Bien reportado';
    if (s === 'Mal reporte') return 'Mal reportado';
    return s;
  }

  function nuevoId() {
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    var r = window.crypto && window.crypto.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(6)) : null;
    for (var i = 0; i < 6; i++) s += c[(r ? r[i] : Math.floor(Math.random() * 256)) % c.length];
    return 'CA-' + s;
  }

  function estado(tipo, texto) {
    if (!docEstado) return;
    docEstado.hidden = false;
    docEstado.className = 'doc-estado doc-estado--' + tipo;
    docEstado.textContent = texto;
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
