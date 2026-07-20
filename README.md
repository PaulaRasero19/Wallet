# FinFlow

FinFlow es una app movil de finanzas personales, organizacion, habitos y planificacion, hecha con React Native, Expo, TypeScript y Expo Router. La direccion visual toma como referencia interfaces conceptuales minimalistas: fondo crema, pantallas negras, mucho espacio negativo y un sistema grafico basado en puntos.

## Funcionalidades incluidas

- Splash screen negro con logo de matriz 3 x 3 animada.
- Onboarding de tres pantallas con composiciones de puntos.
- Welcome, login, registro y recuperacion de contrasena.
- Overview oscuro con balance, grafica de puntos, cuentas y actividad reciente.
- Transactions con lista desplazable y filtros funcionales.
- Add Expense / Task con guardado en estado global.
- Budget con grafica circular de puntos calculada desde datos.
- Savings Goals con progreso en puntos, crear, sumar dinero y eliminar.
- Planner con semana, agenda, crear evento y marcar como realizado.
- AI Insights con chat, indicador de escritura, backend Gemini opcional y fallback local.
- Profile / Settings con pantallas secundarias.
- Persistencia local con Zustand + AsyncStorage.

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

Ese comando ejecuta `npx expo run:android --localhost`, compila e instala FinFlow como app Android propia. Deja Metro abierto; mientras esa terminal siga corriendo, los cambios en JavaScript se actualizan en vivo con Fast Refresh.

Si la app muestra un error de conexion a una IP como `172.x.x.x:8081`, ejecutar:

```bash
adb reverse tcp:8081 tcp:8081
```

Luego tocar Reload en la app o volver a ejecutar `npm run dev`.

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

La pantalla `AI Insights` incluye un asesor financiero que analiza datos mockeados y tambien datos modificados durante el uso:

- movimientos;
- presupuesto por categorias;
- objetivos de ahorro;
- pregunta escrita por el usuario.

La app intenta usar un backend local compatible con Gemini si esta configurado. Si no hay backend o API key, usa un motor IA local para que la feature sea evaluable sin credenciales.

### Probar IA sin API key

Abrir la app, entrar a `Overview` y tocar `AI`. Escribir una pregunta y tocar el boton de enviar.

### Probar IA con Gemini

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
  onboarding.tsx
  welcome.tsx
  login.tsx
  register.tsx
  forgot-password.tsx
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
  services/
  store/
  theme/
  types/
  utils/
```

## Componentes principales

- `Dot`, `DotGrid`, `DotLogo`, `DotChart`, `DotProgress`, `BudgetDotRing`: identidad visual y graficas con puntos.
- `ScreenContainer`, `DarkScreenContainer`, `Header`, `BottomNavigation`: estructura de pantalla y navegacion.
- `TransactionItem`, `BudgetCategoryItem`, `GoalProgressItem`, `CalendarEventItem`, `InsightCard`, `ProfileMenuItem`: componentes reutilizables por pantalla.
- `useFinFlowStore`: estado global con usuario, cuentas, balance, transacciones, presupuesto, objetivos, eventos, tareas y mensajes IA.

## Dependencias principales

- React Native, Expo, TypeScript, Expo Router.
- React Native Reanimated para animaciones discretas.
- React Native SVG para graficas de puntos.
- Zustand y AsyncStorage para estado global y persistencia.
- Lucide React Native para iconos lineales.
- Expo Linear Gradient instalado para futuros fondos sutiles, aunque la interfaz evita degradados llamativos.

## Documentacion de entrega

- `docs/ENTREGA_FINAL.md`: proceso, problema, publico, IA, tecnologias y aprendizaje.
- `docs/ESTRATEGIA_COMUNICACION.md`: publico, user persona, pain points, propuesta de valor y tono.
- `docs/PIEZAS_COMUNICACION.md`: posts, anuncio, email, guion de video y copy de landing.
- `docs/AUTOMATIZACION.md`: flujo opcional landing -> formulario -> Google Sheets -> n8n -> email.
- `docs/API_KEYS_SEGURIDAD.md`: APIs, credenciales y medidas de seguridad.
- `docs/PROMPTS_IA.md`: prompts principales.
- `marketing/landing.html`: landing page estatica de comunicacion.
