// Unifica los botones del hero de las páginas de servicio:
// WhatsApp (canal humano) como acción principal y la solicitud corta como alternativa.
// Uso: node hero-cta.js <raíz del sitio>
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const enc = s => encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29');
const PAGINAS = {
  'credito-de-libranza': ['Hola, quiero saber si un crédito de libranza me conviene.', 'Hablar con una persona por WhatsApp'],
  'credito-libranza-pensionados': ['Hola, soy pensionado(a) y quiero que revisen mi caso de libranza.', 'Hablar con una persona por WhatsApp'],
  'credito-libranza-empleados-publicos': ['Hola, soy empleado(a) público(a) y quiero que revisen mi caso de libranza.', 'Hablar con una persona por WhatsApp'],
  'credito-libranza-docentes': ['Hola, soy docente del Estado y quiero que revisen mi caso de libranza.', 'Hablar con una persona por WhatsApp'],
  'credito-libranza-fuerza-publica': ['Hola, soy de la Fuerza Pública y quiero que revisen mi caso de libranza.', 'Hablar con una persona por WhatsApp'],
  'credito-libranza-reportados': ['Hola, tengo un reporte en centrales y quiero que evalúen mi caso de libranza.', 'Hablar con una persona por WhatsApp'],
  'credito-libranza-embargos': ['Hola, tengo un embargo y quiero que evalúen mi caso de libranza.', 'Hablar con una persona por WhatsApp'],
  'saneamiento-financiero': ['Hola, no me queda cupo en el desprendible y quiero estudiar un saneamiento.', 'Hablar con una persona por WhatsApp'],
  'compra-de-cartera': ['Hola, me ofrecieron una compra de cartera y quiero saber si me conviene.', 'Comparar mi oferta por WhatsApp'],
  'credito-libranza-cucuta': ['Hola, estoy en Cúcuta y quiero que evalúen mi caso de libranza.', 'Hablar con una persona por WhatsApp'],
  'about': ['Hola, quiero que revisen mi caso.', 'Hablar con una persona por WhatsApp'],
};
for (const [slug, [msg, label]] of Object.entries(PAGINAS)) {
  const f = path.join(root, slug, 'index.html');
  let t = fs.readFileSync(f, 'utf8');
  const ubic = `${slug}-hero`;
  const nuevo = `<div class="page-hero__cta">
        <a href="https://wa.me/573152474348?text=${enc(msg)}" target="_blank" rel="noopener" class="btn btn-primary btn-lg" data-ubic="${ubic}"><svg class="ico solid" aria-hidden="true"><use href="#i-whatsapp"/></svg> ${label}</a>
        <a href="../solicitar.html#solicitud" class="btn btn-ghost btn-lg" data-ubic="${ubic}">Llenar la solicitud corta</a>
      </div>
      <p class="page-hero__paso">Te responde una persona. Revisar tu caso no cuesta y no te pedimos cédula ni claves en el primer mensaje.</p>`;
  const re = /<div class="page-hero__cta">[\s\S]*?<\/div>(?:\s*<p class="page-hero__paso">[\s\S]*?<\/p>)?/;
  if (!re.test(t)) { console.log('sin CTA en', slug); continue; }
  t = t.replace(re, () => nuevo);
  fs.writeFileSync(f, t);
  console.log('ok', slug);
}
