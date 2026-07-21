# FinFlow

FinFlow es una app movil de finanzas personales, organizacion, habitos y planificacion, hecha con React Native, Expo, TypeScript y Expo Router. La direccion visual toma como referencia interfaces conceptuales minimalistas: fondo crema, pantallas negras, mucho espacio negativo y un sistema grafico basado en puntos.

## Estado actual: Fase 1 Supabase/Auth

- Splash screen negro con logo de matriz 3 x 3 animada.
- Onboarding de tres pantallas con composiciones de puntos.
- Selector inicial de idioma basico: espanol, ingles y portugues.
- Supabase client con sesion persistida mediante Expo SecureStore en movil.
- Login, registro, recuperacion de contrasena y logout conectados a Supabase Auth.
- Perfil de usuario en tabla `profiles` con Row Level Security.
- Rutas protegidas: las tabs principales requieren sesion y onboarding completo.
- Setup inicial minimo guardado en `profiles`.
- Cuenta demo separada mediante credenciales dedicadas.
- Dashboard vacio para usuarios nuevos: no muestra balances, movimientos, metas ni insights inventados.
- Profile / Settings con pantallas secundarias.

FinFlow ya no carga datos financieros ficticios automaticamente. Las tablas financieras y su CRUD real se implementan en fases posteriores.

## Ejecutar el proyecto

```bash
npm install
npx expo start
```

Para Android:

```bash
npm run android
```

Para correr la app como development build nativa en el emulador Android:

```bash
npm run dev
```

Ese comando ejecuta `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 expo run:android`, compila e instala FinFlow como app Android propia. Deja Metro abierto; mientras esa terminal siga corriendo, los cambios en JavaScript se actualizan en vivo con Fast Refresh.

Si la app muestra un error de conexion a una IP como `172.x.x.x:8081`, ejecutar:

```bash
adb reverse tcp:8081 tcp:8081
```

Luego tocar Reload en la app o volver a ejecutar `npm run dev`.

## Variables de entorno

Crear `.env` en la raiz con valores de Supabase:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
EXPO_PUBLIC_FINFLOW_DEMO_EMAIL=demo@tu-dominio.com
EXPO_PUBLIC_FINFLOW_DEMO_PASSWORD=UNA_PASSWORD_DEMO
```

La publishable key de Supabase puede vivir en el cliente siempre que RLS este activo. No agregar `service_role`, `secret key` ni passwords de base de datos a la app.

Para IA, mantener Gemini solo en backend o Edge Function:

```bash
GEMINI_API_KEY=TU_API_KEY
GEMINI_MODEL=gemini-2.0-flash
EXPO_PUBLIC_FINFLOW_AI_URL=http://10.0.2.2:3333
```

## Supabase

Ejecutar esta migracion en Supabase SQL Editor:

```text
supabase/migrations/20260720150000_phase1_profiles.sql
```

La migracion crea:

- `profiles`.
- RLS para select/insert/update/delete por `auth.uid()`.
- Trigger `on_auth_user_created` para crear perfil al registrar usuario.

Para la cuenta demo:

1. Crear un usuario en Supabase Auth con el email/password de `.env`.
2. Iniciar sesion desde el boton `Probar demo`.
3. La app marca ese perfil con `is_demo = true` y `onboarding_completed = true`.

No cargar datos demo para usuarios normales.

## Notificaciones

La logica principal esta en `src/services/notificationService.js`.

En Android fisico, la pantalla de notificaciones permite:

- Pedir permisos.
- Enviar una notificacion inmediata.
- Programar una notificacion local para dentro de 10 segundos.
- Cancelar notificaciones programadas.
- Activar o desactivar tipos de alerta, guardados localmente.

En Expo Go o emulador algunas funciones pueden depender de permisos y configuracion del dispositivo.

## Inteligencia artificial

En la fase 1, FinFlow no genera insights financieros si no hay datos reales suficientes asociados al usuario. La integracion con Gemini queda preparada via backend local, pero no se envia informacion sensible ni se exponen API keys privadas en la app.

### Probar IA con Gemini mas adelante

Crear `.env` en la raiz:

```bash
GEMINI_API_KEY=TU_API_KEY
GEMINI_MODEL=gemini-2.0-flash
```

Levantar el backend:

```bash
npm run ai-server
```

En otra terminal, correr la app apuntando al backend:

```bash
EXPO_PUBLIC_FINFLOW_AI_URL=http://10.0.2.2:3333 npm run dev
```

En emulador Android, `10.0.2.2` apunta a la computadora local.

## Generar APK

APK debug para prueba:

```bash
npm run apk
```

Ruta generada:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

APK release local:

```bash
npm run apk:release
```

Para Play Store, mas adelante conviene generar un AAB firmado y usar una keystore propia.

## Estructura principal

```text
app/
  _layout.tsx
  index.tsx
  language.tsx
  onboarding.tsx
  welcome.tsx
  login.tsx
  register.tsx
  forgot-password.tsx
  setup.tsx
  budget.tsx
  goals.tsx
  insights.tsx
  (tabs)/
    _layout.tsx
    overview.tsx
    transactions.tsx
    add.tsx
    planner.tsx
    profile.tsx
src/
  components/
  data/
  i18n/
  services/
    supabase/
  store/
  theme/
  types/
  utils/
supabase/
  migrations/
```

## Componentes principales

- `Dot`, `DotGrid`, `DotLogo`, `DotChart`, `DotProgress`, `BudgetDotRing`: identidad visual y graficas con puntos.
- `ScreenContainer`, `DarkScreenContainer`, `Header`, `BottomNavigation`: estructura de pantalla y navegacion.
- `TransactionItem`, `BudgetCategoryItem`, `GoalProgressItem`, `CalendarEventItem`, `InsightCard`, `ProfileMenuItem`: componentes reutilizables por pantalla.
- `useSessionStore`: sesion, perfil, idioma, login, registro, demo y logout.
- `useFinFlowStore`: cache en memoria para datos financieros. En fase 1 arranca vacio y no persiste datos financieros.

## Dependencias principales

- React Native, Expo, TypeScript, Expo Router.
- React Native Reanimated para animaciones discretas.
- React Native SVG para graficas de puntos.
- Zustand para estado en memoria.
- Supabase Auth/PostgreSQL/RLS para autenticacion y datos reales.
- Expo SecureStore para persistir sesion autenticada en movil.
- Lucide React Native para iconos lineales.
- Expo Linear Gradient instalado para futuros fondos sutiles, aunque la interfaz evita degradados llamativos.

## Documentacion de entrega

- `docs/ENTREGA_FINAL.md`: proceso, problema, publico, IA, tecnologias y aprendizaje.
- `docs/ESTRATEGIA_COMUNICACION.md`: publico, user persona, pain points, propuesta de valor y tono.
- `docs/PIEZAS_COMUNICACION.md`: posts, anuncio, email, guion de video y copy de landing.
- `docs/AUTOMATIZACION.md`: flujo opcional landing -> formulario -> Google Sheets -> n8n -> email.
- `docs/API_KEYS_SEGURIDAD.md`: APIs, credenciales y medidas de seguridad.
- `docs/PROMPTS_IA.md`: prompts principales.
- `docs/FORECAST_FASES.md`: roadmap por fases, modelos ampliados y alcance de la primera fase.
- `marketing/landing.html`: landing page estatica de comunicacion.
