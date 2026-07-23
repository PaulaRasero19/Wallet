# API Keys, privacidad y seguridad

## 1. Servicios externos

### Google Gemini API

Finalidad: responder preguntas financieras utilizando un contexto estructurado construido por el backend.

Ubicación de la integración: `server/src/services/aiService.ts`.

Credencial: `GEMINI_API_KEY`, disponible únicamente en `server/.env`.

### Expo Push Service

Finalidad: registrar dispositivos físicos y enviar notificaciones push.

El token Expo del dispositivo se guarda en MongoDB asociado al usuario autenticado. No se utiliza como credencial de acceso a datos financieros.

### MongoDB

Finalidad: persistir usuarios, perfiles, cuentas, categorías, movimientos, metas, cuotas, pagos, notificaciones y tokens de dispositivo.

Credencial: `MONGODB_URI`, disponible únicamente en el backend.

## 2. Datos enviados a Gemini

Cuando una pregunta requiere contexto financiero, el backend puede enviar:

- nombres, tipos, monedas y saldos de cuentas;
- totales de ingresos y gastos;
- categoría de mayor gasto;
- conteo y total de gastos hormiga;
- nombres, montos y progreso de metas;
- cuotas pendientes;
- próximos pagos;
- pregunta e historial conversacional reciente.

No se envían:

- contraseña o hash de contraseña;
- access token o refresh token;
- API keys;
- email;
- documentos de identidad;
- número completo de tarjeta;
- información de otros usuarios.

La documentación no afirma que estos datos sean ficticios: en una cuenta normal provienen de la información real registrada por esa persona.

## 3. Flujo seguro de Gemini

```text
App móvil
  ↓ HTTPS / POST autenticado
Backend FinFlow
  ↓ consulta limitada por userId
MongoDB
  ↓ contexto estructurado y minimizado
Google Gemini API
  ↓ respuesta
Backend
  ↓ respuesta a la app
App móvil
```

La app nunca contiene ni recibe `GEMINI_API_KEY`.

## 4. Variables de entorno

Frontend:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3333/api
```

Esta variable es pública por definición y solo contiene la dirección de la API.

Backend:

```bash
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GEMINI_API_KEY=
```

Los archivos `.env` están incluidos en `.gitignore`. El repositorio contiene solamente archivos `.env.example`.

## 5. Autenticación y autorización

- contraseñas hasheadas con bcrypt;
- access tokens de duración corta;
- refresh tokens rotativos y hasheados;
- tokens almacenados en SecureStore;
- middleware de autenticación;
- consultas financieras filtradas por el identificador autenticado;
- pruebas de aislamiento entre usuarios;
- cierre de sesión e invalidación de refresh token.

## 6. Seguridad HTTP y validación

- Helmet;
- CORS configurable;
- rate limiting;
- validación de entradas con Zod;
- sanitización contra operadores Mongo;
- límites de longitud para preguntas e historial;
- timeouts en solicitudes móviles;
- mensajes de error sin secretos.

## 7. Configuración para evaluación

Los valores incluidos en `server/.env.example` son exclusivamente de desarrollo local. Las claves JWT de ejemplo no deben utilizarse en un despliegue público.

La clave de Gemini debe ser entregada por un canal privado o configurada directamente en el servidor de evaluación. Nunca debe incluirse en:

- Git;
- una captura pública;
- el APK;
- variables `EXPO_PUBLIC_*`;
- documentación distribuida públicamente.

## 8. Medidas recomendadas para producción

- usar HTTPS obligatorio;
- alojar secretos en un gestor de secretos;
- reemplazar todas las claves de desarrollo;
- restringir la API key de Google por API y cuota;
- aplicar presupuestos y alertas de consumo;
- incorporar consentimiento explícito para procesamiento con IA;
- ofrecer eliminación y exportación de datos;
- registrar auditoría sin guardar contenido financiero sensible;
- revisar retención de conversaciones;
- monitorear errores de proveedores push y Gemini.

## 9. Respuesta ante exposición accidental

Si una clave se publica accidentalmente:

1. revocarla de inmediato;
2. generar una nueva;
3. eliminarla del historial de Git;
4. revisar logs y consumo;
5. actualizar el entorno afectado;
6. documentar el incidente.
