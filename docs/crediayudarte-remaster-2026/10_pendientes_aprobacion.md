# 10 · Pendientes y decisiones que necesitan aprobación

## Antes de publicar

1. **Revisar la rama** `remaster-comercial-2026-10` en local (cualquier servidor estático en la carpeta del repo).
2. **Permiso de la foto del hero:** la foto (`assets/testigos/foto-1.jpeg`) ya se publicaba en testimonios "con su permiso". Ahora es la imagen principal del sitio. Confirmar que el permiso de la clienta y de la asesora cubre ese uso.
3. **Ciudad opcional en el formulario:** el CRM puede recibir `ciudad: ""`. Confirmar con quien administra n8n/Supabase que no rompe nada (por ejemplo, una columna obligatoria o una regla de puntaje que use la ciudad). El resto del contrato no cambió.
4. **Publicar** (solo con autorización): `git switch main && git merge --no-ff remaster-comercial-2026-10 && git push origin main`. Después:
   - verificar `/`, `/solicitar.html`, `/favicon.ico` y `/robots.txt`;
   - en Search Console, inspeccionar la portada y pedir su indexación;
   - hacer una solicitud real controlada y confirmar que llega a n8n.

## Afirmaciones comerciales que siguen sin confirmar

| Afirmación | Estado |
|---|---|
| Años de experiencia | **Sin dato.** El sitio no muestra ninguna cifra. Falta la fecha de inicio del negocio. |
| Honorarios | El sitio dice que el preanálisis no tiene costo y que, si una gestión tiene honorarios, se explican por escrito antes. Confirmar el esquema real; algunas páginas antiguas dicen "honorarios solo si hay desembolso". |
| Tiempos de respuesta | No se publica ninguno. Si la operación puede cumplir uno (por ejemplo, "te respondemos el mismo día hábil"), puede sumarse al hero. |
| Horarios | No se publican. Definirlos o mantener "con cita". |
| Entidades con las que se trabaja | No se publican. Si se decide hacerlo, solo con convenios o relaciones verificables y con permiso de cada entidad. |
| RUNEOL / registros | No se afirma ninguno. Confirmar con un abogado si la actividad de intermediación requiere algún registro y, si existe, mostrarlo. |

## Decisiones de marca que afectan la accesibilidad

- **Botón verde con texto blanco** (#6FAA31 / #7CB41D): 2,5–2,8:1, no cumple WCAG AA. Opciones: (a) mantenerlo, decisión vigente; (b) texto gris oscuro sobre el mismo verde (≈6:1, cumple sin cambiar el color); (c) un verde más oscuro solo en botones.
- **Titulares verdes en Solicitar** (#6FAA31 sobre blanco, 2,81:1).

## Mejoras recomendadas, no hechas en esta ronda

1. **Alojar las fuentes en el propio servidor** (Archivo y Plus Jakarta Sans, licencia OFL). Quita la conexión a Google Fonts que bloquea unos 980 ms en móvil, el mayor freno del LCP de la Home.
2. **Solicitar:** el hero usa una ilustración generada (5 perfiles) y debajo sigue el recorrido 01–04 con videos generados. Se recomienda una foto real, igual que en la Home, y revisar si el recorrido aporta.
3. **Aviso físico de la oficina:** en la foto de testimonios se leen frases como "Con la mejor tasa" y "No importa…", que el sitio ya no usa. Conviene actualizar el aviso o elegir otra foto.
4. **Limpiar medios sin uso** (unos 34 MB en `assets/cine/v/d`, `assets/cine/v/m` y `assets/generative/hero*`). Ya no los carga ninguna página, pero se copian en la imagen Docker. Siguen en git si se borran.
5. **GA4:** falta el ID. Decidir también si el Meta Pixel va en todas las páginas (hoy solo Inicio y Solicitar); si se amplía, actualizar la política de privacidad.
6. **Search Console:** dar acceso, o exportar consultas de los últimos 3 meses, para reemplazar la columna "sin dato" del mapa de palabras clave por cifras reales.
7. **Blog:** revisar "Pagar una deuda antigua…" (pendiente de la ronda anterior).
8. **Revisión jurídica** de Reportados, Embargos, Saneamiento, Privacidad y de la frase sobre el 50 % de la Ley 1527 en las preguntas frecuentes. Se apoyan en el texto oficial, pero no sustituyen a un abogado.
9. **Teléfono:** no hay enlace `tel:`. Si el 315 247 4348 recibe llamadas, se puede añadir "Llamar" en móvil.

## Reversión

- **Todo:** volver a `main` (no se ha fusionado nada) o, si ya se publicó, `git revert -m 1 <merge>`.
- **Solo el formulario:** `git checkout antes-remaster-2026-10 -- solicitar.html js/solicitar.js css/solicitar.css`.
- **Solo la Home cinematográfica:** `git checkout antes-remaster-2026-10 -- index.html css/home.css js/home.js js/cine.js js/tour.js`. Solicitar también usa `home.css`; revisar después.
