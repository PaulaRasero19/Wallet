# FinFlow

FinFlow es una app movil de finanzas personales y organizacion hecha con Expo React Native, TypeScript, Expo Router y backend Express + MongoDB.

## Arquitectura Final

- Frontend Expo Router con cinco tabs diarios: Inicio, Movimientos, Agregar, Plan e IA.
- Backend Express 5 + TypeScript en `server/`.
- MongoDB como unica fuente de verdad para datos financieros.
- Autenticacion real con bcrypt, access token y refresh token rotativo.
- Aislamiento estricto por `userId` en endpoints financieros.
- SecureStore solo para tokens. No se guardan movimientos, cuentas, metas, tarjetas, presupuestos, notificaciones ni IA en AsyncStorage.
- Gemini se usa desde backend si `GEMINI_API_KEY` esta configurada; Expo nunca llama Gemini directamente.

## Navegacion

Tabs principales:

- `/(tabs)/overview`
- `/(tabs)/transactions`
- `/(tabs)/add`
- `/(tabs)/plan`
- `/(tabs)/ai`

Rutas secundarias:

- `/notifications`
- `/profile`
- `/settings`
- `/settings/[section]`
- `/analysis`
- `/transaction/[id]`
- `/goal/[id]`
- `/card/[id]`
- `/payment/[id]`

## Pantallas

- Inicio: conserva identidad visual, grafica por periodo, cards mensuales, badge de notificaciones y ultimos movimientos reales.
- Movimientos: resumen mensual, busqueda, filtros principales, filtros avanzados, lista agrupada y detalle editable.
- Agregar: flujo progresivo para gasto, ingreso, transferencia, compra en cuotas, pago proximo y registro con IA confirmable.
- Plan: Mes, Metas, Tarjetas y Calendario financiero.
- IA: chat autenticado con respuestas basadas en cuentas, movimientos, metas, tarjetas, cuotas y vencimientos.
- Notificaciones: centro agrupado por fecha, persistencia, apertura de entidad relacionada, recordatorios locales y registro push.
- Perfil/Ajustes: perfil, finanzas, notificaciones, IA, seguridad, tarjetas y general.

## Modelos

Principales:

- `User`
- `RefreshToken`
- `FinancialProfile`
- `Account`
- `Category`
- `Transaction`
- `Goal`
- `CreditCard`
- `RecurringPayment`
- `PlannerEvent`
- `Notification`
- `DeviceToken`

## Endpoints

Autenticacion y perfil:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/profile/onboarding`

Finanzas:

- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/transactions`
- `POST /api/transactions`
- `POST /api/transactions/transfer`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/statistics/overview?period=30d`
- `GET /api/finance/extended`
- `POST /api/finance/recurring-payments`

IA y notificaciones:

- `POST /api/ai/chat`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `POST /api/notifications/:id/snooze`
- `POST /api/notifications/:id/complete`
- `POST /api/devices/push-token`
- `DELETE /api/devices/push-token`

## Variables

Frontend, `.env` en la raiz:

```bash
EXPO_PUBLIC_API_URL=
```

Backend, `server/.env`:

```bash
PORT=3333
NODE_ENV=development
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:8082
GEMINI_API_KEY=
WHATSAPP_ENABLED=false
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_PAYMENT_REMINDER=
WHATSAPP_TEMPLATE_WEEKLY_SUMMARY=
SAMPLE_USER_EMAIL=
SAMPLE_USER_PASSWORD=
```

No exponer `MONGODB_URI`, JWT secrets, `GEMINI_API_KEY` ni credenciales de WhatsApp en Expo.

## IA

`POST /api/ai/chat` carga un contexto financiero minimizado del usuario autenticado desde MongoDB. Si Gemini no esta configurado o falla, el backend usa respuestas deterministicas calculadas con datos reales. El flujo "Agregar con IA" interpreta lenguaje natural localmente y siempre exige confirmacion antes de guardar.

## Notificaciones, Push y WhatsApp

- Las notificaciones in-app se guardan en MongoDB.
- El generador usa claves idempotentes por usuario, tipo, entidad y fecha para evitar duplicados.
- Expo Push registra `DeviceToken` en backend y envia push solo si hay token activo.
- WhatsApp Business Platform esta preparado como provider opcional.
- Con `WHATSAPP_ENABLED=false`, la app muestra que WhatsApp no esta configurado y el backend no intenta enviar mensajes.

## Cuenta de presentación

La cuenta de presentacion es una cuenta normal con autenticacion real y datos persistidos en MongoDB. Configurar:

```bash
SAMPLE_USER_EMAIL=
SAMPLE_USER_PASSWORD=
```

Crear o regenerar:

```bash
npm run server:seed:sample-user
```

Los usuarios nuevos empiezan vacios y no reciben datos de presentacion.

Valores locales por defecto:

```text
Email: usuario@gmail.com
Contraseña: Usuario.123
```

Son credenciales exclusivas para evaluación local.

## Ejecutar localmente

```bash
npm install
npm install --prefix server
npm run server:seed:sample-user
npm run dev
```

MongoDB puede iniciarse con:

```bash
docker compose up -d mongodb
```

Separado:

```bash
npm run dev:server
npm run dev:mobile
```

Android:

```bash
npm run android
```

## Pruebas

```bash
npm run server:build
npm run typecheck
npm run lint
npm run server:test
```

Si `MONGODB_URI` no esta configurado, `/health` funciona y los endpoints `/api/*` responden `DATABASE_DISCONNECTED`.

## Documentación de entrega

- Memoria final: `docs/ENTREGA_FINAL.md`
- Guía reproducible: `docs/GUIA_EVALUACION.md`
- Reporte de 27 pruebas: `docs/REPORTE_TESTING.md`
- IA y prompts: `docs/PROMPTS_IA.md`
- Seguridad: `docs/API_KEYS_SEGURIDAD.md`
- Estrategia: `docs/ESTRATEGIA_COMUNICACION.md`
- Automatización opcional: `docs/AUTOMATIZACION.md`
- Guía para piezas que debe producir la autora: `docs/GUIA_PIEZAS_PENDIENTES.md`

## Seguridad

- Helmet.
- CORS por `CORS_ORIGIN`.
- Rate limiting.
- Zod en validaciones.
- bcrypt para contrasenas.
- Refresh tokens hasheados.
- Sanitizacion contra operadores Mongo.
- `userId` autenticado en cada endpoint financiero.
- No se devuelven password hashes ni secretos.
