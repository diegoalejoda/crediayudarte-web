// Envuelve el contenido entre el encabezado del sitio y el pie en <main id="principal">
// y agrega el enlace "Saltar al contenido". Solo en páginas que no tienen <main>.
// Uso: node main.js <raíz del sitio>
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { if (['.git', 'SEO_CONOCIMIENTO', 'docs', 'docs-revision', 'assets', 'assets-src', '.claude', 'node_modules', 'home'].includes(f)) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) files.push(p); } })(root);
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  if (/<main[\s>]/.test(t)) continue;
  const ini = t.search(/<header class="header"/);
  const finHeader = ini >= 0 ? t.indexOf('</header>', ini) : -1;
  const pie = t.search(/\r?\n[ \t]*(<!-- =+ FOOTER[^\n]*\r?\n[ \t]*)?<footer/);
  if (finHeader < 0 || pie < 0 || pie < finHeader) { console.log('REVISAR', path.relative(root, f)); continue; }
  const corte = finHeader + '</header>'.length;
  t = t.slice(0, corte) + '\n\n  <main id="principal">' + t.slice(corte, pie) + '\n  </main>\n' + t.slice(pie);
  if (!t.includes('class="skip"')) t = t.replace(/(<body[^>]*>)/, '$1\n  <a class="skip" href="#principal">Saltar al contenido</a>');
  fs.writeFileSync(f, t);
  console.log('main', path.relative(root, f));
}
