# FinFlow

FinFlow es una app movil de finanzas personales hecha con React Native, Expo, TypeScript, Expo Router y backend propio Express + MongoDB Atlas.

## Estado actual

- App Expo React Native con rutas protegidas.
- Backend Express 5 + TypeScript en `server/`.
- Autenticacion real con bcrypt, JWT access token y refresh token rotativo.
- Perfil financiero y onboarding guardados en MongoDB.
- Cuentas, categorias, movimientos y dashboard calculado desde MongoDB.
- Estados vacios reales para usuarios nuevos, sin cifras inventadas.
- Datos financieros solo en memoria del frontend durante la sesion.
- Cuenta de presentacion separada mediante seed manual, no automatico.
- Metas, tarjetas, cuotas, recurrentes y planner se cargan desde MongoDB para usuarios que tengan esos datos.
- Gemini y presupuestos avanzados quedan para el siguiente bloque.

## Variables

Frontend, archivo `.env` en la raiz:

```bash
EXPO_PUBLIC_API_URL=
```

Si queda vacio, la app usa:

- Android Emulator: `http://10.0.2.2:3333/api`
- Web: `http://localhost:3333/api`

Backend, archivo `server/.env`:

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
SAMPLE_USER_EMAIL=
SAMPLE_USER_PASSWORD=
```

`MONGODB_URI`, JWT secrets y `GEMINI_API_KEY` nunca deben ir en Expo ni en variables `EXPO_PUBLIC_`.

## Configurar MongoDB Atlas

1. Crear un cluster en MongoDB Atlas.
2. Crear un usuario de base de datos.
3. Habilitar tu IP en Network Access.
4. Copiar la URI de conexion `mongodb+srv://...`.
5. Pegarla solo en `/Users/paularasero/Documents/Wallet/server/.env`:

```bash
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/finflow
```

Para tests destructivos, usar una base separada:

```bash
TEST_MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@CLUSTER.mongodb.net/finflow_test
```

## Ejecutar

Instalar dependencias:

```bash
npm install
npm install --prefix server
```

Levantar backend y app movil juntos:

```bash
npm run dev
```

Levantar por separado:

```bash
npm run dev:server
npm run dev:mobile
```

Web en Codex:

```bash
npm run web -- --port 8082
```

## Endpoints principales

- `GET /health`
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
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/:id`
- `PATCH /api/accounts/:id`
- `DELETE /api/accounts/:id`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/statistics/overview?period=30d`
- `GET /api/finance/extended`

## Cuenta de presentacion

La cuenta de presentacion no se crea al iniciar el servidor y no es un modo especial de la app. Es una cuenta normal con `isDemo=false`, autenticacion real y datos persistidos en MongoDB.

Configurar credenciales solo en `/Users/paularasero/Documents/Wallet/server/.env`:

```bash
SAMPLE_USER_EMAIL=
SAMPLE_USER_PASSWORD=
```

Crear o regenerar la cuenta:

```bash
npm run server:seed:sample-user
```

El seed busca el usuario por email, lo crea si no existe, lo actualiza si existe, borra solo los datos financieros de esa cuenta y vuelve a cargar datos coherentes. Se puede ejecutar varias veces sin duplicar movimientos, cuentas, tarjetas, cuotas, metas ni eventos.

Los usuarios nuevos siguen empezando vacios y no reciben datos de presentacion.

## Pruebas

```bash
npm run server:build
npm run typecheck
npm run lint
npm run server:test
```

Si `MONGODB_URI` no esta configurado, `/health` funciona y los tests destructivos de Mongo se saltean. El resto de `/api/*` responde `DATABASE_DISCONNECTED` hasta conectar Atlas.

## Seguridad

- Helmet.
- CORS restringido por `CORS_ORIGIN`.
- Rate limit general y rate limit especifico para auth.
- Zod para validaciones.
- bcrypt para contrasenas.
- JWT access corto y refresh rotativo hasheado en MongoDB.
- Sanitizacion basica contra operadores Mongo en body y params.
- Separacion estricta por `userId` tomado del token.
- No se devuelve `passwordHash`.
- No se guardan cuentas, movimientos, balances, perfil completo ni estadisticas en almacenamiento local del frontend.

## APK

```bash
npm run apk
```

Salida:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```
