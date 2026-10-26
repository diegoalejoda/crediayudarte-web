# 06 · Arquitectura web

## Home (`/`), de arriba abajo

| # | Sección (`id`) | Para qué | Enlaces que salen |
|---|---|---|---|
| 1 | Hero (`#inicio`) | Qué ofrecemos, a quién, beneficio y acción, sin scroll | WhatsApp, `/solicitar.html#solicitud`, 4 páginas de perfil |
| 2 | ¿A quién podemos ayudar? (`#para-quien`) | Que cada perfil se reconozca | 4 páginas de perfil + 4 WhatsApp por perfil |
| 3 | ¿Qué necesitas hacer? (`#que-necesitas`) | Entrar por la situación, no por el producto | `/credito-de-libranza/`, `/compra-de-cartera/`, `/credito-libranza-reportados/`, `/credito-libranza-embargos/`, `/saneamiento-financiero/` + 4 WhatsApp |
| 4 | ¿Por qué hablar con nosotros? (`#por-que`) | Confianza con hechos y límites claros | `/about/`, `/credito-libranza-cucuta/` |
| 5 | Testimonios (`#testimonios`) | Prueba humana real | `/testimonios.html` |
| 6 | Cómo funciona (`#como-funciona`) | Quitar la incertidumbre del proceso | WhatsApp, solicitud |
| 7 | Preguntas (`#preguntas`) | Resolver lo que frena el contacto (13 preguntas, sin paginación) | Privacidad, guías de perfil, Cúcuta, blog |
| 8 | Contacto final (`#empieza`) | Última invitación | WhatsApp, solicitud |
| — | Pie (`#contacto`) | Identidad legal, dirección y todas las guías | 18 enlaces |

Se mantienen los `id` que usan el menú y otras páginas (`#para-quien`, `#como-funciona`, `#testimonios`, `#preguntas`, `#contacto`). Se verificaron los 207 enlaces internos del sitio: 0 rotos.

## Mapa del sitio (sin cambios de URL)

```
/                                   Asesoría (todos los perfiles)
├── /solicitar.html                 Solicitud corta → WhatsApp
├── Perfiles
│   ├── /credito-libranza-pensionados/
│   ├── /credito-libranza-empleados-publicos/
│   ├── /credito-libranza-docentes/
│   └── /credito-libranza-fuerza-publica/
├── Situaciones
│   ├── /credito-de-libranza/        (qué es y cómo funciona)
│   ├── /compra-de-cartera/
│   ├── /credito-libranza-reportados/
│   ├── /credito-libranza-embargos/
│   └── /saneamiento-financiero/
├── Local: /credito-libranza-cucuta/
├── Confianza: /testimonios.html · /about/ · /privacy/
└── Blog: /blog/ (8 artículos)
```

**No se creó ni se cambió ninguna URL**, así que no hacían falta redirecciones nuevas. El menú de 7 enlaces es el mismo en todo el sitio (regla de la marca).

## Archivos de la Home

- `index.html`: HTML estático, sin scripts del escenario.
- `css/styles.css` (base del sitio) + `css/home.css` (de 67 a 34 KB; también lo usa `/solicitar.html`).
- `js/medicion.js` (eventos), `js/script.js` (menú, revelado, volver arriba, año, compartido) y `js/home.js` (navegación, acordeón, botón flotante).
- Imagen del hero: `assets/home/asesoria-oficina-{900,600,m}.webp`, recortada de `assets/testigos/foto-1.jpeg` (77 KB en escritorio, 34 KB en móvil).
