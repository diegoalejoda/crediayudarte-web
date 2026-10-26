# 08 · Pruebas y resultados

Entorno: servidor estático local con gzip y Chrome sin interfaz manejado por CDP (scripts en el directorio temporal de la sesión). Se bloquearon el Meta Pixel y el webhook real: **ninguna prueba envió datos a n8n, a Supabase ni a Meta**. El sitio no tiene suite de pruebas propia ni paso de compilación.

## Home en 4 anchos

| Ancho | H1 | Botón de WhatsApp visible sin scroll | Desbordamiento horizontal | Errores JS | Videos | LCP (lab local) |
|---|---|---|---|---|---|---|
| 1440×900 | 1 | Sí (borde inferior en 627 px) | No | 0 | 0 | 1,1 s (foto) |
| 1366×768 | 1 | Sí (620 px) | No | 0 | 0 | 0,2 s (H1) |
| 390×844 (iPhone) | 1 | Sí (579 px) | No | 0 | 0 | 0,3 s (H1) |
| 360×740 (Android pequeño) | 1 | Sí (589 px) | No | 0 | 0 | 0,2 s (H1) |

- Tras bajar 3 pantallas aparecen el WhatsApp flotante y "volver arriba".
- Acordeón: abre, cambia `aria-expanded` y las 13 preguntas visibles coinciden con el JSON-LD.
- Menú móvil: abre, `aria-expanded="true"` y 7 enlaces.
- Sin JavaScript: 0 elementos ocultos (`home-sin-js.webp`).
- Con scroll real, los 23 elementos con revelado aparecen en 1440 y 390 px.

## Formulario (simulado, sin red)

| Caso | Resultado |
|---|---|
| Vacío | "Falta completar: tu perfil, tu pagaduría, qué necesitas, tu situación, tu nombre, tu número de WhatsApp." Foco en el perfil. |
| Sin autorización | Mensaje de autorización, 0 envíos. |
| Celular inválido | Mensaje con el formato esperado. |
| Válido, sin ciudad | 1 envío con las claves de siempre (`ciudad: ""`, `edad: null`, `apellido: ""`, `vida_crediticia: "Mal reportado"`). WhatsApp con el mensaje bien codificado. Aparece "Falta un paso". |
| Segundo clic | Sigue 1 envío y WhatsApp se reabre. |
| Campo trampa con texto | No se registra. |
| Formulario en pantalla | Botones flotantes ocultos. |
| Analítica | `dataLayer` solo con evento, página y ubicación. Pixel: `FormStart`, `Lead`, `WhatsAppOpenForm`. **Sin datos personales.** |

## Las 24 URL del sitemap (1366 px)

24/24 con un H1, canonical correcto, JSON-LD válido, favicon nuevo, botón "volver arriba", sin desbordamiento y sin errores de JavaScript. **207 enlaces internos revisados, 0 rotos, 0 anclas inexistentes.**

## Lighthouse 12.8.2 (laboratorio local, no datos de usuarios reales)

Antes = tag `antes-remaster-2026-10`, servido igual. Meta Pixel bloqueado en ambos.

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS | Peso |
|---|---|---|---|---|---|---|---|---|
| Home móvil, antes | 78 | 100 | 100 | 100 | 4,3 s | 0 ms | 0 | 531 KB |
| **Home móvil, después** | **88** | 100 | 100 | 100 | **3,1 s** | 0 ms | 0 | **237 KB** |
| Home escritorio, antes | 97 | 100 | 100 | 100 | 1,0 s | 0 ms | 0,002 | 590 KB |
| **Home escritorio, después** | **97** | 100 | 100 | 100 | **0,9 s** | 0 ms | 0,059 | **318 KB** |
| Solicitar móvil, antes | 65 | 100 | 100 | 100 | 5,6 s | 260 ms | 0 | 710 KB |
| **Solicitar móvil, después** | **71** | 96 | 100 | 100 | **5,3 s** | 0 ms | 0 | 664 KB |

Notas:
- **Home escritorio:** la primera medición dio CLS 0,103 (la foto se movía al cargar la fuente). Se ancló la foto arriba y bajó a 0,059, dentro del umbral "bueno" de Google (< 0,1).
- **Home móvil:** el LCP de 3,1 s es retraso de render: la hoja de Google Fonts bloquea unos 980 ms simulados. Ver pendientes (alojar fuentes en el servidor).
- **Solicitar:** el 96 de accesibilidad sale del verde del logo en titulares (2,81:1) y del botón "Cómo llegar" (2,49:1), una decisión de marca previa. Los otros dos fallos (Facebook) se corrigieron. El LCP alto es la ilustración del hero de Solicitar, que no se tocó en esta ronda.
- El servidor local no usa CDN ni HTTP/2. Producción debería medir igual o mejor. **Los Core Web Vitals reales** se verán en Search Console o PageSpeed Insights (datos de campo) varias semanas después de publicar.

## Capturas (`capturas/`)

`home-1440`, `home-1366`, `home-390`, `home-360`, `home-1440-full`, `home-390-full`, `menu-390`, `home-sin-js`, `form-error-390` y `form-enviado-390`. Las capturas de la versión anterior están en `docs-revision/capturas/final-home-*.webp`.

> En las capturas de página completa los bloques con revelado necesitan un scroll real. El script de captura lo simula con scroll inmediato; con desplazamiento suave, los saltos no alcanzan y aparecen en blanco solo en la captura.
