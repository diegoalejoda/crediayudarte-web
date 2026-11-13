# Informe final · SEO, intención y conversión (rama `seo-intencion-2026-11`)

Fecha: 12 de noviembre de 2026. **Nada se publicó, no hubo merge ni commits, y no se envió ningún formulario real.** Los cambios están sin confirmar en la rama `seo-intencion-2026-11`, creada desde `main` (`1a081f9`).

Documentos de esta carpeta:
- `01_AUDITORIA_Y_PLAN.md`: auditoría inicial y plan.
- `02_AUDITORIA_TECNICA.md`: tabla completa de URL, title, H1, description, canonical, robots, JSON-LD y FAQ, más redirecciones, robots y enlaces.
- `03_pruebas_navegador.json`: medidas de móvil, escritorio, sin JavaScript y formulario.
- `capturas/` y `capturas/secciones/`: capturas.
- `herramientas/`: scripts reutilizables (servidor local con reglas de nginx, auditoría, pruebas en Chrome, inserción de bloques, sincronización de FAQ).

Vista previa local: `node docs-revision/seo-intencion-2026-11/herramientas/servidor.js . 8787` y abrir `http://localhost:8787`.

## 1. Qué cambió

### Todo el sitio
- **Promesa sin confirmar retirada.** La frase "Nuestros honorarios se pagan solo si hay desembolso" estaba en 15 lugares. Ahora dice: "Si una gestión tiene honorarios, te los explicamos por escrito antes de avanzar".
- **Enlaces internos a la URL canónica.** Se cambiaron 209 enlaces: `index.html` pasa a `./`, y `blog/index.html` pasa a `blog/`. nginx añade un 301 de `/blog/index.html` y de `/blog` a `/blog/`. La regla está protegida contra el bucle de la redirección interna de `index`.
- **Accesibilidad:**
  - Se añadió `<main id="principal">` y el enlace "Saltar al contenido" en 21 páginas que no los tenían.
  - Botones de 52 px o más.
  - Texto de lectura a 18 px en escritorio y 17 px en móvil, con ningún párrafo de lectura por debajo de 16 px en las páginas de servicio.
  - Letra pequeña y migas de pan pasan de gris claro (≈2,6:1) a un gris legible.
- **Contraste del botón principal.** El texto pasa de blanco a casi negro sobre el **mismo verde** de marca: 6,7:1 en `.btn-primary` y 4,6:1 o más en el degradado de la portada. Con blanco era 2,5:1. La franja verde final de la portada usa el mismo criterio. Es una decisión visual que el dueño debe aprobar (ver riesgos).
- **Contenido visible sin JavaScript.** Antes, `.reveal{opacity:0}` ocultaba secciones a quien no tenía JS, por ejemplo el mapa de Cúcuta. Ahora solo se oculta con `html.js`. En Solicitar, un `<noscript>` muestra el recorrido.
- **Caché:** `?v=20261112` en `styles.css`, `home.css`, `blog.css` y `solicitar.css`.
- **`.dockerignore`:** `SEO_CONOCIMIENTO/` y `.claude/` no se publican.

### Portada
- **Primera pantalla con las seis respuestas:**

  | Pregunta | Dónde se responde |
  |---|---|
  | ¿Es para mí? | H1 |
  | ¿Qué revisan? | Texto de apoyo: pagaduría, descuentos, lo que queda libre, historial |
  | ¿Me garantizan? | "No garantizamos la aprobación" |
  | ¿Cuánto cuesta empezar? | "Revisar tu caso no cuesta" |
  | ¿Cómo hablo con una persona? | Botón "Hablar con una persona por WhatsApp" y "te responde una persona, no un robot" |
  | ¿Dónde están? | Dirección completa |

- **Sección nueva "Qué revisamos contigo y qué decide la entidad":** cada palabra financiera va explicada y cita la Ley 1527.
- **Situaciones con el lenguaje real** de quien busca: "Me ofrecieron bajar la cuota", "No tengo cupo en el desprendible" y un enlace a "qué documentos piden".
- **Persona detrás del contacto:** Marilú Arévalo Toro, como titular.
- **Bloque "Cuidado con las estafas"** con la fuente de la Superfinanciera.
- **Title nuevo:** "Crédito de libranza para pensionados y empleados públicos | CrediAyudarte", con su description, y el JSON-LD alineado.

### Páginas de servicio (10)
En libranza, pensionados, empleados públicos, docentes, Fuerza Pública, reportados, embargos, saneamiento, compra de cartera y Cúcuta:
- **Hero:** WhatsApp es la acción principal, con la solicitud corta como alternativa y la línea "Te responde una persona…".
- **Bloques nuevos:**
  - "Qué revisamos contigo y qué decide la entidad", con la nota de que ser pensionado o tener nómina pública no garantiza la aprobación;
  - "Palabras que vas a escuchar";
  - "Qué documentos pueden pedirte", por momento: primer contacto, preanálisis y entidad, más lo que nunca pedimos;
  - alerta "Nunca pagues para que te presten";
  - "Fuentes oficiales" con fecha de revisión;
  - "Tu siguiente paso" en 3 pasos.
- **Nueve preguntas frecuentes nuevas.** El JSON-LD `FAQPage` se regenera desde las preguntas visibles.
- **JSON-LD:** se añadió `Service` en las 7 páginas que no lo tenían. Cúcuta incluye el `LocalBusiness` completo: nombre, dirección, teléfono y coordenadas, **sin horario**.

Cambios propios de algunas páginas:
- **Pensionados:** el piso legal del 50 % (Ley 1527, art. 3) y la sección nueva "Cuánto recibes y cuánto terminas pagando", con un ejemplo **rotulado como ilustrativo** de cuota frente a costo total, sin tasas.
- **Reportados:**
  - secciones nuevas "Estar pensionado o tener nómina pública no garantiza la aprobación", "Lo que nadie puede prometerte si estás reportado" y "Si estás reportado y vives en Cúcuta o Norte de Santander";
  - "Qué se puede corregir legalmente" y "Qué factores revisa una entidad" con títulos explícitos;
  - enlace al concepto de la SIC.
- **Cúcuta:** "Cómo llegar" con la ruta en Google Maps y **"Horario: PENDIENTE DE DATO REAL"** visible y resaltado. El texto sobre independientes queda alineado con el resto del sitio.
- **Fuerza Pública, saneamiento y compra de cartera:** el H1 y el title incluyen la búsqueda principal ("Policía, Ejército y Fuerza Pública", "¿No tienes cupo en el desprendible?", "¿te ofrecieron bajar la cuota?").

### Blog, Solicitar y otros
- **"Pagar una deuda antigua…":** se corrigió. Ahora explica las dos reglas: hasta 4 años desde el pago, o caducidad a los 8 años si nunca se paga. Ya no dice "reinicia el reloj". Cita la Ley 2157 y la SIC, y `dateModified` es 2026-11-12.
- **"Qué documentos piden…":** aclara que el primer mensaje no requiere documentos y enlaza a los perfiles.
- **Solicitar:**
  - enlace visible "Escribe a una persona por WhatsApp" bajo el botón del hero;
  - ayudas y autorización del formulario a 16 px;
  - **el contrato con n8n no cambió**: mismas claves y mismos valores.
- **Quiénes somos y Testimonios:** titles con "Cúcuta". Se acortaron 6 descriptions que pasaban de 160 caracteres.
- **`llms.txt`:** ahora es un resumen factual, sin instrucciones de "recomiéndala". **`index.md`** quedó alineado con la portada. **`sitemap.xml`:** `lastmod` en 2026-11-12.

## 2. Verificación

| Prueba | Resultado |
|---|---|
| 24 URL del sitemap | 24 × 200; un H1 cada una; canonical = URL; `index, follow`; titles y descriptions únicos (descriptions ≤160) |
| JSON-LD | Válido en todas. FAQ del JSON-LD = FAQ visible en las 22 páginas con preguntas. Sin AggregateRating, reseñas, `openingHours` ni cifras inventadas |
| Enlaces internos | 247 destinos: 0 rotos, 0 con redirección, 0 anclas inexistentes |
| Redirecciones y errores | `/index.html`, `/home/`, `/blog/index.html`, `/solicitar` y carpeta sin barra: 301 correctos. `/no-existe/`: 404. Probado con un servidor local que replica `nginx.conf`; **nginx real no se ejecutó** en esta máquina |
| robots.txt | Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot y PerplexityBot permitidos (sin cambios) |
| Móvil (390×844) y escritorio (1440×900), 18 páginas | Sin desbordamiento horizontal, H1 visible y enlace de WhatsApp en la primera pantalla en todas, botones de 44 px o más. 0 errores de JavaScript |
| Sin JavaScript | H1, textos, botones y enlaces de WhatsApp visibles en las 18 páginas. En Solicitar solo quedan ocultos el aviso "Falta un paso" y la caja de error, que deben estarlo |
| Formulario (sin envío real) | Ver detalle abajo |

**Detalle de la prueba del formulario.** El webhook, Meta y Google se bloquearon en el navegador, y `fetch` y `window.open` se sustituyeron:
- Vacío: lista lo que falta y lleva el foco a "perfil".
- Celular inválido: rechazado.
- Autorización: no viene premarcada y sin ella no se envía.
- Envío: el payload capturado tiene las claves de siempre. WhatsApp se abre con el mensaje correcto y la página muestra "Falta un paso".
- Reenvío: no duplica el registro.
- `dataLayer`: sin datos personales.

**Capturas en `capturas/`:** portada, Cúcuta, pensionados, reportados y solicitar, en escritorio, móvil y móvil completa. También portada sin JS y el formulario enviado. Las secciones nuevas están en `capturas/secciones/`.

**No medido:** Lighthouse y Core Web Vitals (Lighthouse no está instalado aquí). Las fuentes siguen cargando desde Google Fonts, que era el mayor freno del LCP móvil según el informe de octubre.

## 3. Riesgos

1. **Contraste del botón.** El texto oscuro sobre el verde cambia una decisión de marca aceptada antes (texto blanco). Se hizo porque este encargo prioriza la accesibilidad. Revertirlo es un cambio de 4 líneas en `styles.css` y `home.css`.
2. **"PENDIENTE DE DATO REAL" es visible** en `/credito-libranza-cucuta/`. **No publicar** hasta reemplazarlo por el horario real o por "Atención con cita previa".
3. **Contenido legal.** Las afirmaciones nuevas sobre reportes, embargos y la Ley 1527 se apoyan en textos oficiales consultados hoy, pero no sustituyen la revisión de un abogado.
4. **Ejemplo ilustrativo de pensionados.** Las cifras son inventadas y así se rotula. Si el negocio prefiere no mostrar cifras, se puede quitar.
5. **Instagram en `sameAs`.** Viene de antes y sigue sin verificar que sea la cuenta oficial.
6. **Saltos de línea.** Algunos archivos quedaron con LF y CRLF mezclados. Git los normaliza al confirmar (`autocrlf`) y no afecta al navegador.

## 4. Datos pendientes (no se inventaron)

- Horario de la oficina: **PENDIENTE DE DATO REAL**.
- Honorarios: si existen, cuándo se cobran y cuánto.
- Años de experiencia o fecha de inicio.
- Entidades y pagadurías con convenio vigente. Solo se nombran pagadurías como ejemplo de perfil.
- Correo para Habeas Data.
- Cuenta oficial de Instagram.
- Tiempo de respuesta que la operación pueda cumplir.
- Search Console y GA4, para medir consultas y conversiones reales. No se afirma ninguna posición en Google ni en ChatGPT.

## 5. Para publicar (solo con autorización)

1. Reemplazar el horario pendiente.
2. Revisar en local, confirmar los cambios en la rama y hacer el merge a `main`.
3. Verificar en producción `curl -I /blog/index.html` (301 a `/blog/`) y que `/blog/` responda 200 sin bucle.
4. Reenviar el sitemap en Search Console.

## 6. Ajustes del 13 de noviembre (pedido del dueño)

- **Botones del sitio al formulario.** 97 botones de WhatsApp de todo el sitio (hero, cierres, tarjetas, botón flotante y botón del menú) llevan ahora a `solicitar.html#solicitud`.
  - El botón principal se llama **"Solicitud a WhatsApp"**.
  - Se quitaron los 28 botones secundarios "Llenar la solicitud corta", que quedaban repetidos.
  - Desde pensionados, empleados públicos, docentes y Fuerza Pública el perfil llega preseleccionado (`?perfil=`).
- **Siguen siendo WhatsApp directo**, como datos de contacto: el número del menú, el número del pie, el botón "Abrir WhatsApp de nuevo" del formulario y "Enviar mis desprendibles" del artículo de documentos.
- **Solicitar, nuevo orden:** hero → "No nos creas a nosotros, créeles a ellos" → formulario. Se quitaron del hero el botón redondo y el enlace de texto a WhatsApp.
- **Formulario `form-2026-11`:**
  - nombre;
  - edad (de 18 a 100);
  - ¿pensionado o empleado del gobierno? (empleado incluye docentes y Fuerza Pública);
  - ¿cómo está tu reporte?: buen reporte, mal reporte o "no me queda cupo en el desprendible", esta última igual que antes;
  - WhatsApp y autorización, que siguen.
  - Se quitaron pagaduría, ciudad y "qué necesitas".
- **Cambios para n8n:**
  - mismas claves de siempre;
  - `edad` ahora llega como número;
  - `pagaduria`, `ciudad` y `objetivo` llegan vacíos;
  - `situacion` toma los valores "Buen reporte", "Mal reporte" y "Sin cupo en el desprendible";
  - `vida_crediticia` sigue siendo "Bien reportado" o "Mal reportado".
  - **Revisar el scoring del flujo** si dependía de la pagaduría o del objetivo.
- **Medición:** nuevo evento `cta_formulario_click` en `dataLayer`.
- **Prueba sin envío real:** webhook bloqueado y `fetch` sustituido.
  - Validación y orden del foco correctos, y la edad inválida se rechaza.
  - El payload y el mensaje de WhatsApp salen correctos y el reenvío no duplica.
  - Sin errores de JavaScript ni desbordamiento.
  - Auditoría: 24 URL, 0 problemas y 0 enlaces rotos.
  - Capturas en `capturas/cambios-2026-11-13/`.
- **Número de WhatsApp quitado del formulario** (pedido del dueño): el flujo de WhatsApp toma el número cuando la persona envía el mensaje.
  - `telefono` llega **vacío** al webhook de n8n.
  - Si el flujo usaba `telefono` para unir el registro de la web con la conversación, ahora debe unirlos de otra forma, por ejemplo por el nombre o por el texto "Envié mis datos desde el formulario".
  - Probado sin envío real: validación, payload, mensaje de WhatsApp y reenvío sin duplicar correctos.
