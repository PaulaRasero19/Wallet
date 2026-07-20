# Automatizacion o flujo digital

La automatizacion se plantea como flujo opcional de captacion para una futura beta publica.

## Flujo propuesto

Landing page -> formulario de interes -> Google Sheets -> n8n -> email automatico.

## Objetivo

Captar personas interesadas en probar FinFlow y enviarles un mensaje de bienvenida con instrucciones de acceso a la demo.

## Datos captados

- Nombre.
- Email.
- Edad aproximada.
- Principal problema financiero.
- Interes en probar notificaciones.

## Flujo en n8n

1. Webhook recibe formulario de la landing.
2. Nodo Google Sheets guarda lead.
3. Nodo de condicion identifica pain point principal.
4. Nodo email envia respuesta personalizada.
5. Opcional: nodo semanal envia tip financiero.

## Email automatico ejemplo

Asunto: Ya estas en la lista de FinFlow

Mensaje:

Gracias por sumarte. FinFlow esta pensado para ayudarte a entender tu presupuesto, detectar gastos recurrentes y recibir alertas inteligentes. En la demo vas a poder probar el asesor IA y la pantalla de notificaciones.

## Estado en esta entrega

El flujo esta documentado como estrategia opcional. La app actual no requiere backend ni base de datos para ser evaluada.
