// Inserta los bloques de decisión en las páginas de servicio de CrediAyudarte
// y sincroniza el JSON-LD (FAQPage desde las preguntas visibles, Service).
// Uso: node bloques.js <raíz del sitio>
// Es idempotente: si una página ya tiene el bloque (por id), no lo repite.
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const WA = 'https://wa.me/573152474348?text=';
const enc = s => encodeURIComponent(s).replace(/\(/g, '%28').replace(/\)/g, '%29');

// ---------------------------------------------------------------- glosario
const GLOS = {
  pagaduria: ['Pagaduría', 'La entidad que te paga la pensión o el sueldo y aplica los descuentos: por ejemplo Colpensiones, FOPEP, Fiduprevisora, una Secretaría de Educación, CASUR o CREMIL. Si no tiene convenio con una entidad financiera, esa entidad no puede prestarte por libranza.'],
  mesada: ['Mesada', 'El pago mensual de tu pensión.'],
  desprendible: ['Desprendible', 'El comprobante de pago de tu pensión o tu sueldo. Muestra cuánto te pagan, qué te descuentan y cuánto recibes.'],
  capacidad: ['Capacidad de pago o margen', 'Lo que te queda libre después de los descuentos. Por ley, después de los descuentos de libranza debes recibir al menos el 50 % del neto de tu salario o pensión (Ley 1527 de 2012, art. 3).'],
  costo: ['Cuota y costo total', 'La cuota es lo que pagas cada mes. El costo total es lo que pagas al final: la cuota por todos los meses, más seguros y cargos. Una cuota baja con muchos años puede salir más cara.'],
  visacion: ['Visación', 'El paso en que la pagaduría revisa y registra el descuento del crédito nuevo. Sus tiempos los pone la pagaduría.'],
  cartera: ['Compra de cartera', 'Un crédito nuevo que paga los que ya tienes y te deja una sola cuota. Puede bajar la cuota, a veces solo porque alarga el plazo.'],
  reporte: ['Reporte negativo', 'El registro en Datacrédito o TransUnion de una deuda que no se pagó a tiempo. Una mora vigente es una deuda que sigue sin pagarse hoy; una deuda ya pagada puede seguir apareciendo un tiempo.'],
  embargo: ['Embargo', 'Una orden de un juez o de una autoridad de cobro para retener parte de tu sueldo o pensión y pagar una deuda. Mientras exista, reduce lo que te queda libre.'],
  saneamiento: ['Saneamiento financiero', 'Pagar u ordenar deudas con una financiación externa, que tiene costos propios, para que después se pueda estudiar una libranza. No garantiza ese crédito posterior.'],
  asignacion: ['Asignación de retiro', 'El pago mensual del personal retirado de la Fuerza Pública. Lo pagan CASUR (Policía) o CREMIL (Fuerzas Militares).'],
  vinculacion: ['Tipo de vinculación', 'Cómo estás nombrado: carrera administrativa, provisionalidad, libre nombramiento, periodo fijo u otra. Cambia el plazo y las condiciones que una entidad puede ofrecer.'],
  anticipo: ['Anticipo', 'Un pago que te piden antes de recibir el crédito. En la libranza no es normal y es la señal más clara de estafa.'],
};

// ---------------------------------------------------------------- fuentes
const FUENTES = {
  ley1527: '<a href="https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=47213" target="_blank" rel="noopener">Ley 1527 de 2012, sobre la libranza</a> (Función Pública). El artículo 3 fija que debes recibir al menos el 50 % del neto de tu salario o pensión.',
  ley2157: '<a href="https://normograma.mintic.gov.co/mintic/compilacion/docs/ley_2157_2021.htm" target="_blank" rel="noopener">Ley 2157 de 2021, sobre los datos en centrales de riesgo</a> (normograma del MinTIC).',
  sic: '<a href="https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/concepto/permanencia-del-dato-negativo-ley-2157-de-2021" target="_blank" rel="noopener">Permanencia del dato negativo</a> (Superintendencia de Industria y Comercio).',
  sfc: '<a href="https://www.superfinanciera.gov.co/publicaciones/10115254/tips-para-identificar-falsos-prestamistas/" target="_blank" rel="noopener">Cómo identificar falsos prestamistas</a> (Superintendencia Financiera).',
  sfcgota: '<a href="https://www.superfinanciera.gov.co/publicaciones/10115253/no-caiga-en-el-gota-a-gota-virtual/" target="_blank" rel="noopener">No caiga en el gota a gota virtual</a> (Superintendencia Financiera).',
};

const ENTIDAD = ['Si aprueba o no el crédito.', 'El monto, la tasa y el plazo.', 'Los seguros y los costos del estudio.', 'Cuándo desembolsa.'];
const DOCS_BASE = {
  primer: 'Ninguno. Basta con contarnos tu perfil, quién te paga y qué necesitas.',
  pre: 'Tu desprendible de pago más reciente, legible. Con eso hacemos el preanálisis, que no cuesta.',
  entidad: ['Copia de tu cédula.', 'Los formularios y la autorización de consulta en centrales de riesgo de la entidad.'],
};

// ---------------------------------------------------------------- páginas
const P = {
  'credito-de-libranza': {
    title: 'Crédito de libranza: qué es, cómo funciona y si te conviene',
    desc: 'Qué es el crédito de libranza, cómo se descuenta de tu pensión o nómina, quién lo aprueba y cómo comparar cuota, plazo y costo total antes de firmar.',
    wa: 'Hola, quiero saber si un crédito de libranza me conviene.',
    cierre: ['Tu siguiente paso: revisar tu caso con una persona', 'Cuéntanos quién te paga y qué necesitas. Te decimos qué margen tienes, qué entidades podrían estudiar tu caso y cuánto te costaría en total.'],
    nos: ['<b>Tu pagaduría</b> y con qué entidades tiene convenio.', '<b>Tus descuentos actuales</b> en el desprendible.', '<b>Tu capacidad de pago:</b> lo que te queda libre según la ley.', '<b>Tu historial:</b> reportes, mora o embargos.', '<b>Cuota, plazo, costo total y dinero neto</b> que recibes.'],
    glos: ['pagaduria', 'desprendible', 'capacidad', 'costo', 'visacion', 'cartera'],
    docsExtra: ['Un certificado de pensión o laboral, si la entidad lo pide.'],
    fuentes: ['ley1527', 'sfc'],
    faq: [['¿Qué documentos piden para un crédito de libranza?', 'Para la primera consulta, ninguno. Si tu caso tiene opciones, te pedimos el desprendible de pago más reciente para el preanálisis. Después, la entidad suele pedir copia de la cédula, un certificado de pensión o laboral y sus formularios. Nunca te pedimos claves, códigos ni pagos por adelantado. Lo explicamos en <a href="../blog/que-documentos-piden-para-un-credito-de-libranza.html">qué documentos piden para un crédito de libranza</a>.']],
    service: ['Asesoría en crédito de libranza', 'Revisión de pagaduría, descuentos, capacidad de pago e historial, y comparación de cuota, plazo, costo total y dinero neto antes de firmar. La aprobación y el desembolso dependen de la entidad financiera.', 'Pensionados, empleados públicos, docentes del Estado y Fuerza Pública'],
  },
  'credito-libranza-pensionados': {
    title: 'Crédito para pensionados por libranza: qué revisar antes de firmar',
    desc: 'Crédito de libranza para pensionados: mesada, descuentos, margen libre, edad y plazo, documentos y costo total. Asesoría en Cúcuta y virtual, sin anticipos.',
    h1: 'Crédito para pensionados por libranza: <span>qué revisar antes de comprometer tu mesada</span>',
    wa: 'Hola, soy pensionado(a) y quiero que revisen mi caso de libranza.',
    cierre: ['Tu siguiente paso: que una persona revise tu mesada contigo', 'Cuéntanos quién te paga la pensión y qué necesitas. Si quieres, un hijo o alguien de confianza puede estar en la conversación.'],
    nos: ['<b>Tu mesada y quién te la paga</b> (tu pagaduría).', '<b>Lo que ya te descuentan:</b> salud y créditos activos.', '<b>El margen que te queda libre</b> según la ley.', '<b>Tu edad,</b> porque cambia el plazo y los seguros.', '<b>Tu historial</b> y si hay embargos.', '<b>Cuánto recibes y cuánto pagas en total,</b> no solo la cuota.'],
    glos: ['mesada', 'pagaduria', 'desprendible', 'capacidad', 'costo', 'cartera'],
    docsExtra: ['Un certificado de pensión o la resolución de tu pensión, si la entidad lo pide.'],
    fuentes: ['ley1527', 'sfc'],
    faq: [['¿Qué documentos necesito como pensionado?', 'Para el primer contacto, ninguno: solo tu perfil, quién te paga la pensión y qué necesitas. Si hay opciones, te pedimos tu desprendible de pago más reciente. Más adelante, la entidad suele pedir copia de la cédula, un certificado o la resolución de tu pensión y sus formularios. No te pedimos claves, códigos ni datos bancarios.'],
          ['¿Ser pensionado me garantiza el crédito?', 'No. La mesada es un ingreso estable y eso ayuda a que el caso se pueda estudiar, pero la entidad decide según tu margen libre, tu edad, tu historial, los embargos y sus propias políticas. Nadie serio puede garantizarte la aprobación.']],
    service: ['Asesoría en crédito de libranza para pensionados', 'Revisión de mesada, pagaduría, descuentos, margen libre, edad y plazo, historial y costo total para pensionados. La aprobación depende de la entidad financiera.', 'Pensionados'],
  },
  'credito-libranza-empleados-publicos': {
    title: 'Crédito para empleados públicos por libranza: qué se evalúa',
    desc: 'Crédito de libranza para empleados públicos de alcaldías, gobernaciones y entidades del Estado: vinculación, pagaduría, margen y costo total. Sin anticipos.',
    wa: 'Hola, soy empleado(a) público(a) y quiero que revisen mi caso de libranza.',
    cierre: ['Tu siguiente paso: revisar tu desprendible con una persona', 'Cuéntanos dónde trabajas y cómo estás vinculado. Te decimos qué margen real tienes y qué entidades podrían estudiar tu caso.'],
    nos: ['<b>Tu tipo de vinculación:</b> carrera, provisional, libre nombramiento u otra.', '<b>Tu pagaduría</b> y sus convenios.', '<b>Tus descuentos:</b> créditos, cooperativas, sindicato.', '<b>El margen que te queda libre</b> según la ley.', '<b>Tu historial</b> y si hay embargos.', '<b>Cuota, plazo y costo total.</b>'],
    glos: ['vinculacion', 'pagaduria', 'desprendible', 'capacidad', 'costo', 'cartera'],
    docsExtra: ['Un certificado laboral que indique tu tipo de vinculación, si la entidad lo pide.'],
    fuentes: ['ley1527', 'sfc'],
    faq: [['¿Ser empleado público me garantiza el crédito?', 'No. Tener nómina del Estado ayuda a que el caso se pueda estudiar, pero la entidad decide según tu vinculación, tu margen libre, tu historial y sus propias políticas. Nadie serio puede garantizarte la aprobación.']],
    service: ['Asesoría en crédito de libranza para empleados públicos', 'Revisión de tipo de vinculación, pagaduría, descuentos, margen libre, historial y costo total para empleados de entidades del Estado. La aprobación depende de la entidad financiera.', 'Empleados públicos'],
  },
  'credito-libranza-docentes': {
    title: 'Crédito de libranza para docentes del Estado: qué se revisa',
    desc: 'Libranza para docentes de Secretarías de Educación, activos o pensionados: cómo leer el desprendible, cuándo conviene la compra de cartera y qué piden.',
    h1: 'Crédito de libranza para docentes del Estado: <span>por qué tu desprendible manda</span>',
    wa: 'Hola, soy docente del Estado y quiero que revisen mi caso de libranza.',
    cierre: ['Tu siguiente paso: revisar tu desprendible renglón por renglón', 'Cuéntanos de qué Secretaría de Educación dependes y qué necesitas. Te decimos qué margen tienes y si una compra de cartera te conviene o no.'],
    nos: ['<b>Tu pagaduría:</b> la Secretaría de Educación o la entidad que te paga.', '<b>Cada descuento de tu desprendible,</b> renglón por renglón.', '<b>Qué créditos conviene recoger</b> y cuáles no.', '<b>El margen que te queda libre</b> según la ley.', '<b>Tu historial</b> y si hay embargos.', '<b>Cuota, plazo y costo total.</b>'],
    glos: ['pagaduria', 'desprendible', 'capacidad', 'costo', 'cartera', 'visacion'],
    docsExtra: ['Un certificado laboral o de pensión de docente, si la entidad lo pide.'],
    fuentes: ['ley1527', 'sfc'],
    faq: [['¿Qué documentos piden a un docente para una libranza?', 'Para el primer contacto, ninguno. Si hay opciones, te pedimos tu desprendible más reciente. Después, la entidad suele pedir copia de la cédula, un certificado laboral o de pensión y sus formularios. No te pedimos claves, códigos ni pagos por adelantado.']],
    service: ['Asesoría en crédito de libranza para docentes del Estado', 'Revisión del desprendible, pagaduría, margen libre, historial y conveniencia de la compra de cartera para docentes activos y pensionados. La aprobación depende de la entidad financiera.', 'Docentes del Estado'],
  },
  'credito-libranza-fuerza-publica': {
    title: 'Crédito para Policía, Ejército y Fuerza Pública por libranza',
    desc: 'Crédito de libranza para Policía, Ejército, Armada y Fuerza Aérea, en servicio activo o con asignación de retiro: qué se revisa y qué decide la entidad.',
    h1: 'Crédito de libranza para Policía, Ejército y Fuerza Pública: <span>activos y con asignación de retiro</span>',
    wa: 'Hola, soy de la Fuerza Pública y quiero que revisen mi caso de libranza.',
    cierre: ['Tu siguiente paso: revisar tu caso aunque estés lejos', 'Cuéntanos si estás en servicio activo o retirado y quién te paga. Lo revisamos por WhatsApp desde donde estés destinado.'],
    nos: ['<b>Si estás en servicio activo o con asignación de retiro.</b>', '<b>Tu pagaduría:</b> tu fuerza, CASUR o CREMIL.', '<b>Tus descuentos actuales</b> en el desprendible.', '<b>El margen que te queda libre</b> según la ley.', '<b>Tu historial</b> y si hay embargos.', '<b>Cuota, plazo y costo total.</b>'],
    glos: ['asignacion', 'pagaduria', 'desprendible', 'capacidad', 'costo', 'cartera'],
    docsExtra: ['Un certificado de tu unidad o de tu asignación de retiro, si la entidad lo pide.'],
    fuentes: ['ley1527', 'sfc'],
    faq: [['¿Atienden a policías y militares de Cúcuta y Norte de Santander?', 'Sí. Puedes venir a la oficina en el Centro Comercial Internacional de Cúcuta, coordinando antes por WhatsApp, o hacer todo el análisis por WhatsApp desde donde estés destinado. La aprobación depende de la entidad financiera.']],
    service: ['Asesoría en crédito de libranza para la Fuerza Pública', 'Revisión de pagaduría, descuentos, margen libre, historial y costo total para Policía, Ejército, Armada y Fuerza Aérea, en servicio activo o con asignación de retiro. La aprobación depende de la entidad financiera.', 'Policía, Ejército, Armada y Fuerza Aérea'],
  },
  'credito-libranza-reportados': {
    title: 'Crédito para reportados por libranza: pensionados y empleados públicos',
    desc: 'Crédito de libranza para reportados que son pensionados o empleados públicos: qué se estudia, qué no se puede prometer y qué dice la ley. Oficina en Cúcuta.',
    h1: 'Crédito de libranza para reportados: <span>qué se puede estudiar si eres pensionado o empleado público</span>',
    wa: 'Hola, tengo un reporte en centrales y quiero que evalúen mi caso de libranza.',
    cierre: ['Tu siguiente paso: entender tu situación real', 'Cuéntanos tu perfil, quién te paga y lo que sabes de tu reporte. Te decimos con honestidad si vemos una opción, qué la complica y si conviene esperar o sanear primero.'],
    nos: ['<b>El tipo de reporte:</b> mora vigente o deuda ya pagada, y desde cuándo.', '<b>Tu capacidad de pago</b> en el desprendible.', '<b>Tu pagaduría</b> y sus convenios.', '<b>Si hay embargos</b> o retenciones.', '<b>Si el reporte podría estar mal</b> y conviene reclamar.'],
    glos: ['reporte', 'pagaduria', 'desprendible', 'capacidad', 'saneamiento', 'anticipo'],
    docsExtra: ['Tu historial de Datacrédito o TransUnion, si ya lo consultaste. Consultarlo es gratis y no baja tu calificación.'],
    fuentes: ['ley2157', 'sic', 'ley1527', 'sfc'],
    faq: [['¿Hay crédito para reportados en Cúcuta?', 'Revisamos casos de pensionados, empleados públicos, docentes y Fuerza Pública con reportes, en nuestra oficina de Cúcuta (Calle 12 # 4–47, Local 4, C.C. Internacional) o por WhatsApp desde cualquier ciudad. Buscamos entidades que puedan estudiar el caso, pero no prometemos aprobación: decide la entidad.'],
          ['¿Ser pensionado o tener nómina pública me garantiza el crédito aunque esté reportado?', 'No. La pensión o la nómina del Estado ayudan a que el caso se pueda estudiar, porque la cuota se descuenta directamente. Pero la entidad mira también el tipo de reporte, tu capacidad, los embargos y sus propias políticas. Nadie puede garantizarte la aprobación.']],
  },
  'credito-libranza-embargos': {
    title: 'Crédito con embargo: qué se puede estudiar en una libranza',
    desc: 'Crédito de libranza con embargo en la nómina o la pensión: qué influye, por qué pagar no levanta el embargo solo y qué documentos ayudan. Sin promesas.',
    wa: 'Hola, tengo un embargo y quiero que evalúen mi caso de libranza.',
    cierre: ['Tu siguiente paso: saber qué capacidad te queda', 'Cuéntanos tu perfil, quién te paga y qué tipo de embargo tienes. Si hoy no hay opción, te lo decimos y te explicamos qué tendría que cambiar.'],
    nos: ['<b>El tipo de embargo:</b> por deuda, por alimentos u otro.', '<b>Cuánto te retienen</b> cada mes.', '<b>La capacidad que te queda</b> después del embargo.', '<b>Tu pagaduría</b> y sus convenios.', '<b>El estado del proceso</b> y si hay acuerdos de pago.'],
    glos: ['embargo', 'pagaduria', 'desprendible', 'capacidad', 'saneamiento'],
    docsExtra: ['El oficio o la orden del embargo, si la tienes, para saber de qué proceso se trata.'],
    fuentes: ['ley1527', 'sfc'],
    faq: [['¿Qué documentos sirven si tengo un embargo?', 'Para empezar, ninguno: cuéntanos tu perfil y qué tipo de embargo tienes. Si hay opciones, ayudan tu desprendible más reciente y, si la tienes, la orden u oficio del embargo. Después, la entidad pedirá sus propios documentos. No te pedimos claves ni pagos por adelantado.']],
  },
  'saneamiento-financiero': {
    title: 'Sin cupo en el desprendible: saneamiento financiero',
    desc: '¿No tienes cupo en el desprendible? Qué es el saneamiento financiero para pensionados y empleados públicos, cuánto puede costar, sus riesgos y qué pasa si la libranza no sale.',
    h1: '¿No tienes cupo en el desprendible? <span>Saneamiento financiero para pensionados y empleados públicos</span>',
    wa: 'Hola, no me queda cupo en el desprendible y quiero estudiar un saneamiento.',
    cierre: ['Tu siguiente paso: un diagnóstico honesto', 'Cuéntanos tu perfil, quién te paga y qué deudas tienes. Te decimos si un saneamiento tiene sentido, qué costaría y qué riesgos tendría. Si no conviene, también te lo decimos.'],
    nos: ['<b>Qué deudas te bloquean</b> el desprendible y sus saldos.', '<b>Si después del saneamiento quedaría capacidad</b> para una libranza.', '<b>Los costos de la financiación externa.</b>', '<b>Los riesgos</b> si la libranza posterior no sale.', '<b>Tu historial</b> y si hay embargos.'],
    glos: ['saneamiento', 'desprendible', 'capacidad', 'reporte', 'embargo', 'anticipo'],
    docsExtra: ['Una relación de tus deudas con sus saldos, si la tienes.'],
    fuentes: ['ley1527', 'ley2157', 'sic', 'sfc'],
    faq: [],
  },
  'compra-de-cartera': {
    title: 'Compra de cartera por libranza: ¿te conviene bajar la cuota?',
    desc: '¿Te ofrecieron bajar la cuota? Cómo comparar una compra de cartera por libranza: cuota, plazo, costo total, saldo por recoger y dinero que de verdad recibes.',
    wa: 'Hola, me ofrecieron una compra de cartera y quiero compararla.',
    cierre: ['Tu siguiente paso: comparar antes de firmar', 'Envíanos la oferta que te hicieron y tu desprendible. Te mostramos qué cambia en cuota, plazo, costo total y dinero neto, y si alguna deuda no debería entrar.'],
    nos: ['<b>Cada crédito que tienes:</b> saldo, cuota y meses que le faltan.', '<b>La cuota nueva frente a la actual.</b>', '<b>El plazo nuevo:</b> cuántos años agrega.', '<b>El costo total</b> antes y después.', '<b>El dinero neto</b> que de verdad recibes.', '<b>Qué créditos no conviene recoger.</b>'],
    glos: ['cartera', 'costo', 'desprendible', 'capacidad', 'pagaduria'],
    docsExtra: ['La oferta que te hicieron, por escrito, y los certificados de saldo de los créditos que se recogerían.'],
    fuentes: ['ley1527', 'sfc'],
    faq: [['Me ofrecieron bajar la cuota. ¿Qué debo preguntar?', 'Pide por escrito el plazo nuevo en meses, el costo total, el dinero neto que recibes y la lista de créditos que se recogen con su saldo. Si la cuota baja solo porque el plazo se alarga, puedes terminar pagando más. Nosotros lo comparamos contigo antes de que firmes.']],
    service: ['Asesoría en compra de cartera por libranza', 'Comparación de la situación actual con la compra de cartera ofrecida: cuota, plazo, costo total, saldo por recoger y dinero neto. La aprobación depende de la entidad financiera.', 'Pensionados, empleados públicos, docentes del Estado y Fuerza Pública'],
  },
  'credito-libranza-cucuta': {
    title: 'Crédito de libranza en Cúcuta: oficina y asesoría | CrediAyudarte',
    desc: 'Crédito de libranza en Cúcuta y Norte de Santander: oficina en el C.C. Internacional, Calle 12 # 4–47, Local 4. Atención con cita y por WhatsApp. Sin anticipos.',
    h1: 'Crédito de libranza en Cúcuta: <span>asesoría con oficina en el Centro Comercial Internacional</span>',
    wa: 'Hola, estoy en Cúcuta y quiero que evalúen mi caso de libranza.',
    cierre: ['Tu siguiente paso: escribir o venir a la oficina', 'Escríbenos por WhatsApp y coordinamos la visita a la oficina, o hacemos todo por WhatsApp si prefieres no desplazarte.'],
    nos: ['<b>Tu pagaduría</b> y sus convenios.', '<b>Tus descuentos actuales</b> en el desprendible.', '<b>El margen que te queda libre</b> según la ley.', '<b>Tu historial:</b> reportes, mora o embargos.', '<b>Cuota, plazo, costo total y dinero neto.</b>'],
    glos: ['pagaduria', 'desprendible', 'capacidad', 'costo'],
    docsExtra: [],
    fuentes: ['ley1527', 'sfc'],
    faq: [],
    service: ['Asesoría en crédito de libranza en Cúcuta', 'Asesoría presencial en la oficina del Centro Comercial Internacional de Cúcuta y virtual por WhatsApp para pensionados, empleados públicos, docentes y Fuerza Pública. La aprobación depende de la entidad financiera.', 'Pensionados, empleados públicos, docentes del Estado y Fuerza Pública de Cúcuta y Norte de Santander'],
  },
};

// ---------------------------------------------------------------- utilidades
const ENT = { ndash: '–', mdash: '—', rsaquo: '›', lsaquo: '‹', amp: '&', nbsp: ' ', laquo: '«', raquo: '»', quot: '"', middot: '·', hellip: '…', copy: '©', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ' };
const dec = s => s.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m);
const txt = h => dec(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const escAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function bloqueRevisa(c) {
  return `
        <!-- QUÉ REVISAMOS / QUÉ DECIDE LA ENTIDAD -->
        <h2 id="que-revisamos">Qué revisamos contigo y qué decide la entidad</h2>
        <div class="revisa">
          <div class="revisa__col revisa__col--nos">
            <h3>Lo que revisamos contigo</h3>
            <ul>
${c.nos.map(x => `              <li>${x}</li>`).join('\n')}
            </ul>
          </div>
          <div class="revisa__col revisa__col--entidad">
            <h3>Lo que decide la entidad, no nosotros</h3>
            <ul>
${ENTIDAD.map(x => `              <li>${x}</li>`).join('\n')}
            </ul>
          </div>
          <p class="revisa__nota">Ser pensionado o tener nómina pública ayuda a que tu caso se pueda estudiar, pero <strong>no garantiza la aprobación</strong>. Revisar tu caso no cuesta y no pedimos anticipos.</p>
        </div>
`;
}
function bloquePalabras(c) {
  return `
        <!-- PALABRAS QUE VAS A ESCUCHAR -->
        <h2 id="palabras">Palabras que vas a escuchar, explicadas</h2>
        <dl class="glosario">
${c.glos.map(k => `          <div><dt>${GLOS[k][0]}</dt><dd>${GLOS[k][1]}</dd></div>`).join('\n')}
        </dl>
`;
}
function bloqueDocs(c, icoAlert) {
  return `
        <!-- DOCUMENTOS -->
        <h2 id="documentos">Qué documentos pueden pedirte</h2>
        <div class="tabla">
          <table>
            <caption>Qué se pide en cada momento</caption>
            <thead>
              <tr><th scope="col">Momento</th><th scope="col">Qué se pide</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Primer contacto por WhatsApp o formulario</th><td>${DOCS_BASE.primer}</td></tr>
              <tr><th scope="row">Preanálisis, si tu caso tiene opciones</th><td>${DOCS_BASE.pre}</td></tr>
              <tr><th scope="row">Estudio en la entidad</th><td>${[...DOCS_BASE.entidad, ...c.docsExtra].join(' ')} Cada entidad define su lista.</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Nunca te pedimos</strong> claves, contraseñas, códigos que te lleguen por mensaje, fotos de tus tarjetas ni pagos por adelantado. Los datos que nos compartes se tratan según nuestra <a href="../privacy/">política de privacidad</a>.</p>

        <div class="alerta" id="estafas">
          <h3>${icoAlert ? '<svg class="ico" aria-hidden="true"><use href="#i-alert"/></svg> ' : ''}Nunca pagues para que te presten</h3>
          <p>Ningún trámite serio de libranza te cobra antes del desembolso. Desconfía si te piden:</p>
          <ul>
            <li>Dinero para «estudio», «seguro» o «liberar» el crédito.</li>
            <li>Claves, códigos o acceso a tu banca en línea.</li>
            <li>Decidir hoy mismo porque «se pierde el cupo».</li>
          </ul>
          <p>Si alguien te pide dinero en nombre de CrediAyudarte, no pagues y escríbenos al WhatsApp oficial <strong>315 247 4348</strong>. Más en <a href="../blog/te-piden-un-anticipo-para-desembolsar-el-credito.html">te piden un anticipo para desembolsar el crédito</a>.</p>
        </div>
`;
}
function bloqueFuentes(c) {
  return `
        <!-- FUENTES OFICIALES -->
        <div class="fuentes" id="fuentes">
          <h3>Fuentes oficiales</h3>
          <ul>
${c.fuentes.map(k => `            <li>${FUENTES[k]}</li>`).join('\n')}
          </ul>
          <small>Enlaces revisados el 12 de noviembre de 2026. Es orientación general, no asesoría jurídica.</small>
        </div>
`;
}
function bloqueSiguiente(slug, c) {
  const wa = WA + enc(c.wa);
  return `<div class="post-cierre siguiente" id="siguiente-paso">
        <h2>${c.cierre[0]}</h2>
        <p>${c.cierre[1]}</p>
        <ol>
          <li><span><strong>Escríbenos por WhatsApp o llena la solicitud corta.</strong> Cuéntanos tu perfil, quién te paga y qué necesitas. Sin cédula ni documentos.</span></li>
          <li><span><strong>Te responde una persona.</strong> Si tu caso tiene opciones, te pide el desprendible para el preanálisis, que no cuesta.</span></li>
          <li><span><strong>Te explicamos cuota, plazo y costo total antes de firmar.</strong> Tú decides; la entidad aprueba y desembolsa.</span></li>
        </ol>
        <div class="siguiente__cta">
          <a href="${escAttr(wa)}" target="_blank" rel="noopener" class="btn btn-primary btn-lg" data-ubic="${slug}-cierre"><svg class="ico solid" aria-hidden="true"><use href="#i-whatsapp"/></svg> Hablar con una persona</a>
          <a href="../solicitar.html#solicitud" class="btn btn-ghost btn-lg" data-ubic="${slug}-cierre">Llenar la solicitud corta</a>
        </div>
        <p class="siguiente__fine">Preanálisis sin costo · Sin anticipos para tramitar · La aprobación depende de la entidad financiera · Oficina: Calle 12 # 4–47, Local 4, C.C. Internacional, Cúcuta.</p>
      </div>`;
}

function insertAntes(t, marcador, html, nombre) {
  const i = t.indexOf(marcador);
  if (i < 0) throw new Error('no encuentro ' + marcador + ' para ' + nombre);
  const ini = t.lastIndexOf('\n', i) + 1; // inicio de línea
  return t.slice(0, ini) + html.replace(/^\n/, '') + '\n' + t.slice(ini);
}

function tocAdd(t, items, antesDeId) {
  // items: [[id, texto]] ; se insertan antes del <li> que enlaza a #antesDeId (o al final)
  const m = t.match(/<nav class="toc"[\s\S]*?<\/nav>/);
  if (!m) return t;
  let nav = m[0];
  const nuevos = items.filter(([id]) => !nav.includes(`href="#${id}"`)).map(([id, x]) => `            <li><a href="#${id}">${x}</a></li>`).join('\n');
  if (!nuevos) return t;
  const ref = nav.match(new RegExp(`\\n[ \\t]*<li><a href="#${antesDeId}">`));
  if (ref) nav = nav.replace(ref[0], '\n' + nuevos + ref[0]);
  else nav = nav.replace(/(\r?\n[ \t]*<\/ol>)/, '\n' + nuevos + '$1');
  return t.replace(m[0], nav);
}

function sincronizarJsonLd(t, slug, c) {
  const re = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/;
  const m = t.match(re);
  if (!m) throw new Error('sin JSON-LD en ' + slug);
  const data = JSON.parse(m[2]);
  const g = data['@graph'];
  const url = `https://crediayudarte.com/${slug}/`;
  // FAQ desde lo visible
  const faqHtml = (t.match(/<div class="post-faq">([\s\S]*?)<\/div>/) || [])[1];
  const items = [...(faqHtml || '').matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map(x => ({ '@type': 'Question', name: txt(x[1]), acceptedAnswer: { '@type': 'Answer', text: txt(x[2]) } }));
  const faq = g.find(n => n['@type'] === 'FAQPage');
  if (faq && items.length) faq.mainEntity = items;
  // WebPage: nombre y descripción iguales al title y la description
  const wp = g.find(n => n['@type'] === 'WebPage' || (Array.isArray(n['@type']) && n['@type'].includes('WebPage')));
  if (wp && c.title) { wp.name = c.title; wp.description = c.desc; }
  // Service si falta
  if (c.service && !g.some(n => n['@type'] === 'Service')) {
    const svc = {
      '@type': 'Service', '@id': url + '#servicio', name: c.service[0], serviceType: 'Asesoría en crédito de libranza',
      description: c.service[1], provider: { '@id': 'https://crediayudarte.com/#organizacion' },
      areaServed: slug === 'credito-libranza-cucuta'
        ? [{ '@type': 'City', name: 'Cúcuta' }, { '@type': 'AdministrativeArea', name: 'Norte de Santander' }]
        : { '@type': 'Country', name: 'Colombia' },
      audience: { '@type': 'Audience', audienceType: c.service[2] },
    };
    const idx = g.indexOf(wp);
    g.splice(idx + 1, 0, svc);
    if (wp) wp.mainEntity = { '@id': svc['@id'] };
  }
  const json = JSON.stringify(data, null, 2);
  return t.replace(re, (m0, a, b, z) => a + '\n' + json + '\n  ' + z);
}

// ---------------------------------------------------------------- proceso
for (const [slug, c] of Object.entries(P)) {
  const f = path.join(root, slug, 'index.html');
  let t = fs.readFileSync(f, 'utf8');
  const icoAlert = t.includes('id="i-alert"');

  // Metadatos: title y description en todas sus apariciones (og, twitter, JSON-LD)
  const oldTitle = dec(t.match(/<title>([^<]*)<\/title>/)[1]);
  const oldDesc = dec(t.match(/<meta name="description" content="([^"]*)"/)[1]);
  if (c.title && oldTitle !== c.title) t = t.split(oldTitle).join(c.title);
  if (c.desc && oldDesc !== c.desc) t = t.split(oldDesc).join(c.desc);
  if (c.h1) t = t.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${c.h1}</h1>`);

  // Bloques
  if (!t.includes('id="que-revisamos"')) t = insertAntes(t, '<nav class="toc"', bloqueRevisa(c), slug);
  const antesLimites = ['<h2 id="limites">', '<h2 id="que-hacemos">', '<h2 id="no-hace">', '<h2 id="preguntas">'].find(x => t.includes(x));
  if (!t.includes('id="palabras"')) t = insertAntes(t, antesLimites, bloquePalabras(c) + bloqueDocs(c, icoAlert), slug);
  // FAQ nuevas al final de la lista visible
  for (const [q, a] of c.faq) {
    if (t.includes(`<summary>${q}</summary>`)) continue;
    t = t.replace(/(<div class="post-faq">[\s\S]*?)(\r?\n[ \t]*<\/div>)/, (m, a1, a2) => `${a1}\n          <details>\n            <summary>${q}</summary>\n            <p>${a}</p>\n          </details>${a2}`);
  }
  // Fuentes después de las preguntas (antes de "Para seguir leyendo" o del cierre del cuerpo)
  if (!t.includes('id="fuentes"')) {
    const ancla = t.includes('<h2 id="recursos">') ? '<h2 id="recursos">' : '<div class="post-cierre">';
    if (ancla === '<div class="post-cierre">') {
      // cerrar dentro de .post-body: insertar antes del </div> que cierra .post-body
      const i = t.indexOf('<div class="post-cierre">');
      const cierreBody = t.lastIndexOf('</div>', i);
      const ini = t.lastIndexOf('\n', cierreBody) + 1;
      t = t.slice(0, ini) + bloqueFuentes(c).replace(/^\n/, '') + t.slice(ini);
    } else t = insertAntes(t, ancla, bloqueFuentes(c), slug);
  }
  // Siguiente paso: reemplaza el cierre anterior
  if (!t.includes('id="siguiente-paso"')) {
    t = t.replace(/<div class="post-cierre">[\s\S]*?<p class="post-cierre__fine">[\s\S]*?<\/p>\s*\r?\n\s*<\/div>/, bloqueSiguiente(slug, c));
    if (!t.includes('id="siguiente-paso"')) throw new Error('no reemplacé el cierre en ' + slug);
  }
  // Índice
  t = tocAdd(t, [['que-revisamos', 'Qué revisamos y qué decide la entidad']], (t.match(/<nav class="toc"[\s\S]*?<li><a href="#([^"]+)"/) || [])[1]);
  t = tocAdd(t, [['palabras', 'Palabras que vas a escuchar'], ['documentos', 'Qué documentos pueden pedirte']], antesLimites.match(/id="([^"]+)"/)[1]);

  t = sincronizarJsonLd(t, slug, c);
  fs.writeFileSync(f, t);
  console.log('ok', slug);
}
