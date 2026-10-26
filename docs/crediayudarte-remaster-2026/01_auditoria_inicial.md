# 01 · Auditoría inicial

Fecha: 25 de octubre de 2026. Rama de trabajo: `remaster-comercial-2026-10`. Versión anterior recuperable con el tag git `antes-remaster-2026-10` (commit `91debdb`).

## Estado encontrado

| Punto | Hallazgo |
|---|---|
| Git | `main` limpio y al día con `origin/main`. La ronda "SEO, conversión y confianza" (rama `seo-conversion-2026-10`) ya estaba fusionada y publicada el 21-oct-2026. |
| Local vs. producción | `index.html` y `solicitar.html` de producción son idénticos a `main` local (comparado con `curl` y `diff`, ignorando finales de línea). |
| Tecnología | Sitio estático: HTML + CSS + JavaScript sin framework. Se sirve con `nginx` dentro de Docker (`Dockerfile`, `nginx.conf`). No hay paso de compilación ni pruebas automatizadas en el repo. |
| Páginas | 24 URL en `sitemap.xml`: Inicio, Solicitar, Testimonios, 10 páginas de servicio, Quiénes somos, Privacidad y blog (índice + 8 artículos). |
| Hero animado | La Home era un escenario "cinematográfico" fijo (`section.cine`, `js/cine.js`, 26 KB): un video de 21 s generado con IA (Higgsfield/Kling), recorrido con el scroll, con 6 estaciones. Cada gesto saltaba a la estación siguiente. Más un índice lateral de 12 puntos y un recorrido automático (`js/tour.js`). Medios: unos 34 MB entre `hero.mp4/webm` y fotogramas (`assets/cine/v/`), cargados después del primer scroll. `css/home.css` pesaba 67 KB, la mitad del escenario. |
| Mensajes | El H1 ya era comercial ("Asesoría en créditos de libranza para pensionados y empleados públicos"). Pero seguían 4 estaciones de frases conceptuales: "Lo primero que ves no es todo", "Entender cambia la decisión", "Cada perfil se revisa distinto", "Decide con claridad". |
| Formulario (`/solicitar.html`) | Ya simplificado en la ronda anterior: perfil, pagaduría, ciudad, objetivo, situación, nombre, WhatsApp y autorización sin premarcar. No pide cédula, fecha de nacimiento ni documentos. Envía al webhook n8n `landing-lead-score` sin bloquear, abre WhatsApp y muestra "Falta un paso" (no un "recibido" falso). Faltaba: prevención de doble envío, protección antispam y la ciudad era obligatoria sin necesidad operativa clara. |
| WhatsApp | Número único y correcto en todo el sitio: `wa.me/573152474348` (+57 315 247 4348). Mensaje prellenado genérico, igual en casi todos los botones. |
| SEO técnico | `robots.txt` y `sitemap.xml` válidos. Canonical correcto en las 24 URL. 301 en `nginx.conf` para `/index.html`, `/home/`, `/solicitar` y `/testimonios`. JSON-LD sin reseñas ni calificaciones inventadas. |
| Favicon | Todas las páginas usaban el logo horizontal (454×120) como favicon: ilegible en una pestaña. No existía `/favicon.ico`. |
| Analítica | Meta Pixel solo en Inicio y Solicitar. `js/medicion.js` envía eventos sin datos personales a `dataLayer` y al Pixel. GA4 preparado pero apagado: falta el ID. |
| Confianza | Pie con titular (persona natural), dirección, qué es y qué no es. Fotos y videos reales de clientes en `assets/testigos/` (publicados como "con su permiso"). Sin cifras de años: se retiraron en la ronda anterior por falta de soporte. |
| Accesibilidad | Lighthouse 100 en Inicio. El botón verde de marca con texto blanco no llega a AA (2,5–2,8:1): decisión de marca registrada. |

## Diagnóstico

| Conservar | Eliminar | Mejorar | Construir |
|---|---|---|---|
| Identidad (blanco, verde y amarillo del logo, Archivo en mayúsculas para titulares, marcador amarillo) | Escenario cinematográfico de la Home (`cine.js`), índice lateral y recorrido automático (`tour.js`) | Favicon en las 25 páginas | Hero estático con foto real, dos acciones y prueba de confianza |
| Las 24 URL, sus títulos, el canonical y las redirecciones | Frases conceptuales de las estaciones | Formulario: ciudad opcional, doble envío, antispam, textos más grandes | Sección "¿Qué necesitas hacer?" por situaciones |
| Páginas de servicio, privacidad y blog | 12 preguntas frecuentes de la Home repetidas en páginas de servicio | WhatsApp con mensaje según el perfil y la situación | Sección "¿Por qué hablar con nosotros?" con "Lo que nunca hacemos" |
| Formulario y su contrato con n8n | | Contraste de dos elementos de Solicitar | Botón "volver arriba" y transición entre páginas |
| `medicion.js` y el Meta Pixel | | | Documentación de esta carpeta |

No se reconstruyó el sitio: fue una refactorización de la Home y ajustes puntuales en el resto.
