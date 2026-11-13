// Auditoría SEO técnica de todas las URL del sitemap contra el servidor local.
// Uso: node auditar.js http://localhost:8787 <salida.md>
const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:8787';
const OUT = process.argv[3];
const PROD = 'https://crediayudarte.com';
const ENT = { ndash: '–', mdash: '—', rsaquo: '›', amp: '&', nbsp: ' ', laquo: '«', raquo: '»', quot: '"', middot: '·', hellip: '…' };
const dec = s => s.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m);
const txt = h => dec(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const get = async (u, redirect = 'manual') => { const r = await fetch(u, { redirect }); return { status: r.status, loc: r.headers.get('location'), body: r.status === 200 ? await r.text() : '' }; };
// Las promesas solo cuentan si no van negadas cerca (no, tampoco, nadie, «…»)
// openingHours ya no se marca: el horario real (lun. a vie., 8:00–17:00) lo confirmó el dueño el 2026-11-13.
const PROHIBIDO = [/(?<!(\bno\b|tampoco|nadie|desconf\w+|«)[^.]{0,80})aprobaci[oó]n (garantizada|segura|asegurada)/i, /(?<!(\bno\b|tampoco|nadie|«)[^.]{0,80})cr[eé]dito garantizado/i, /honorarios se pagan solo si/i, /AggregateRating/, /ratingValue/, /reviewCount/, /International\b/, /24 ?[-–y] ?48 horas/i, /9 años|más de 10 años/i];

(async () => {
  const sm = (await get(BASE + '/sitemap.xml')).body;
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const filas = [], problemas = [], titulos = {}, descs = {}, enlaces = new Map(), pendientes = [];
  const paginas = {};
  for (const url of urls) {
    const path = url.replace(PROD, '');
    const r = await get(BASE + path);
    const h = r.body;
    const f = { url: path, status: r.status };
    if (r.status !== 200) { problemas.push(`${path}: estado ${r.status}`); filas.push(f); continue; }
    paginas[path] = h;
    f.title = dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
    f.desc = dec((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
    f.canonical = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
    f.robots = (h.match(/<meta name="robots" content="([^"]+)"/) || [])[1] || '';
    const h1s = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => txt(m[1]));
    f.h1 = h1s.join(' | '); f.h1n = h1s.length;
    // JSON-LD
    const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const tipos = new Set(); let faqLd = null;
    for (const m of lds) {
      try {
        const d = JSON.parse(m[1]);
        (function rec(n) { if (Array.isArray(n)) return n.forEach(rec); if (n && typeof n === 'object') { if (n['@type']) [].concat(n['@type']).forEach(t => tipos.add(t)); if (n['@type'] === 'FAQPage') faqLd = n; Object.values(n).forEach(rec); } })(d);
      } catch (e) { problemas.push(`${path}: JSON-LD inválido (${e.message})`); }
    }
    f.jsonld = [...tipos].filter(t => !['ListItem', 'Question', 'Answer', 'PostalAddress', 'GeoCoordinates', 'ContactPoint', 'Country', 'City', 'AdministrativeArea', 'Audience', 'Offer'].includes(t)).join(', ');
    // FAQ visible vs JSON-LD
    let vis = [];
    const pf = h.match(/<div class="post-faq">([\s\S]*?)<\/div>/);
    if (pf) vis = [...pf[1].matchAll(/<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(x => [txt(x[1]), txt(x[2])]);
    else vis = [...h.matchAll(/<button class="acc__btn"[^>]*>([\s\S]*?)<span class="acc__ico"[\s\S]*?<div class="acc__inner">([\s\S]*?)<\/div><\/div>/g)].map(x => [txt(x[1]), txt(x[2])]);
    if (faqLd) {
      const ld = faqLd.mainEntity.map(q => [q.name, q.acceptedAnswer.text]);
      const igual = ld.length === vis.length && ld.every((q, i) => q[0] === vis[i][0] && q[1] === vis[i][1]);
      f.faq = `${vis.length} visibles / ${ld.length} JSON-LD ${igual ? '✓' : '✗'}`;
      if (!igual) problemas.push(`${path}: FAQ del JSON-LD distinta de la visible`);
    } else f.faq = vis.length ? `${vis.length} visibles, sin FAQPage` : '—';
    // comprobaciones
    if (f.h1n !== 1) problemas.push(`${path}: ${f.h1n} H1`);
    if (f.canonical !== url) problemas.push(`${path}: canonical ${f.canonical} ≠ ${url}`);
    if (!/^index, follow/.test(f.robots)) problemas.push(`${path}: robots "${f.robots}"`);
    if (f.title.length > 75 || f.title.length < 25) problemas.push(`${path}: title de ${f.title.length} caracteres`);
    if (f.desc.length > 160 || f.desc.length < 70) problemas.push(`${path}: description de ${f.desc.length} caracteres`);
    (titulos[f.title] ||= []).push(path); (descs[f.desc] ||= []).push(path);
    for (const re of PROHIBIDO) { const m = h.match(re); if (m) problemas.push(`${path}: frase a revisar «${m[0]}»`); }
    for (const m of h.matchAll(/PENDIENTE DE DATO REAL/g)) pendientes.push(path);
    for (const m of h.matchAll(/<img\b[^>]*>/g)) { const a = m[0].match(/\balt="([^"]*)"/); if (!a) problemas.push(`${path}: imagen sin alt ${m[0].slice(0, 80)}`); }
    // enlaces internos
    for (const m of h.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const href = dec(m[1]);
      if (/^(https?:|mailto:|tel:|javascript:)/.test(href) && !href.startsWith(PROD)) continue;
      const abs = new URL(href.startsWith(PROD) ? href.replace(PROD, '') : href, BASE + path);
      if (abs.origin !== new URL(BASE).origin) continue;
      const k = abs.pathname + (abs.hash || '');
      if (!enlaces.has(k)) enlaces.set(k, new Set());
      enlaces.get(k).add(path);
    }
    filas.push(f);
  }
  for (const [t, ps] of Object.entries(titulos)) if (ps.length > 1) problemas.push(`Title duplicado «${t}»: ${ps.join(', ')}`);
  for (const [d, ps] of Object.entries(descs)) if (ps.length > 1) problemas.push(`Description duplicada: ${ps.join(', ')}`);
  // estado de cada enlace interno y de sus anclas
  const cache = {};
  let rotos = 0, redir = 0, anclas = 0;
  for (const [k, desde] of enlaces) {
    const [p, hash] = k.split('#');
    if (!(p in cache)) cache[p] = await get(BASE + p);
    const r = cache[p];
    if (r.status === 301) { redir++; problemas.push(`Enlace interno con redirección ${p} → ${r.loc} (desde ${[...desde].slice(0, 3).join(', ')})`); continue; }
    if (r.status !== 200) { rotos++; problemas.push(`Enlace roto ${p} [${r.status}] desde ${[...desde].slice(0, 3).join(', ')}`); continue; }
    if (hash && /\.html$|\/$/.test(p) && !new RegExp(`id="${hash}"`).test(r.body)) { anclas++; problemas.push(`Ancla inexistente ${k} desde ${[...desde].slice(0, 3).join(', ')}`); }
  }
  // redirecciones y errores esperados
  const esperadas = [['/index.html', 301, '/'], ['/home/', 301, '/'], ['/blog/index.html', 301, '/blog/'], ['/credito-libranza-reportados', 301, '/credito-libranza-reportados/'], ['/solicitar', 301, '/solicitar.html'], ['/no-existe/', 404], ['/SEO_CONOCIMIENTO/00_LEEME_PRIMERO.md', 404]];
  const redirs = [];
  for (const [p, st, loc] of esperadas) { const r = await get(BASE + p); const ok = r.status === st && (!loc || r.loc === loc); redirs.push(`| \`${p}\` | ${r.status}${r.loc ? ' → ' + r.loc : ''} | ${ok ? '✓' : '✗ esperado ' + st}`); if (!ok) problemas.push(`${p}: ${r.status} ${r.loc || ''}`); }
  // robots
  const rob = (await get(BASE + '/robots.txt')).body;
  const bots = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'].map(b => `${b}: ${new RegExp('User-agent: ' + b).test(rob) && !/Disallow: \/\s*$/m.test(rob.split('User-agent: ' + b)[1].split('\n\n')[0]) ? 'permitido' : 'REVISAR'}`);
  // salida
  let md = `# Auditoría técnica · ${new Date().toISOString().slice(0, 10)}\n\nServidor local que imita nginx.conf. ${urls.length} URL del sitemap.\n\n`;
  md += `## URL, title, H1, description\n\n| URL | Estado | Title (car.) | H1 | Description (car.) | Canonical | Robots | JSON-LD | FAQ |\n|---|---|---|---|---|---|---|---|---|\n`;
  const e = s => String(s ?? '').replace(/\|/g, '\\|');
  for (const f of filas) md += `| \`${f.url}\` | ${f.status} | ${e(f.title)} (${f.title?.length}) | ${e(f.h1)} | ${e(f.desc)} (${f.desc?.length}) | ${f.canonical === PROD + f.url ? '✓' : '✗'} | ${f.robots?.split(',')[0]}, ${f.robots?.split(',')[1]?.trim()} | ${f.jsonld} | ${f.faq} |\n`;
  md += `\n## Redirecciones y errores\n\n| Ruta | Respuesta | Resultado |\n|---|---|---|\n${redirs.join('\n')}\n`;
  md += `\n## robots.txt\n\n${bots.map(b => '- ' + b).join('\n')}\n`;
  md += `\n## Enlaces internos\n\n${enlaces.size} destinos únicos revisados: ${rotos} rotos, ${redir} con redirección, ${anclas} anclas inexistentes.\n`;
  md += `\n## Datos pendientes visibles\n\n${pendientes.length ? [...new Set(pendientes)].map(p => '- `PENDIENTE DE DATO REAL` en `' + p + '`').join('\n') : 'Ninguno.'}\n`;
  md += `\n## Problemas\n\n${problemas.length ? problemas.map(p => '- ' + p).join('\n') : 'Ninguno.'}\n`;
  if (OUT) fs.writeFileSync(OUT, md);
  console.log(`URL: ${urls.length} · problemas: ${problemas.length} · enlaces: ${enlaces.size} (${rotos} rotos, ${redir} redir, ${anclas} anclas)`);
  problemas.forEach(p => console.log(' -', p));
})();
