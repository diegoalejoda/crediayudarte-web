/* ===================================================================
   CrediAyudarte — Formulario de solicitud
   Al enviar: abre WhatsApp con los datos escritos por el cliente Y,
   si adjuntó su desprendible, lo sube a Google Drive (vía n8n) y
   guarda el link en Supabase, al mismo tiempo.
   =================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '573152474348'; // número de CrediAyudarte
  var LEAD_WEBHOOK = 'https://flujos.crediayudarte.co/webhook/landing-lead-score'; // n8n -> Supabase (lead + scoring)
  var DOC_WEBHOOK = 'https://flujos.crediayudarte.co/webhook/landing-desprendible-web'; // n8n -> Drive + Supabase (documento)
  var MAX_WAIT_DOC_MS = 4000; // tiempo máximo que esperamos la subida antes de abrir WhatsApp igual

  var form = document.getElementById('creditForm');
  var errorBox = document.getElementById('formError');
  if (!form) return;

  /* ---------- Mostrar/ocultar el panel de subida según Sí/No ---------- */
  var uploadPanel = document.getElementById('uploadPanel');
  var fileInput = document.getElementById('archivoDesprendible');
  var dropzone = document.getElementById('dropzone');
  var preview = document.getElementById('dropPreview');
  var thumb = document.getElementById('dropThumb');
  var nameEl = document.getElementById('dropName');
  var sizeEl = document.getElementById('dropSize');
  var removeBtn = document.getElementById('dropRemove');
  var selectedFile = null;

  form.querySelectorAll('input[name="desprendible"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var quiere = form.querySelector('input[name="desprendible"]:checked');
      var mostrar = quiere && quiere.value === 'Sí';
      if (uploadPanel) uploadPanel.hidden = !mostrar;
      if (!mostrar) clearFile();
    });
  });

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function showFile(file) {
    selectedFile = file;
    nameEl.textContent = file.name;
    sizeEl.textContent = humanSize(file.size) + ' · listo para enviar';
    thumb.innerHTML = '';
    if (file.type && file.type.indexOf('image/') === 0) {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = 'Vista previa del desprendible';
      img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover';
      img.onload = function () { URL.revokeObjectURL(img.src); };
      thumb.appendChild(img);
    } else {
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#i-file');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'ico');
      svg.appendChild(use);
      thumb.appendChild(svg);
    }
    if (dropzone) dropzone.hidden = true;
    if (preview) preview.hidden = false;
  }

  function clearFile() {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    if (preview) preview.hidden = true;
    if (dropzone) dropzone.hidden = false;
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) showFile(fileInput.files[0]);
    });
  }
  if (removeBtn) removeBtn.addEventListener('click', clearFile);

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add('is-drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove('is-drag'); });
    });
    dropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        showFile(e.dataTransfer.files[0]);
      }
    });
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (resolve) { setTimeout(resolve, ms); })
    ]);
  }

  /* ---------- Envío ---------- */
  form.addEventListener('input', hideError);
  form.addEventListener('change', hideError);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre = val('nombre');
    var apellido = val('apellido');
    var edad = val('edad');
    var telefono = val('telefono');
    var perfil = checked('perfil');
    var reporte = checked('reporte');
    var desprendible = checked('desprendible');

    if (!nombre || !apellido || !edad || !telefono || !perfil || !reporte || !desprendible) {
      showError('Por favor completa todos los campos obligatorios (*) para continuar.');
      return;
    }
    var edadNum = parseInt(edad, 10);
    if (isNaN(edadNum) || edadNum < 18 || edadNum > 100) {
      showError('Por favor escribe una edad válida (entre 18 y 100 años).');
      document.getElementById('edad').focus();
      return;
    }
    var telDigits = telefono.replace(/[^0-9]/g, '');
    if (telDigits.length < 7) {
      showError('Por favor escribe un número de WhatsApp válido.');
      document.getElementById('telefono').focus();
      return;
    }
    var tieneFile = desprendible === 'Sí';
    if (tieneFile && !selectedFile) {
      showError('Adjunta tu desprendible o selecciona "No" en la pregunta anterior.');
      return;
    }

    var btn = form.querySelector('.btn-submit');

    // 1) Lead + scoring -> n8n -> Supabase (no bloquea, es texto plano y pequeño)
    try {
      fetch(LEAD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre + ' ' + apellido,
          nombres: nombre,
          apellido: apellido,
          edad: edadNum,
          telefono: telDigits,
          perfil: perfil,
          vida_crediticia: reporte,
          tiene_desprendible: tieneFile,
          origen: 'landing-web'
        }),
        keepalive: true
      }).catch(function () {});
    } catch (err) { /* no bloquear la experiencia si falla el envío */ }

    // 2) Mensaje de WhatsApp con lo que escribió el cliente
    var lineas = [
      '¡Hola CrediAyudarte! Quiero que revisen mi caso 🙂',
      '',
      '👤 Nombre: ' + nombre + ' ' + apellido,
      '🎂 Edad: ' + edadNum + ' años',
      '💼 Situación: ' + perfil,
      '📊 En centrales de riesgo: ' + reporte,
      '📎 Tengo mi desprendible a la mano: ' + desprendible
    ];
    lineas.push('', 'Quedo atento(a) a su orientación. ¡Gracias!');
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lineas.join('\n'));

    function goToWhatsApp() {
      window.location.href = url;
      setTimeout(function () {
        if (btn) { btn.style.pointerEvents = ''; btn.style.opacity = ''; btn.innerHTML = '<svg class="ico solid"><use href="#i-whatsapp"/></svg> Enviar por WhatsApp'; }
      }, 3000);
    }

    if (btn) { btn.style.pointerEvents = 'none'; btn.style.opacity = '.85'; }

    // 3) Si hay desprendible: subirlo (Drive + Supabase) AL MISMO TIEMPO que se abre WhatsApp
    if (tieneFile && selectedFile) {
      if (btn) btn.innerHTML = 'Enviando tu documento…';
      showToast();

      var docPromise = fileToBase64(selectedFile).then(function (base64) {
        return fetch(DOC_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero: telDigits,
            nombres: nombre,
            apellidos: apellido,
            edad: edadNum,
            perfil: perfil,
            vida_crediticia: reporte,
            origen: 'landing-web',
            documento_nombre: selectedFile.name,
            documento_tipo: selectedFile.type || 'application/octet-stream',
            documento_base64: base64
          })
        });
      }).catch(function () { /* si falla, igual dejamos avanzar a WhatsApp */ });

      withTimeout(docPromise, MAX_WAIT_DOC_MS).then(goToWhatsApp);
    } else {
      goToWhatsApp();
    }
  });

  /* ---------- helpers ---------- */
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function checked(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function showError(msg) { if (!errorBox) return; errorBox.textContent = msg; errorBox.classList.add('is-visible'); }
  function hideError() { if (errorBox) errorBox.classList.remove('is-visible'); }

  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast() {
    if (!toast) return;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 6000);
  }
})();
