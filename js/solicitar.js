/* ===================================================================
   CrediAyudarte — Formulario de solicitud -> abre WhatsApp con los datos
   =================================================================== */
(function () {
  'use strict';

  var WHATSAPP = '573152474348'; // número de CrediAyudarte

  var form = document.getElementById('creditForm');
  var errorBox = document.getElementById('formError');
  if (!form) return;

  // Quitar el mensaje de error apenas el usuario interactúa
  form.addEventListener('input', function () { hideError(); });
  form.addEventListener('change', function () { hideError(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nombre = val('nombre');
    var apellido = val('apellido');
    var edad = val('edad');
    var perfil = checked('perfil');
    var reporte = checked('reporte');

    // Validación
    if (!nombre || !apellido || !edad || !perfil || !reporte) {
      showError('Por favor completa todos los campos para continuar.');
      return;
    }
    var edadNum = parseInt(edad, 10);
    if (isNaN(edadNum) || edadNum < 18 || edadNum > 100) {
      showError('Por favor escribe una edad válida (entre 18 y 100 años).');
      document.getElementById('edad').focus();
      return;
    }

    // Armar el mensaje que se autocompleta en WhatsApp
    var lineas = [
      '¡Hola CrediAyudarte! Quiero que revisen mi caso 🙂',
      '',
      '👤 Nombre: ' + nombre + ' ' + apellido,
      '🎂 Edad: ' + edadNum + ' años',
      '💼 Situación: ' + perfil,
      '📊 En centrales de riesgo: ' + reporte,
      '',
      'Quedo atento(a) a su orientación. ¡Gracias!'
    ];
    var mensaje = lineas.join('\n');
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensaje);

    // Feedback breve en el botón antes de abrir WhatsApp
    var btn = form.querySelector('.btn-submit');
    if (btn) {
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '.85';
      btn.innerHTML = 'Abriendo WhatsApp…';
    }

    // Abrir WhatsApp (misma pestaña funciona mejor en móvil)
    window.location.href = url;

    // Restaurar el botón por si el usuario vuelve
    setTimeout(function () {
      if (btn) {
        btn.style.pointerEvents = '';
        btn.style.opacity = '';
        btn.innerHTML = '<svg class="ico ico-wa"><use href="#i-whatsapp"/></svg> Enviar por WhatsApp';
      }
    }, 2500);
  });

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }
  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }
  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.add('is-visible');
  }
  function hideError() {
    if (errorBox) errorBox.classList.remove('is-visible');
  }
})();
