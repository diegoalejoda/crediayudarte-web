// Captura secciones concretas (por selector) para revisión visual.
// Uso: node secciones.js http://localhost:8787 <carpeta> [movil|escritorio]
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const BASE = process.argv[2], OUT = process.argv[3], MODO = process.argv[4] || 'movil';
const D = MODO === 'movil' ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
const LISTA = [
  ['/', '.inicio', 'portada-hero'], ['/', '#que-revisamos', 'portada-que-revisamos'], ['/', '#que-necesitas', 'portada-situaciones'], ['/', '#por-que', 'portada-persona'], ['/', '#estafas', 'portada-estafas'], ['/', '#empieza', 'portada-cierre'],
  ['/credito-libranza-pensionados/', '.page-hero', 'pensionados-hero'], ['/credito-libranza-pensionados/', '.revisa', 'pensionados-revisa'], ['/credito-libranza-pensionados/', '#costo-total', 'pensionados-costo'], ['/credito-libranza-pensionados/', '.glosario', 'pensionados-glosario'], ['/credito-libranza-pensionados/', '#estafas', 'pensionados-alerta'], ['/credito-libranza-pensionados/', '#siguiente-paso', 'pensionados-siguiente'],
  ['/credito-libranza-reportados/', '.page-hero', 'reportados-hero'], ['/credito-libranza-reportados/', '#no-prometer', 'reportados-no-prometer'], ['/credito-libranza-reportados/', '#fuentes', 'reportados-fuentes'],
  ['/credito-libranza-cucuta/', '#oficina', 'cucuta-oficina'], ['/credito-libranza-cucuta/', '#ubicacion', 'cucuta-mapa'],
  ['/solicitar.html', '#solicitud', 'solicitar-formulario'],
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-chrome-'));
  const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${dir}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch('http://127.0.0.1:9334/json/version'); break; } catch { await sleep(200); } }
  const tab = (await (await fetch('http://127.0.0.1:9334/json/list')).json()).find(t => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}; ws.onmessage = e => { const m = JSON.parse(e.data); if (pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*facebook*', '*flujos.crediayudarte.co*', '*google-analytics*', '*googletagmanager*'] });
  await send('Emulation.setDeviceMetricsOverride', D);
  let actual = '';
  for (const [p, sel, nombre] of LISTA) {
    if (p !== actual) { await send('Page.navigate', { url: BASE + p }); await sleep(1800); actual = p; }
    const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => { document.querySelectorAll('.reveal,.titulo-anim').forEach(e => e.classList.add('is-visible')); const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView(); const b = el.getBoundingClientRect(); return { x: 0, y: b.top + scrollY, w: innerWidth, h: Math.min(b.height, 2600) }; })()` });
    const b = r.result.value; if (!b) { console.log('sin', sel, p); continue; }
    await sleep(500);
    const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 75, captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
    fs.writeFileSync(path.join(OUT, `${nombre}-${MODO}.jpg`), Buffer.from(s.data, 'base64'));
  }
  ws.close(); ch.kill(); console.log('listo');
})();
