// Pruebas en Chrome real por CDP: móvil, escritorio, sin JavaScript, formulario
// simulado (sin envíos reales) y capturas.
// Uso: node navegador.js http://localhost:8787 <carpeta de capturas> <salida.json>
// Seguridad: se BLOQUEAN en el navegador el webhook del CRM, Meta y Google, y
// además se sustituyen fetch y window.open: ninguna solicitud sale de la máquina.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2] || 'http://localhost:8787';
const SHOTS = process.argv[3]; const OUT = process.argv[4];
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BLOQUEO = ['*flujos.crediayudarte.co*', '*facebook.net*', '*facebook.com*', '*googletagmanager.com*', '*google-analytics.com*', '*doubleclick.net*'];
const PAGINAS = ['/', '/credito-libranza-cucuta/', '/credito-libranza-pensionados/', '/credito-libranza-reportados/', '/solicitar.html', '/credito-de-libranza/', '/credito-libranza-empleados-publicos/', '/credito-libranza-docentes/', '/credito-libranza-fuerza-publica/', '/credito-libranza-embargos/', '/saneamiento-financiero/', '/compra-de-cartera/', '/testimonios.html', '/about/', '/privacy/', '/blog/', '/blog/que-documentos-piden-para-un-credito-de-libranza.html', '/blog/pagar-una-deuda-antigua-puede-empeorar-tu-historial.html'];
const CAPTURAS = { '/': 'portada', '/credito-libranza-cucuta/': 'cucuta', '/credito-libranza-pensionados/': 'pensionados', '/credito-libranza-reportados/': 'reportados', '/solicitar.html': 'solicitar' };
const MOVIL = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const ESCRITORIO = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function cdp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-chrome-'));
  const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${dir}`, '--no-first-run', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let ver;
  for (let i = 0; i < 50; i++) { try { ver = await (await fetch('http://127.0.0.1:9333/json/version')).json(); break; } catch { await sleep(200); } }
  const tabs = await (await fetch('http://127.0.0.1:9333/json/list')).json();
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}; const oyentes = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } else oyentes.forEach(f => f(m)); };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); }).then(m => { if (m.error) throw new Error(method + ': ' + m.error.message); return m.result; });
  return { send, on: f => oyentes.push(f), close: () => { ws.close(); ch.kill(); } };
}

(async () => {
  const c = await cdp();
  const salientes = []; const errores = [];
  c.on(m => {
    if (m.method === 'Network.requestWillBeSent') { const u = m.params.request.url; if (!u.startsWith(BASE) && !u.startsWith('data:')) salientes.push(u); }
    if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && m.params.entry.url?.startsWith(BASE)) errores.push(m.params.entry.text + ' ' + m.params.entry.url);
  });
  await c.send('Network.enable'); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Page.enable');
  await c.send('Network.setBlockedURLs', { urls: BLOQUEO });
  // Sustituye fetch/open/sendBeacon externos ANTES de que corra cualquier script de la página
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__capturas = [];
    const f0 = window.fetch.bind(window);
    window.fetch = (u, o) => { const s = String(u); if (!s.startsWith(location.origin)) { window.__capturas.push({ tipo: 'fetch', url: s, body: o && o.body }); return Promise.resolve(new Response('{}', { status: 200 })); } return f0(u, o); };
    window.open = (u) => { window.__capturas.push({ tipo: 'open', url: String(u) }); return { closed: false }; };
    if (navigator.sendBeacon) navigator.sendBeacon = (u, d) => { window.__capturas.push({ tipo: 'beacon', url: String(u) }); return true; };
  ` });
  const ir = async (url) => { await c.send('Page.navigate', { url }); await sleep(1800); };
  const evalJ = async (expr) => (await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  const disp = async (d) => { await c.send('Emulation.setDeviceMetricsOverride', { width: d.width, height: d.height, deviceScaleFactor: d.deviceScaleFactor, mobile: d.mobile }); await c.send('Emulation.setUserAgentOverride', { userAgent: d.ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' }); await c.send('Emulation.setTouchEmulationEnabled', { enabled: !!d.mobile }); };
  const foto = async (nombre, full) => {
    if (!SHOTS) return;
    let clip;
    if (full) { const h = await evalJ('Math.min(document.documentElement.scrollHeight, 16000)'); const w = await evalJ('window.innerWidth'); clip = { x: 0, y: 0, width: w, height: h, scale: 1 }; }
    const r = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 72, captureBeyondViewport: !!full, ...(clip ? { clip } : {}) });
    fs.writeFileSync(path.join(SHOTS, nombre + '.jpg'), Buffer.from(r.data, 'base64'));
  };
  // Revela lo que se anima al hacer scroll, para que la captura de página completa lo muestre
  const revelar = `document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-visible'));document.querySelectorAll('.titulo-anim').forEach(e=>e.classList.add('is-visible'));true`;
  const resultado = { movil: {}, escritorio: {}, sinJs: {}, formulario: {}, errores, salientesBloqueadas: [] };
  const medidasJS = `(() => {
    const ancho = document.documentElement.scrollWidth, vw = window.innerWidth;
    const p = [...document.querySelectorAll('main p')].filter(e => e.offsetParent && e.textContent.trim().length > 60);
    const fs = p.map(e => parseFloat(getComputedStyle(e).fontSize));
    const tam = fs.length ? Math.min(...fs) : 0, med = fs.length ? fs.sort((a,b)=>a-b)[Math.floor(fs.length/2)] : 0;
    const botones = [...document.querySelectorAll('main a.btn, main a.cbtn, main button')].filter(e => e.offsetParent);
    const chicos = botones.filter(b => b.getBoundingClientRect().height < 44).map(b => b.textContent.trim().slice(0, 40));
    const h1 = document.querySelector('h1'); const r = h1 && h1.getBoundingClientRect();
    const wa = [...document.querySelectorAll('a[href*="wa.me"]')].find(a => { const b = a.getBoundingClientRect(); return b.top < innerHeight && b.bottom > 0 && b.height > 0 && getComputedStyle(a).visibility !== 'hidden' && !a.classList.contains('wa-float'); });
    return { desborde: ancho > vw + 1 ? ancho - vw : 0, letraMinParrafo: tam, letraMediana: med, botonesMenos44: chicos, h1Visible: !!(r && r.top < innerHeight && r.height > 0), waEnPrimeraPantalla: !!wa };
  })()`;
  // 1) Móvil y escritorio
  for (const [nom, d] of [['movil', MOVIL], ['escritorio', ESCRITORIO]]) {
    await disp(d);
    for (const p of PAGINAS) {
      await ir(BASE + p);
      resultado[nom][p] = await evalJ(medidasJS);
      if (CAPTURAS[p]) { await foto(`${CAPTURAS[p]}-${nom}`); if (nom === 'movil') { await evalJ(revelar); await sleep(600); await foto(`${CAPTURAS[p]}-movil-completa`, true); } }
    }
  }
  // 2) Sin JavaScript
  await disp(MOVIL);
  await c.send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const p of PAGINAS) {
    await ir(BASE + p);
    // Con los scripts apagados, Runtime.evaluate sigue funcionando para medir
    resultado.sinJs[p] = await evalJ(`(() => {
      const ocultos = [...document.querySelectorAll('main h1, main h2, main p, main a.btn, main a.cbtn')].filter(e => { const s = getComputedStyle(e); let n = e; while (n) { const cs = getComputedStyle(n); if (cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none') return true; n = n.parentElement; } return false; });
      const h1 = document.querySelector('h1');
      return { h1: h1 ? h1.textContent.trim().slice(0, 80) : null, h1Visible: !!h1 && getComputedStyle(h1).opacity !== '0', elementosOcultos: ocultos.length, ejemplosOcultos: ocultos.slice(0, 4).map(e => e.tagName + ': ' + e.textContent.trim().slice(0, 50)), enlacesWhatsApp: document.querySelectorAll('a[href*="wa.me"]').length };
    })()`);
    if (p === '/' && SHOTS) await foto('portada-sin-js-movil');
  }
  await c.send('Emulation.setScriptExecutionDisabled', { value: false });
  // 3) Formulario: validación y envío simulado
  await disp(MOVIL);
  await ir(BASE + '/solicitar.html?utm_source=prueba&utm_medium=local');
  const F = resultado.formulario;
  F.vacio = await evalJ(`(() => { document.querySelector('#creditForm button[type=submit]').click(); return { error: document.getElementById('formError').textContent, foco: document.activeElement && document.activeElement.name }; })()`);
  F.telefonoInvalido = await evalJ(`(() => {
    const f = document.getElementById('creditForm');
    f.querySelector('input[name=perfil][value="Pensionado"]').click();
    document.getElementById('pagaduria').value = 'Colpensiones';
    document.getElementById('objetivo').value = 'Comprar cartera o unificar deudas';
    f.querySelector('input[name=situacion][value="Tengo reportes o mora"]').click();
    document.getElementById('nombre').value = 'Persona de Prueba';
    document.getElementById('telefono').value = '12345';
    f.querySelector('button[type=submit]').click();
    return document.getElementById('formError').textContent; })()`);
  F.sinAutorizacion = await evalJ(`(() => { document.getElementById('telefono').value = '300 000 0000'; const a = document.getElementById('autorizo'); F0 = a.checked; document.querySelector('#creditForm button[type=submit]').click(); return { premarcada: F0, error: document.getElementById('formError').textContent }; })()`);
  await foto('solicitar-formulario-error-movil');
  F.envio = await evalJ(`(async () => {
    document.getElementById('autorizo').click();
    document.querySelector('#creditForm button[type=submit]').click();
    await new Promise(r => setTimeout(r, 500));
    const caps = window.__capturas;
    const lead = caps.find(c => c.tipo === 'fetch' && c.url.includes('landing-lead-score'));
    const wa = caps.find(c => c.tipo === 'open');
    const next = document.getElementById('formNext');
    return { leadCapturado: !!lead, payload: lead ? JSON.parse(lead.body) : null, whatsapp: wa ? decodeURIComponent(wa.url) : null, mensajeVisible: next && !next.hidden ? next.textContent.trim().replace(/\\s+/g,' ').slice(0, 160) : null, capturasExternas: caps.map(c => c.tipo + ' ' + c.url.slice(0, 60)) };
  })()`);
  F.reenvio = await evalJ(`(async () => { const n0 = window.__capturas.filter(c => c.tipo==='fetch').length; document.querySelector('#creditForm button[type=submit]').click(); await new Promise(r => setTimeout(r, 300)); return { fetchAntes: n0, fetchDespues: window.__capturas.filter(c => c.tipo==='fetch').length }; })()`);
  F.dataLayerSinPII = await evalJ(`JSON.stringify(window.dataLayer || []).match(/Persona de Prueba|3000000000|Colpensiones/) ? 'CONTIENE DATOS PERSONALES' : 'sin datos personales'`);
  await foto('solicitar-enviado-movil');
  resultado.salientesBloqueadas = [...new Set(salientes.map(u => u.split('?')[0]))];
  c.close();
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify({ errores: resultado.errores, formulario: resultado.formulario, salientes: resultado.salientesBloqueadas }, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
