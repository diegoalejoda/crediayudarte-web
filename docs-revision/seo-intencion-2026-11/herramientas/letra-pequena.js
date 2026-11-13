// Lista los párrafos y elementos de lectura de <main> por debajo de 16 px, con su selector.
// Uso: node letra-pequena.js http://localhost:8787 /ruta1 /ruta2 ...
const { spawn } = require('child_process'); const fs = require('fs'), path = require('path'), os = require('os');
const [BASE, ...RUTAS] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-chrome-'));
  const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch('http://127.0.0.1:9335/json/version'); break; } catch { await sleep(200); } }
  const tab = (await (await fetch('http://127.0.0.1:9335/json/list')).json()).find(t => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}; ws.onmessage = e => { const m = JSON.parse(e.data); if (pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  await send('Network.enable'); await send('Network.setBlockedURLs', { urls: ['*facebook*', '*flujos.crediayudarte.co*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const todos = {};
  for (const r of RUTAS) {
    await send('Page.navigate', { url: BASE + r }); await sleep(1500);
    const res = await send('Runtime.evaluate', { returnByValue: true, expression: `[...document.querySelectorAll('main p, main li, main dd, main td, main span, main small, main summary')].filter(e => e.offsetParent && e.textContent.trim().length > 25 && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).map(e => [parseFloat(getComputedStyle(e).fontSize), e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '') + ' ← ' + (e.parentElement.className || e.parentElement.tagName)]).filter(x => x[0] < 15.9)` });
    const v = res && res.result && res.result.value;
    if (!Array.isArray(v)) { console.log('sin resultado', r, JSON.stringify(res).slice(0, 300)); continue; }
    for (const [px, sel] of v) { const k = px + 'px ' + sel; (todos[k] ||= new Set()).add(r); }
  }
  for (const [k, s] of Object.entries(todos)) console.log(k, '·', [...s].length, 'pág.');
  ws.close(); ch.kill();
})();
