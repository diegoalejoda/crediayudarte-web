/* ===================================================================
   CrediAyudarte — Formulario de solicitud -> abre WhatsApp con los datos
   El desprendible NO se sube aquí: se adjunta en el chat privado de WhatsApp.
   =================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '573152474348'; // número de CrediAyudarte

  var form = document.getElementById('creditForm');
  var errorBox = document.getElementById('formError');
  if (!form) return;

  /* ---------- Desprendible (adjunto local, opcional) ---------- */
  var fileInput = document.getElementById('desprendible');
  var dropzone = document.getElementById('dropzone');
  var preview = document.getElementById('dropPreview');
  var thumb = document.getElementById('dropThumb');
  var nameEl = document.getElementById('dropName');
  var sizeEl = document.getElementById('dropSize');
  var removeBtn = document.getElementById('dropRemove');
  var hasFile = false;

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function showFile(file) {
    hasFile = true;
    nameEl.textContent = file.name;
    sizeEl.textContent = humanSize(file.size) + ' · listo para enviar en WhatsApp';
    // miniatura si es imagen
    thumb.innerHTML = '';
    if (file.type && file.type.indexOf('image/') === 0) {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = 'Vista previa del desprendible';
      img.onload = function () { URL.revokeObjectURL(img.src); };
      thumb.appendChild(img);
    } else {
      var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', file.type.indexOf('video/') === 0 ? '#i-video' : '#i-file');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'ico');
      svg.appendChild(use);
      thumb.appendChild(svg);
    }
    if (dropzone) dropzone.hidden = true;
    if (preview) preview.hidden = false;
  }

  function clearFile() {
    hasFile = false;
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

  // Arrastrar y soltar
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

  /* ---------- Envío -> WhatsApp ---------- */
  form.addEventListener('input', hideError);
  form.addEventListener('change', hideError);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre = val('nombre');
    var apellido = val('apellido');
    var edad = val('edad');
    var perfil = checked('perfil');
    var reporte = checked('reporte');

    if (!nombre || !apellido || !edad || !perfil || !reporte) {
      showError('Por favor completa todos los campos obligatorios (*) para continuar.');
      return;
    }
    var edadNum = parseInt(edad, 10);
    if (isNaN(edadNum) || edadNum < 18 || edadNum > 100) {
      showError('Por favor escribe una edad válida (entre 18 y 100 años).');
      document.getElementById('edad').focus();
      return;
    }

    var lineas = [
      '¡Hola CrediAyudarte! Quiero que revisen mi caso 🙂',
      '',
      '👤 Nombre: ' + nombre + ' ' + apellido,
      '🎂 Edad: ' + edadNum + ' años',
      '💼 Situación: ' + perfil,
      '📊 En centrales de riesgo: ' + reporte
    ];
    if (hasFile) {
      lineas.push('📎 Tengo mi desprendible listo para enviar por aquí.');
    }
    lineas.push('', 'Quedo atento(a) a su orientación. ¡Gracias!');

    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lineas.join('\n'));

    if (hasFile) showToast();

    var btn = form.querySelector('.btn-submit');
    if (btn) { btn.style.pointerEvents = 'none'; btn.style.opacity = '.85'; btn.innerHTML = 'Abriendo WhatsApp…'; }

    // pequeño respiro para que se vea el toast antes de saltar a WhatsApp
    setTimeout(function () { window.location.href = url; }, hasFile ? 900 : 0);

    setTimeout(function () {
      if (btn) { btn.style.pointerEvents = ''; btn.style.opacity = ''; btn.innerHTML = '<svg class="ico solid"><use href="#i-whatsapp"/></svg> Enviar por WhatsApp'; }
    }, 3000);
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
