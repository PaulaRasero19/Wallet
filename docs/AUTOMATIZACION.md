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

El flujo está documentado como estrategia opcional y **no se presenta como implementado**. El MVP de FinFlow sí utiliza backend y MongoDB para sus funcionalidades principales, pero no depende de n8n, Google Sheets ni email marketing para ser evaluado.

## Cómo podría implementarse

1. Agregar a la landing un formulario con consentimiento.
2. Enviar nombre y email a un webhook de n8n.
3. Validar y normalizar la entrada.
4. Guardar el lead en Google Sheets.
5. Enviar un email de bienvenida.
6. Registrar fecha, origen y estado del contacto.
7. Permitir baja de futuras comunicaciones.

## Privacidad

- Captar únicamente los datos necesarios.
- Explicar para qué se utilizarán.
- No enviar información financiera de la app al flujo de marketing.
- No guardar API keys en la landing.
- Incorporar consentimiento y mecanismo de baja.
