# Auditoría inicial y plan · rama `seo-intencion-2026-11`

Fecha: 12 de noviembre de 2026. Rama creada desde `main` (`1a081f9`, remaster comercial publicado). Nada se publica ni se fusiona.

## 1. Auditoría breve de la rama actual

### Lo que ya está bien (CONFIRMADO en el código)

- 26 HTML; 24 URL en el sitemap, todas canónicas e indexables. `/home/` y `404.html` llevan `noindex`, y nginx redirige `/home/` e `/index.html` a `/` con 301.
- Un H1 por página, canonical absoluto y robots `index, follow` en todas las indexables.
- `robots.txt` permite Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot y PerplexityBot.
- Arquitectura por perfil y situación: libranza, pensionados, empleados públicos, docentes, Fuerza Pública, reportados, embargos, saneamiento, compra de cartera, Cúcuta, blog, testimonios, solicitar, quiénes somos y privacidad.
- Sin AggregateRating, reseñas ni horarios en el JSON-LD. Las FAQ del JSON-LD coinciden con las visibles.
- Formulario corto, sin cédula, autorización sin premarcar, campo trampa, WhatsApp como cierre.
- Reportados ya cita la Ley 1266/2157 y distingue tipos de reporte.

### Problemas encontrados

| # | Problema | Dónde | Gravedad |
|---|---|---|---|
| 1 | "Nuestros honorarios se pagan solo si hay desembolso": dato sin confirmar (pendiente desde octubre) | 13 sitios: 8 páginas de servicio y 4 artículos | Alta (promesa comercial sin soporte) |
| 2 | El artículo "Pagar una deuda antigua…" dice que pagar "reinicia el reloj" y omite la caducidad de 8 años si la deuda nunca se paga | blog | Alta (YMYL, impreciso) |
| 3 | La primera pantalla de la portada no dice **qué se revisa** ni **dónde** con dirección; "¿me garantizan?" va en letra pequeña | `/` | Media |
| 4 | Ninguna página tiene la caja "qué revisamos / qué depende de la entidad", ni una sección de documentos, ni enlaces a la Superfinanciera o a la Ley 1527 en Función Pública | servicios | Media |
| 5 | Titles que no contienen la búsqueda principal: reportados sin "crédito", Fuerza Pública sin "Policía/Ejército", saneamiento sin "sin cupo", compra de cartera sin "bajar la cuota"; portada empieza por "Asesoría en" | 8 páginas | Media |
| 6 | Descripciones de 168–180 caracteres (se cortan) | pensionados, libranza, reportados, embargos, nadie-mayor | Baja |
| 7 | Enlaces internos a `index.html` y `blog/index.html`: la primera da un 301 extra; la segunda es una URL duplicada de `/blog/` sin redirección | todas las páginas | Media |
| 8 | Perfiles (pensionados, empleados, docentes, Fuerza Pública), libranza, Cúcuta y compra de cartera sin nodo `Service` en el JSON-LD | 7 páginas | Baja |
| 9 | Texto de lectura en 16–17 px; botón verde con texto blanco a 2,5:1 (no cumple WCAG AA) | todo el sitio | Media para el público pensionado |
| 10 | Cúcuta: falta "cómo llegar", el horario (no hay dato) y una línea clara de "con cita" | `/credito-libranza-cucuta/` | Media |
| 11 | `SEO_CONOCIMIENTO/` y `.claude/` no están en `.dockerignore`: se publicarían si se suben al repositorio | despliegue | Media |
| 12 | Cúcuta dice que un independiente "con ingresos demostrables" puede revisarse; el resto del sitio dice que el foco es el sector público | Cúcuta | Baja |

### Datos: estado

| Dato | Estado |
|---|---|
| Nombre, dirección (Calle 12 # 4–47, Local 4, C.C. Internacional, Cúcuta), WhatsApp +57 315 247 4348 | CONFIRMADO |
| Titular: Marilú Arévalo Toro, persona natural | CONFIRMADO |
| Preanálisis sin costo, sin anticipos para tramitar | CONFIRMADO |
| Atención presencial coordinada por WhatsApp y atención virtual | CONFIRMADO (texto vigente del sitio) |
| Horario de atención | PENDIENTE DE DATO REAL |
| Honorarios y cuándo se cobran | PENDIENTE DE DATO REAL |
| Años de experiencia, fecha de inicio | PENDIENTE DE DATO REAL |
| Entidades y pagadurías con convenio vigente | PENDIENTE DE DATO REAL (solo se nombran pagadurías como ejemplo de perfil) |
| Correo para Habeas Data | PENDIENTE DE DATO REAL |
| Tasas, montos, plazos, tiempos | No se publican |

## 2. Plan de cambios

1. **Promesas:** cambiar "honorarios solo si hay desembolso" por lo confirmado: preanálisis sin costo, sin anticipos y, si hay honorarios, se explican por escrito antes de avanzar.
2. **Portada:** primera pantalla con las seis respuestas (para quién, qué revisamos, no garantizamos, cuánto cuesta empezar, cómo hablar con una persona, dirección) y una franja de "respuestas rápidas" justo debajo. Las situaciones usan el lenguaje real ("me ofrecieron bajar la cuota", "no tengo cupo en el desprendible", "qué documentos piden"). Bloque contra estafas con la fuente de la Superfinanciera.
3. **Bloques de decisión en las páginas de servicio:** "qué revisamos / qué depende de la entidad", "palabras que vas a escuchar", "documentos que pueden pedirte", "cuota frente a costo total", "no pagues anticipos" y "fuentes oficiales".
4. **Reportados:** secciones nuevas: "estar pensionado no garantiza aprobación", "lo que nadie puede prometerte" y una mención local a Cúcuta. Más la fuente de la SIC.
5. **Pensionados:** mesada, descuentos de ley, margen (Ley 1527), edad y plazo, documentos iniciales y un ejemplo ilustrativo de cuota frente a costo total.
6. **Cúcuta:** cómo llegar, horario `PENDIENTE DE DATO REAL`, visita con cita y cobertura en Norte de Santander sin sedes ficticias.
7. **Titles, descriptions y H1** según la búsqueda principal de cada página; JSON-LD `Service` donde falta; enlaces internos a URL canónicas; 301 de `/blog/index.html`.
8. **Legibilidad:** texto de lectura a 18 px, botones de 52 px o más, texto oscuro sobre el verde de marca (AA).
9. **Blog:** corregir el artículo de deuda antigua con la regla completa (4 años desde el pago / 8 años si nunca se paga).
10. **Higiene:** `.dockerignore`, sitemap `lastmod`, `llms.txt` e `index.md` alineados.
11. **Verificación:** auditoría automática de las URL, prueba móvil, prueba sin JavaScript, formulario con `fetch` simulado y capturas.
