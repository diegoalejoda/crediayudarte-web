// Servidor estático local que imita las reglas de nginx.conf relevantes para SEO:
// índice de carpeta, 404 propio, 301 de /index.html, /home/, /blog/index.html,
// /solicitar, /testimonios y carpetas sin barra final.
// Uso: node servidor.js <raíz del sitio> [puerto]
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || '.');
const port = +(process.argv[3] || 8787);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };
const R301 = { '/index.html': '/', '/home': '/', '/home/': '/', '/solicitar': '/solicitar.html', '/testimonios': '/testimonios.html', '/blog/index.html': '/blog/', '/blog': '/blog/' };
const BLOQUEADO = /^\/(\.git|SEO_CONOCIMIENTO|docs|docs-revision|assets-src|\.claude)(\/|$)/;
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  let p = decodeURIComponent(u.pathname);
  if (R301[p]) { res.writeHead(301, { Location: R301[p] + u.search }); return res.end(); }
  const enviar404 = () => { res.writeHead(404, { 'Content-Type': TIPOS['.html'] }); res.end(fs.readFileSync(path.join(root, '404.html'))); };
  if (BLOQUEADO.test(p)) return enviar404();
  let f = path.join(root, p);
  if (!f.startsWith(root)) return enviar404();
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + u.search }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) return enviar404();
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log('http://localhost:' + port));
