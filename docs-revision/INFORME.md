# Informe de revisión — SEO, conversión y confianza (rama `seo-conversion-2026-10`)

Fecha: 13 de octubre de 2026. **Nada se ha publicado en producción.** Los cambios están en la rama `seo-conversion-2026-10`, sin subir a GitHub.

## 1. Qué se cambió y para qué

### Portada (`/`)
- **Primera pantalla comercial.** H1: "Asesoría en créditos de libranza para pensionados y empleados públicos", con el texto de apoyo propuesto y dos acciones: "Evaluar mi caso por WhatsApp" (principal) y "Solicitar preanálisis gratuito". Debajo, la línea "Preanálisis sin costo · Sin anticipos para tramitar tu crédito · Aprobación sujeta a estudio de la entidad".
- **Tres entradas visibles** desde la primera pantalla: buscar crédito o mejores condiciones → `/credito-de-libranza/`; caso con reporte o embargo → `/credito-libranza-reportados/`; saneamiento sin cupo → `/saneamiento-financiero/`.
- "Antes de firmar, revisa" pasa a mensaje secundario (antetítulo del hero) y sigue como titular del cierre.
- Se conservan el video del isotipo, la estética y las fotos reales. El botón del recorrido automático queda como opción discreta bajo las entradas.
- Con "reducir movimiento" activado, la página ya no intercepta la rueda ni el deslizamiento (antes, cada gesto saltaba a la siguiente estación).
- En teléfonos de poca altura (360×740, 375×667) el hero recorta el texto de apoyo para que el titular, los botones, la línea de confianza y las entradas quepan en pantalla. El escenario fijo no tiene scroll propio, así que lo que no cabía quedaba inalcanzable.
- "No competimos por la tasa más baja…" se reemplazó por: buscamos condiciones competitivas y comparamos cuota, plazo, costos y dinero neto.
- El contador "9 años" se cambió por "Oficina en Cúcuta y clientes reales", porque Solicitar decía "más de 10 años" y no hay soporte para ninguna de las dos cifras.
- Se ajustaron las FAQ (costos vs. financiación externa, reportados, embargos, compartir datos, independientes); el JSON-LD se actualizó igual.

### Solicitar (`/solicitar.html`)
- **El formulario sube justo después del hero** (antes estaba debajo del recorrido y del carrusel).
- **Campos nuevos:** perfil (pensionado, empleado público, docente, Fuerza Pública), pagaduría, ciudad, objetivo, situación (buen historial, reportes o mora, embargo, sin cupo), nombre y WhatsApp.
- **Se retiraron** la edad y la subida del desprendible. El webhook de documentos (`landing-desprendible-web`) ya no se llama desde el sitio.
- **Autorización de datos** sin premarcar, que nombra a la responsable y enlaza a la política de privacidad.
- **Ya no hay un "solicitud recibida" falso.** Al enviar se abre WhatsApp en otra pestaña y la página muestra "Falta un paso: envía el mensaje en WhatsApp", con un botón para reabrirlo.
- Validación accesible: lista lo que falta y lleva el foco al primer campo. Acepta celulares colombianos y números internacionales con "+".
- Hero más claro: "Solicita tu preanálisis de libranza, sin costo". La frase "Llegó la nómina… y otra vez falta mes" queda como antetítulo.
- Se marcó como "Ejemplo ilustrativo" la tabla de cifras simulada, se quitó la insignia de "verificado" de la tarjeta de Facebook (no está comprobada), se corrigieron un enlace roto (`#servicios`) y el Instagram vacío, y el `alt` del hero ahora dice que es una ilustración.

### Páginas de servicio
- **Reportados** (misma URL): título y H1 enfocados en pensionados y empleados públicos reportados. Explica las tres situaciones (con capacidad, con embargo, sin cupo) y deja claro que no hay préstamos generales a independientes reportados. Sustituye "nadie puede modificar un reporte" por los derechos reales de actualización, corrección y retiro. Permanencia (doble de la mora, máximo 4 años desde el pago; caducidad a los 8 años si nunca se paga), consulta propia gratuita y plazos de reclamo, todo con fuente: Ley 1266 de 2008 modificada por la Ley 2157 de 2021 (texto oficial en el normograma de MinTIC).
- **Nueva `/saneamiento-financiero/`:** diagnóstico, financiación externa, pago de obligaciones, actualización, libranza posterior y cancelación de la financiación. Incluye costos por evaluar (sin cifras), la diferencia con un anticipo y qué pasa si la libranza no sale.
- **Nueva `/credito-libranza-embargos/`:** qué influye (tipo de embargo, retención, pagaduría, políticas, estado del proceso) y por qué pagar no levanta el embargo automáticamente. No publica reglas sobre "quién acepta embargos".
- **Pensionados, empleados públicos, docentes, Fuerza Pública:** nuevo bloque "Para empezar tu caso" con requisito inicial, factores de evaluación y la ruta según la situación. No se inventan convenios ni edades límite.
- **Compra de cartera:** se añadió el "saldo por recoger"; ya distinguía bajar cuota de bajar costo total.
- **Cúcuta:** bloque "Datos de la oficina" (dirección, mapa, WhatsApp, presencial con cita, virtual, quién opera). Se eliminó "tenemos aliados en varias ciudades" porque no está comprobado; ahora dice que no hay sedes en otras ciudades.
- **Promesas de tiempo:** se quitó "el preanálisis toma entre 24 y 48 horas hábiles" de 8 páginas.

### Confianza e identidad
- **Pie de todas las páginas:** "CrediAyudarte, nombre comercial de Marilú Arévalo Toro (persona natural)", qué es y qué no es, y enlaces a las páginas nuevas.
- **Quiénes somos:** sección "Quién está detrás" y las tres situaciones que se atienden.
- **Privacidad, reescrita.** Antes decía que el sitio no usaba píxeles de publicidad, pero el Meta Pixel está en Inicio y Solicitar. Ahora identifica a la responsable, describe los datos del formulario nuevo y los anteriores, y nombra a los proveedores (n8n, Supabase, Google, Meta). Explica que compartir con entidades o financiadores requiere tu autorización, y cita los plazos de la Ley 1581 (consultas 10 días hábiles, reclamos 15) y la queja ante la SIC.
- El centro comercial se escribe en todo el sitio como "Centro Comercial Internacional" (alternaba con "International").

### SEO técnico
- **`nginx.conf`:**
  - `absolute_redirect off`: antes `/credito-libranza-reportados` redirigía a `http://…`, un salto extra fuera de https.
  - 301 de `/index.html` y `/home/` a `/`, y de `/solicitar` y `/testimonios` a sus `.html` (antes daban 404).
- **`robots.txt`:** separa los rastreadores de búsqueda (Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot) de los de entrenamiento (Google-Extended, GPTBot, ClaudeBot), según la documentación oficial vigente de cada empresa. Se quitó `anthropic-ai`, que ya no figura en la documentación de Anthropic. Se mantiene la decisión actual de permitir todos.
- **`sitemap.xml`:** dos URL nuevas (24 en total) y `lastmod` actualizado.
- Títulos y metadescripciones únicos y más cortos. Datos estructurados solo con información visible y verdadera. No se declaró a CrediAyudarte como banco o prestamista, ni se añadieron reseñas, calificaciones u horarios.
- **Accesibilidad:** contraste del texto legal del pie y del texto fino de cierre; títulos del pie de `h4` a `h2` (había saltos de nivel); `<main>` en las páginas nuevas.
- Versiones `?v=` actualizadas en los CSS y JS modificados (nginx los guarda en caché 7 días).
- `index.md` (versión Markdown de la portada) y `llms.txt` se alinearon con el nuevo mensaje, sin darles prioridad.

### Medición (`js/medicion.js`, nuevo, en todas las páginas)

| Evento | Qué significa | Meta Pixel (solo Inicio y Solicitar) |
|---|---|---|
| `whatsapp_click` | Clic en un enlace a WhatsApp. **No** es una conversación. | `WhatsAppClick` (personalizado) |
| `phone_click` | Clic en `tel:` (hoy no hay enlaces de teléfono en el sitio) | `PhoneClick` |
| `form_start` | Primera interacción con el formulario | `FormStart` (el mismo de antes) |
| `form_submit` | Formulario válido enviado al CRM: es una solicitud registrada, no un crédito | `Lead` (el mismo evento estándar de antes, para no alterar campañas) |
| `whatsapp_open_form` | Se abrió WhatsApp con el mensaje del formulario; falta que la persona lo envíe | `WhatsAppOpenForm` |

- Solo se envían la ubicación del botón y la página. Nunca nombres, teléfonos, ingresos, reportes, embargos ni texto libre (comprobado en prueba).
- Conversaciones reales, solicitudes atendidas y desembolsos se miden en WhatsApp Business y en el CRM.
- **GA4 está preparado pero apagado.** Falta el ID de medición (`G-…`) en la constante `GA4_ID`. Mientras esté vacío no se carga nada.
- Los UTM de la visita se adjuntan a la solicitud del CRM. Sirven para medir el Perfil de Empresa.

## 2. URL y archivos

- **URL nuevas:** `/saneamiento-financiero/`, `/credito-libranza-embargos/`.
- **URL cambiadas:** ninguna. Solo se añadieron redirecciones 301 para variantes que daban 404 o duplicaban contenido.
- **Archivos nuevos:** `js/medicion.js`, `saneamiento-financiero/index.html`, `credito-libranza-embargos/index.html`, `docs-revision/` (excluido del despliegue en `.dockerignore`).
- **Archivos modificados:** `index.html`, `index.md`, `solicitar.html`, `testimonios.html`, `404.html`, `about/`, `privacy/`, `credito-de-libranza/`, las 4 páginas por público, `credito-libranza-reportados/`, `compra-de-cartera/`, `credito-libranza-cucuta/`, `blog/` (solo pie y versiones), `css/home.css`, `css/solicitar.css`, `css/styles.css`, `css/blog.css`, `css/landing.css`, `js/cine.js`, `js/home.js`, `js/solicitar.js`, `js/recorrido.js`, `nginx.conf`, `robots.txt`, `sitemap.xml`, `llms.txt`, `.dockerignore`.

Diferencias completas: `git diff main...seo-conversion-2026-10`.

## 3. Capturas (`docs-revision/capturas/`)

- **Antes:** `antes-home-d.webp`, `antes-home-m.webp`, `antes-sol-d.webp`, `antes-sol-m.webp`.
- **Después, portada:** `final-home-1440.webp`, `final-home-1366.webp`, `final-home-390.webp` (iPhone 12–15), `final-home-360.webp` (Android pequeño).
- **Después, Solicitar:** `final-sol-1440.webp`, `final-sol-390.webp`, formulario `final-form-1440.webp` y `final-form-390.webp`, y estado después de enviar `form-enviado-m.webp`.

Vista previa local: `npx serve` (o cualquier servidor estático) en la carpeta del repo, en la rama `seo-conversion-2026-10`.

## 4. Pruebas realizadas y resultados

| Prueba | Resultado |
|---|---|
| Auditoría de las 24 URL del sitemap (Chrome sin interfaz) | 24/24 con 200, un H1 cada una, canonical correcto, robots `index`, JSON-LD válido, sin errores de JavaScript, 0 enlaces internos rotos y 0 anclas inexistentes (se corrigió `index.html#proceso` en Testimonios) |
| FAQ del JSON-LD frente al texto visible | Coinciden en las 24 páginas |
| Formulario: autorización | No viene marcada; sin ella no se envía nada |
| Formulario: validación | Mensaje con los campos que faltan, foco en el primero, celular inválido rechazado |
| Formulario: WhatsApp | Abre `wa.me/573152474348` con el mensaje bien codificado (tildes y saltos de línea) |
| Formulario: CRM | Payload con las claves de siempre y las nuevas, más UTM. **Prueba sin envío real:** `fetch` simulado y 0 peticiones a la red |
| Analítica | Sin datos personales en `dataLayer` ni en el Pixel |
| Clic en WhatsApp de páginas internas | Se registra con su ubicación |
| Portada sin JavaScript | H1, botones y entradas visibles en HTML |
| Reducir movimiento | La rueda desplaza 120 px en lugar de saltar a la siguiente estación (2.232 px) |
| `nginx.conf` | Sintaxis validada con `nginx -t` (nginx 1.26.2). Redirecciones probadas con nginx real en local: `Location` relativo, 301 y 404 correctos, negociación Markdown intacta |
| Lighthouse móvil, laboratorio | Ver abajo |

**Lighthouse móvil (laboratorio, no son Core Web Vitals de usuarios reales)**

| Página | Producción actual | Local antes | Local después |
|---|---|---|---|
| Inicio | Rendimiento 80 · Accesibilidad 94 · SEO 100 · LCP 3,7 s | Rendimiento 58 · Accesibilidad 94 · LCP 5,3 s | Rendimiento 61 · **Accesibilidad 100** · SEO 100 · LCP 5,3 s · CLS 0 |
| Solicitar | Rendimiento 70 · Accesibilidad 94 · LCP 4,7 s | Rendimiento 51 · Accesibilidad 94 · LCP 7,1 s | Rendimiento 55 · **Accesibilidad 100** · LCP 7,1 s · CLS 0 |
| Reportados / Saneamiento | — | — | Rendimiento 80 / 83 · Accesibilidad 96 |

El servidor local no comprime ni usa CDN; por eso compara bien antes/después pero da números peores que producción. El 96 de las páginas de servicio se debe al botón verde de marca con texto blanco (contraste 2,5:1), una decisión de marca ya aceptada.

Los Core Web Vitals reales se ven en Search Console o PageSpeed Insights, con datos de campo, varias semanas después de publicar.

## 5. Pendientes que requieren información o accesos

1. **CRM (antes de publicar):** confirmar que el flujo n8n `landing-lead-score` acepta el payload nuevo:
   - `edad: null` y `apellido: ""`.
   - Los nuevos valores de `perfil`: "Empleado público" (antes "Empleado del gobierno"), "Docente del Estado" y "Fuerza Pública".
   - `vida_crediticia` con "Sin cupo en el desprendible".
   - Los campos nuevos `pagaduria`, `ciudad`, `objetivo`, `situacion`, `autorizacion_*`, `utm_*`, `pagina_entrada` y `referrer`, que necesitan columnas en Supabase si se quieren guardar.

   Lo debe probar alguien con acceso a n8n, con una ejecución de prueba controlada. Aquí no se envió ninguna solicitud real.
2. **GA4:** falta el ID de medición, si se quiere GA4. Hay que decidir también si el Pixel de Meta debe estar en todas las páginas (hoy solo en Inicio y Solicitar). Si se amplía, hay que actualizar la política de privacidad.
3. **Experiencia:** falta la fecha real de inicio del negocio y los años de experiencia profesional de la titular. Con eso se puede volver a mostrar una cifra con soporte, distinguiendo una cosa de la otra.
4. **Tiempo del preanálisis:** si la operación puede cumplir un plazo (por ejemplo 24–48 h hábiles), se puede restaurar.
5. **Honorarios:** varias páginas existentes dicen "nuestros honorarios se pagan solo si hay desembolso". Hay que confirmar que es exacto y si aplica igual al saneamiento.
6. **Saneamiento:** falta validar con la operación quién paga a los acreedores, qué tipo de financiadores participan y qué se firma. El texto se dejó general a propósito.
7. **Revisión jurídica** por un abogado de Reportados, Embargos, Saneamiento y Privacidad. Las afirmaciones se apoyan en la Ley 1266/2157 y la Ley 1581, pero no sustituyen esa revisión.
8. **Correo para Habeas Data:** recomendado, además del WhatsApp.
9. **Instagram:** confirmar que `instagram.com/crediayudarte` es la cuenta oficial (desde aquí no se pudo verificar).
10. **Horarios:** el sitio no publica horarios. Definirlos en el Perfil de Empresa, o indicar "con cita".
11. **Imágenes generadas:** el hero de Solicitar y el recorrido usan ilustraciones generadas. Se recomienda reemplazarlas por fotos reales de la oficina o del equipo.
12. **Blog:** no se reescribió. Conviene revisar el artículo "Pagar una deuda antigua…": dice "reinicia el reloj" y no menciona la caducidad de 8 años.
13. **Subdominio `www`:** hoy no resuelve. Opcional: crear el DNS y redirigir al dominio principal.
14. **Rastreadores de entrenamiento:** hoy están permitidos. Si se quieren excluir, basta cambiar un bloque de `robots.txt`, sin afectar la búsqueda.
15. **Contraste del botón verde:** el blanco sobre el verde de marca no llega a AA. Si se quiere, se puede oscurecer el verde de los botones.

## 6. Perfil de Empresa de Google

Ver `docs-revision/PERFIL-EMPRESA-GOOGLE.md`.

## 7. Publicación y reversión

**Para publicar (después de revisar):**
1. Revisar la rama en local y resolver el pendiente 1 (n8n/Supabase).
2. `git switch main && git merge --no-ff seo-conversion-2026-10 && git push origin main`. El servidor que construye la imagen Docker desde `main` redesplegará; confirma en tu plataforma de despliegue que funciona así.
3. Verificar en producción:
   - `curl -I https://crediayudarte.com/credito-libranza-reportados` debe responder 301 con `Location: /credito-libranza-reportados/`.
   - `/saneamiento-financiero/` y `/credito-libranza-embargos/` deben responder 200.
   - `/robots.txt` y `/sitemap.xml` deben mostrar las versiones nuevas.
4. Hacer una solicitud de prueba controlada desde el formulario y comprobar que llega a n8n/Supabase y que WhatsApp se abre con el mensaje.
5. En Search Console: reenviar `sitemap.xml` y pedir la indexación de las dos páginas nuevas, de Reportados y de la portada.
6. En Meta Events Manager, revisar que aparezcan `Lead`, `FormStart`, `WhatsAppClick` y `WhatsAppOpenForm`.

**Para revertir:**
- **Todo:** `git revert -m 1 <commit de merge>` y `git push origin main`, o redesplegar el commit anterior (`acc49fe`) desde la plataforma.
- **Solo el formulario:** restaurar `solicitar.html` y `js/solicitar.js` desde `main` (`git checkout acc49fe -- solicitar.html js/solicitar.js`). El webhook seguirá recibiendo las claves de siempre.
- Las páginas nuevas pueden quedarse aunque se revierta lo demás. Si se eliminan, conviene una redirección 301 a `/credito-libranza-reportados/` para no dejar 404 indexados.
