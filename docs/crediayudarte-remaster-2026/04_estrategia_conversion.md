# 04 · Estrategia de conversión

## Objetivo

- **Conversión principal:** un contacto calificado que empieza por WhatsApp, o una solicitud enviada desde `/solicitar.html`.
- **Secundarias:** clic en una página de perfil o de situación, lectura de una guía y clic en "Llenar la solicitud corta".

## Recorrido

Visita relevante → ve en el hero si es su caso → **WhatsApp** (principal) o **solicitud corta** (alternativa) → mensaje enviado en WhatsApp → lead registrado en el CRM → lead calificado → resultado comercial.

## Por qué WhatsApp es la acción principal

- El público (pensionados y empleados públicos, muchos mayores de 50) usa WhatsApp a diario. Un botón que abre una conversación es más fácil que un formulario.
- El negocio ya atiende por WhatsApp y el formulario termina igual en WhatsApp.
- El formulario se mantiene para quien prefiere escribir sus datos ordenados y para alimentar el CRM con campos estructurados.

## Jerarquía de llamados a la acción en la Home

| Lugar | Acción principal | Alternativa |
|---|---|---|
| Hero (sin scroll) | "Consultar mi caso por WhatsApp" | "Prefiero llenar una solicitud corta" |
| Tarjetas de perfil (4) | "Ver opciones para…" (página del perfil) | "Consultar por WhatsApp" con mensaje del perfil |
| Situaciones (4) | Guía de la situación | "Consultar por WhatsApp" con mensaje de la situación |
| Cómo funciona | "Empezar por WhatsApp" | "Llenar la solicitud corta" |
| Cierre | "Escribir por WhatsApp" | "Enviar una solicitud corta" |
| Menú (siempre visible) | "Solicita tu análisis" | Número de WhatsApp (escritorio) |
| Botón flotante | WhatsApp, aparece después del hero | — |

## Mensajes prellenados (sin datos personales en la URL)

| Ubicación (`data-ubic`) | Mensaje |
|---|---|
| `hero` | Hola, quiero consultar mis opciones de crédito por libranza. |
| `perfil-pensionado` | Hola, soy pensionado(a) y quiero consultar mis opciones de crédito por libranza. |
| `perfil-empleado` | Hola, soy empleado(a) del Gobierno y quisiera que revisaran mi caso. |
| `perfil-docente` | Hola, soy docente del Estado y quiero consultar mis opciones de crédito por libranza. |
| `perfil-fuerza-publica` | Hola, soy de la Fuerza Pública y quiero consultar mis opciones de crédito por libranza. |
| `caso-credito` | Hola, necesito un crédito por libranza y quiero que revisen mi caso. |
| `caso-cartera` | Hola, quisiera consultar si tengo opciones de compra de cartera. |
| `caso-reportado` | Hola, estoy reportado(a) o tengo un embargo y quiero saber si tengo opciones. |
| `caso-sin-cupo` | Hola, ya no me queda cupo en el desprendible y quiero saber qué opciones tengo. |
| `como-funciona`, `cta-final`, flotante | Hola, quiero que revisen mi caso. |

El mensaje dice desde qué perfil o situación llega la persona, así que quien atiende sabe por dónde empezar sin preguntar de nuevo. El texto del formulario sí incluye los datos que la persona escribió, pero ese mensaje se arma en el navegador y solo se envía si la persona toca "Enviar" en WhatsApp.

## Formulario

- **Obligatorios:** perfil, pagaduría (acepta "no sé"), qué necesita, situación, nombre, WhatsApp y autorización sin premarcar.
- **Opcional:** la ciudad, porque no cambia el primer análisis.
- **No se pide:** cédula, fecha de nacimiento, cuentas, claves ni documentos.
- **Nuevo:** no se registra dos veces la misma solicitud, un campo trampa invisible frena robots y los botones flotantes se esconden mientras el formulario está en pantalla. También son más grandes los textos de ayuda, de error y de autorización.
- **Confirmación honesta:** se mantiene "Falta un paso: envía el mensaje en WhatsApp". Nunca se muestra "solicitud recibida".

## Confianza (sin promesas)

- La primera pantalla dice lo que es CrediAyudarte ("No somos un banco: te asesoramos y te acompañamos") y quién decide ("la entidad que presta el dinero").
- Foto real de la oficina con una clienta, rotulada "fotografiada con su permiso".
- Bloque "Lo que nunca hacemos": no prometemos aprobación ni tiempos, no pedimos claves ni dinero para "liberar" un crédito, no prometemos borrar reportes. Funciona como prevención de fraude y como diferenciador frente a competidores que prometen.
