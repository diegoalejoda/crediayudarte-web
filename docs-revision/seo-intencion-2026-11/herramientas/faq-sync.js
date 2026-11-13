// Reconstruye el FAQPage del JSON-LD a partir de las preguntas VISIBLES
// (.post-faq <details> o acordeón .acc__item de la portada).
// Uso: node faq-sync.js <raíz del sitio>
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const ENT = { ndash: '–', mdash: '—', rsaquo: '›', amp: '&', nbsp: ' ', laquo: '«', raquo: '»', quot: '"', middot: '·', hellip: '…' };
const dec = s => s.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m);
const txt = h => dec(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { if (['.git', 'SEO_CONOCIMIENTO', 'docs', 'docs-revision', 'assets', 'assets-src', '.claude', 'node_modules', 'home'].includes(f)) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) files.push(p); } })(root);
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  let items = [];
  const pf = t.match(/<div class="post-faq">([\s\S]*?)<\/div>/);
  if (pf) items = [...pf[1].matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(x => [txt(x[1]), txt(x[2])]);
  else items = [...t.matchAll(/<button class="acc__btn"[^>]*>([\s\S]*?)<span class="acc__ico"[\s\S]*?<div class="acc__inner">([\s\S]*?)<\/div><\/div>/g)].map(x => [txt(x[1]), txt(x[2])]);
  const re = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/;
  const m = t.match(re); if (!m) continue;
  let data; try { data = JSON.parse(m[2]); } catch (e) { console.log('JSON inválido', f); continue; }
  const g = data['@graph'] || [data];
  const faq = g.find(n => n['@type'] === 'FAQPage');
  if (!faq) continue;
  if (!items.length) { console.log('FAQPage sin preguntas visibles', path.relative(root, f)); continue; }
  const nuevo = items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }));
  if (JSON.stringify(faq.mainEntity) === JSON.stringify(nuevo)) continue;
  faq.mainEntity = nuevo;
  t = t.replace(re, (m0, a, b, z) => a + '\n' + JSON.stringify(data, null, 2) + '\n  ' + z);
  fs.writeFileSync(f, t);
  console.log('sincronizado', path.relative(root, f), items.length);
}
