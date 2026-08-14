/* ===================================================================
   CrediAyudarte — Video de presentación en la página de solicitud
   Arranca solo al entrar. Los navegadores bloquean el sonido si el
   cliente todavía no ha tocado nada, así que: intentamos con audio,
   caemos a silencio + aviso grande, y lo activamos con el primer
   toque en la página. Ese toque global vale una sola vez; después,
   pausar y reanudar es hacer clic sobre el video.
   Al bajar al formulario el video se encoge a una ventanita para que
   lo siga viendo mientras escribe sus datos.
   =================================================================== */
(function () {
  'use strict';

  var fig = document.getElementById('vpitch');
  var video = document.getElementById('pitchVideo');
  if (!fig || !video) return;

  var slot = document.getElementById('vpitchSlot');
  var soundCta = document.getElementById('vpitchSound');
  var playBtn = document.getElementById('vpitchPlay');
  var muteBtn = document.getElementById('vpitchMute');
  var track = document.getElementById('vpitchTrack');
  var bar = document.getElementById('vpitchBar');
  var timeEl = document.getElementById('vpitchTime');
  var endCard = document.getElementById('vpitchEnd');
  var replayBtn = document.getElementById('vpitchReplay');
  var toFormBtn = document.getElementById('vpitchToForm');
  var closeBtn = document.getElementById('vpitchClose');

  var silencedByUser = false; // el cliente bajó el sonido a propósito
  var pausedByUser = false;   // el cliente pausó a propósito
  var dismissed = false;      // cerró la ventanita
  var finished = false;
  var sonidoListo = false;    // el sonido ya está sonando de verdad
  var sonidoEn = 0;           // cuándo se activó el sonido (para no pausar con ese mismo toque)

  /* ---- Si el cliente navega con ahorro de datos, versión ligera ---- */
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData || /^(slow-)?2g$/.test(conn.effectiveType || ''))) {
    video.src = 'assets/video/mensaje-sd.mp4';
    video.load();
  }

  /* ---- 1. Arranque ----------------------------------------------
     Los navegadores viejos no devuelven promesa desde play(), y los
     nuevos a veces "aceptan" el play con sonido y pausan el video un
     instante después. Por eso nunca damos por hecho el resultado:
     siempre confirmamos mirando el estado real del reproductor.     */
  function reproducir() {
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function sonando() { return !video.muted && !video.paused; }

  function mostrarAviso(v) { if (soundCta) soundCta.hidden = !v; }

  // Plan B: que al menos se vea, aunque sea sin sonido (trae subtítulos)
  function arrancarSilencioso() {
    video.muted = true;
    syncMuteBtn();
    reproducir();
    mostrarAviso(!silencedByUser);
  }

  // Único juez de si el sonido quedó activo de verdad
  function confirmar() {
    if (silencedByUser || finished) { mostrarAviso(false); return; }
    if (sonando()) {
      sonidoListo = true;
      mostrarAviso(false);
      quitarGestos();
    } else if (!pausedByUser) {
      arrancarSilencioso();
    }
    syncMuteBtn();
  }

  video.muted = false;
  video.volume = 1;
  reproducir();
  setTimeout(confirmar, 400);

  /* ---- 2. El primer toque en la página, y solo ese ----------------
     Un único toque en cualquier parte arranca el video con sonido.
     Después de ese toque soltamos los escuchas para siempre: el resto
     de la página deja de mandar sobre el video, y para pausarlo o
     reanudarlo hay que hacer clic sobre el video mismo. */
  var GESTOS = ['pointerdown', 'touchend', 'click', 'keydown'];
  var globalUsado = false;

  function alPrimerToque() {
    if (globalUsado) return;
    globalUsado = true;
    quitarGestos(); // una sola oportunidad, pase lo que pase
    if (silencedByUser || finished || sonidoListo) return;
    activarSonido();
  }
  function quitarGestos() {
    GESTOS.forEach(function (ev) { document.removeEventListener(ev, alPrimerToque, true); });
  }
  GESTOS.forEach(function (ev) { document.addEventListener(ev, alPrimerToque, true); });

  function activarSonido() {
    silencedByUser = false;
    sonidoEn = Date.now();
    video.muted = false;
    video.volume = 1;
    if (!pausedByUser) reproducir();
    mostrarAviso(false);
    syncMuteBtn();
    setTimeout(confirmar, 250);
  }

  if (soundCta) {
    soundCta.addEventListener('click', function (e) {
      e.stopPropagation();
      activarSonido();
    });
  }

  /* ---- 3. Controles ---- */
  function syncMuteBtn() {
    if (!muteBtn) return;
    var use = muteBtn.querySelector('use');
    if (use) use.setAttribute('href', video.muted ? '#i-volume-x' : '#i-volume');
    muteBtn.setAttribute('aria-label', video.muted ? 'Activar el sonido' : 'Silenciar el video');
    fig.classList.toggle('is-muted', video.muted);
  }

  function syncPlayBtn() {
    if (!playBtn) return;
    var use = playBtn.querySelector('use');
    if (use) use.setAttribute('href', video.paused ? '#i-play' : '#i-pause');
    playBtn.setAttribute('aria-label', video.paused ? 'Reproducir el video' : 'Pausar el video');
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (video.muted) {
        activarSonido();
      } else {
        silencedByUser = true;
        sonidoListo = false;
        video.muted = true;
        mostrarAviso(false);
        syncMuteBtn();
      }
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      alternarPlay();
    });
  }

  function alternarPlay() {
    if (video.paused) {
      pausedByUser = false;
      if (finished) reiniciar();
      else reproducir();
    } else {
      pausedByUser = true;
      video.pause();
    }
    syncPlayBtn();
  }

  video.addEventListener('click', function () {
    // Si ese mismo toque fue el que activó el sonido, no lo pausamos también.
    if (Date.now() - sonidoEn < 500) return;
    alternarPlay();
  });
  video.addEventListener('play', function () { finished = false; syncPlayBtn(); });
  video.addEventListener('pause', syncPlayBtn);

  // barra de avance + cuánto falta
  function mmss(seg) {
    seg = Math.max(0, Math.round(seg));
    var m = Math.floor(seg / 60);
    var s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  video.addEventListener('timeupdate', function () {
    if (!video.duration) return;
    var pct = (video.currentTime / video.duration) * 100;
    if (bar) bar.style.width = pct + '%';
    if (track) track.setAttribute('aria-valuenow', Math.round(pct));
    if (timeEl) timeEl.textContent = mmss(video.duration - video.currentTime);
  });

  // saltar tocando la barra
  if (track) {
    track.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!video.duration) return;
      var r = track.getBoundingClientRect();
      video.currentTime = ((e.clientX - r.left) / r.width) * video.duration;
    });
  }

  /* ---- 4. Al terminar: invitación a llenar el formulario ---- */
  video.addEventListener('ended', function () {
    finished = true;
    fig.classList.remove('is-mini');
    if (endCard) endCard.hidden = false;
    syncPlayBtn();
  });

  function reiniciar() {
    finished = false;
    pausedByUser = false;
    if (endCard) endCard.hidden = true;
    video.currentTime = 0;
    reproducir();
  }
  if (replayBtn) replayBtn.addEventListener('click', function (e) { e.stopPropagation(); reiniciar(); });

  if (toFormBtn) {
    toFormBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      irAlFormulario();
    });
  }

  function irAlFormulario() {
    var campo = document.getElementById('nombre');
    var card = document.querySelector('.form-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (campo) setTimeout(function () { campo.focus({ preventScroll: true }); }, 600);
  }

  var jump = document.getElementById('pitchJump');
  if (jump) {
    jump.addEventListener('click', function (e) { e.preventDefault(); irAlFormulario(); });
  }

  /* ---- 5. Ventanita flotante al bajar al formulario ---- */
  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dismissed = true;
      fig.classList.remove('is-mini');
      video.pause();
      pausedByUser = true;
    });
  }

  if ('IntersectionObserver' in window && slot) {
    var io = new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      var mini = !visible && !dismissed && !finished && !video.paused;
      fig.classList.toggle('is-mini', mini);
    }, { threshold: 0.35, rootMargin: '-80px 0px 0px 0px' });
    io.observe(slot);
  }

  syncMuteBtn();
  syncPlayBtn();
})();
