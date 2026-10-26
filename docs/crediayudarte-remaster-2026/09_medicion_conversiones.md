# 09 · Medición de conversiones

## Qué existe hoy

- `js/medicion.js` en todas las páginas: envía eventos a `window.dataLayer`, al Meta Pixel (solo Inicio y Solicitar) y a GA4 cuando haya un ID. **GA4 sigue apagado:** falta el ID `G-…` en la constante `GA4_ID`.
- Solo viajan tres datos: `ubicacion`, `pagina` y `destino`. Nunca nombres, teléfonos, ingresos, reportes ni texto libre (verificado en prueba).

## Eventos

| Evento | Qué significa | Qué NO significa |
|---|---|---|
| `whatsapp_click` (Pixel `WhatsAppClick`) | Clic en un enlace a WhatsApp, con su `ubicacion` | Que la persona haya enviado un mensaje |
| `phone_click` | Clic en `tel:` | (hoy no hay enlaces de teléfono) |
| `form_start` (`FormStart`) | Primera interacción con el formulario | Interés confirmado |
| `form_submit` (`Lead`) | Solicitud válida enviada al CRM. Ya no se dispara en reenvíos ni con el campo trampa lleno. | Un crédito, ni siquiera una conversación |
| `whatsapp_open_form` (`WhatsAppOpenForm`) | Se abrió WhatsApp con el mensaje del formulario | Que lo haya enviado |
| `cta_solicitar_click` (Pixel, `js/home.js`) | Clic hacia `/solicitar.html` | — |

**Ubicaciones nuevas (`data-ubic`)** para ver qué parte de la Home trabaja mejor:
- `hero`, `hero-perfil`
- `perfil-pensionado`, `perfil-empleado`, `perfil-docente`, `perfil-fuerza-publica`
- `caso-credito`, `caso-cartera`, `caso-reportado`, `caso-sin-cupo`
- `como-funciona`, `cta-final`, `menu-numero`, `boton-flotante`

## Embudo y dónde se mide cada paso

| Paso | Fuente |
|---|---|
| Visita relevante | Search Console (consultas y clics), GA4 cuando se active |
| Interacción comercial | `whatsapp_click`, `form_start`, `cta_solicitar_click` |
| Contacto iniciado | Chats nuevos en WhatsApp Business, idealmente con el texto prellenado que dice el perfil o la situación |
| Lead recibido | Registros en Supabase con `formulario_version` y `origen: landing-web` |
| Lead calificado | Etiqueta en el CRM o WhatsApp Business (perfil con pagaduría atendible) |
| Resultado comercial | CRM: radicados y desembolsos |

Los tres últimos pasos solo los puede medir el negocio. El sitio no los conoce.

## Comparar antes y después

1. **Línea base (4 semanas antes de publicar):** contar en WhatsApp Business los chats nuevos por semana; en Supabase, los leads de `landing-web`; y en el CRM, los calificados.
2. **Publicar** y anotar la fecha.
3. **4 semanas después:** las mismas tres cifras, más los `whatsapp_click` por ubicación (Meta Events Manager, y GA4 si se activa).
4. **Comparar tasas, no solo totales:** leads ÷ visitas (Search Console o GA4) y calificados ÷ leads. Revisar si cambió el tráfico (campañas, temporada de primas en junio y diciembre) antes de atribuir el cambio a la página.
5. **Señal cualitativa:** qué porcentaje de chats llega con un mensaje prellenado de perfil o situación (se ve en el primer mensaje).

## Recomendado (pendiente de decisión)

- Activar GA4 con el ID del negocio y marcar `form_submit` y `whatsapp_click` como eventos clave.
- En WhatsApp Business, usar etiquetas "Web – pensionado", "Web – reportado", etc., para cerrar el embudo sin datos en la analítica.
