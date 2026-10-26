# 07 · Cambios implementados

Rama `remaster-comercial-2026-10`. Nada publicado en producción. Versión anterior: tag `antes-remaster-2026-10`.

## Home

- `index.html` reescrito:
  - El escenario cinematográfico se reemplaza por un hero estático con foto real.
  - Secciones nuevas: "¿Qué necesitas hacer?" y "¿Por qué hablar con nosotros?".
  - Tarjetas de perfil con dos acciones.
  - "Cómo funciona" pasa a 3 pasos.
  - Preguntas: de 25 en 3 páginas a 13 en una sola lista. Las que se quitaron tienen su respuesta en las guías de docentes, Fuerza Pública, Cúcuta, reportados y pensionados.
  - JSON-LD alineado con las preguntas visibles.
  - Título y descripción nuevos.
- `css/home.css`: se retiraron el escenario, el índice lateral y el recorrido automático (de 67 a 34 KB). Estilos nuevos: hero, situaciones, beneficios y enlaces de WhatsApp. "Cómo funciona" a 3 columnas. Desplazamiento suave respetando "reducir movimiento".
- `js/home.js`: sin índice lateral. El botón flotante de WhatsApp aparece después del hero.
- **Eliminados:** `js/cine.js` y `js/tour.js` (sin referencias).
- **Nuevos:** `assets/home/asesoria-oficina-900.webp`, `-600.webp` y `-m.webp`.
- `index.md` (versión Markdown para agentes) reescrito con el mismo mensaje. `sitemap.xml`: `lastmod` de Inicio y Solicitar.

## En todo el sitio

- **Favicon:** las 25 páginas pasan del logo horizontal al isotipo (`assets/favicon-32.png`, `icon-192.png`, `apple-touch-icon.png`), más `/favicon.ico`.
- **Volver arriba** (`js/script.js` + `css/styles.css`): aparece después de dos pantallas, encima del botón de WhatsApp, y devuelve el foco al H1.
- **Transición entre páginas:** fundido de 0,22 s con `@view-transition`, solo si el navegador lo soporta y la persona no pidió reducir movimiento.
- **Contraste:** botón de Facebook más oscuro y usuario de Facebook en gris legible (Solicitar).
- **Caché:** `?v=20261025` en `styles.css`, `script.js`, `home.css`, `home.js`, `solicitar.css` y `solicitar.js`.
- `.dockerignore`: `docs/` no se publica.

## Solicitar

- La ciudad pasa a opcional. El CRM la recibe vacía y el mensaje de WhatsApp dice "no la indiqué".
- No se registra dos veces la misma solicitud: si se vuelve a tocar el botón, solo se reabre WhatsApp. El botón se bloquea 2,5 s tras enviar.
- Campo trampa invisible: si llega con texto, no se registra ni se mide como lead.
- Los botones flotantes se esconden mientras el formulario está en pantalla.
- Textos de ayuda, error y autorización más grandes. El error se muestra en una caja visible.
- **El contrato con n8n no cambió:** mismas claves y mismos valores.

## La lista de "20 funciones" pedida durante el trabajo

| # | Función | Estado |
|---|---|---|
| 1 | Animaciones suaves al hacer scroll | Sí: revelado sutil existente. Sin JS o con "reducir movimiento", todo visible y quieto. |
| 2 | Microinteracciones en botones | Sí: elevación al pasar el cursor, flecha que avanza, presión al tocar. |
| 3 | Estados hover | Sí: tarjetas, chips de perfil, enlaces de WhatsApp y botones. |
| 4 | Responsive | Sí, probado en 1440, 1366, 390 y 360 px, sin desbordamiento horizontal. |
| 5 | Navegación móvil | Sí: menú hamburguesa probado (abre, `aria-expanded`, 7 enlaces). |
| 6 | Favicon propio | Sí, nuevo en las 25 páginas. |
| 7 | Volver arriba | Sí, nuevo en todo el sitio. |
| 8 | Pantalla de carga / skeleton | **No.** El encargo pide "sin loaders" y retrasaría ver el contenido. La página carga sin esperas. |
| 9 | Transiciones | Sí: fundido corto entre páginas. |
| 10 | Animación del hero | **Adaptada:** entrada suave del texto y la foto (0,7 s), sin video. El encargo prohíbe un hero cinematográfico. |
| 11 | CTA repetido | Sí: hero, perfiles, situaciones, pasos, cierre, menú y botón flotante. |
| 12 | Formulario de contacto | Sí, el de `/solicitar.html`, mejorado. |
| 13 | Validación | Sí: dice qué falta, lleva el foco al primer campo y valida el celular. |
| 14 | Error / salida | Sí: página 404 con mapa del sitio (existente), errores del formulario y confirmación honesta. |
| 15 | Modo oscuro | **No.** Regla de la marca: "nada de fondos negros". |
| 16 | Idioma | **No.** El público es colombiano y el sitio declara `es-CO`. Traducir no atrae clientes que se puedan atender. |
| 17 | Botones de redes sociales | Sí: Facebook, Instagram y WhatsApp en el pie (existentes). |
| 18 | Testimonios | Sí: sección en la Home y página propia (existentes, fotos y videos reales). |
| 19 | Optimización de velocidad | Sí: se retiró el video del hero. Home móvil: de 531 a 237 KB, LCP de laboratorio de 4,3 a 3,1 s. |
| 20 | (sin texto en la imagen) | — |
