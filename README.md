# FinFlow

FinFlow es una app movil de finanzas personales para Uruguay, hecha con React Native y Expo.

## Funcionalidades incluidas

- Splash screen y onboarding.
- Dashboard con saldo, gastos, presupuesto y progreso mensual.
- Movimientos mockeados.
- Presupuesto por categorias con barras de progreso.
- Objetivos de ahorro con accion simulada para agregar ahorro.
- Suscripciones con switches de recordatorio.
- Asesor FinFlow IA testeable, con backend Gemini opcional y fallback local.
- Perfil con datos ficticios.
- Pantalla de notificaciones con permisos, prueba local, programacion local, cancelacion y switches guardados con AsyncStorage.

## Ejecutar el proyecto

```bash
npm install
npm start
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

La pantalla `IA` incluye un asesor financiero que analiza datos mockeados de la app:

- movimientos;
- presupuesto por categorias;
- suscripciones;
- objetivos de ahorro;
- pregunta escrita por el usuario.

La app intenta usar un backend local compatible con Gemini si esta configurado. Si no hay backend o API key, usa un motor IA local para que la feature sea evaluable sin credenciales.

### Probar IA sin API key

Abrir la app y entrar a la pestana `IA`. Escribir una pregunta y tocar `Generar recomendacion IA`.

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

## Documentacion de entrega

- `docs/ENTREGA_FINAL.md`: proceso, problema, publico, IA, tecnologias y aprendizaje.
- `docs/ESTRATEGIA_COMUNICACION.md`: publico, user persona, pain points, propuesta de valor y tono.
- `docs/PIEZAS_COMUNICACION.md`: posts, anuncio, email, guion de video y copy de landing.
- `docs/AUTOMATIZACION.md`: flujo opcional landing -> formulario -> Google Sheets -> n8n -> email.
- `docs/API_KEYS_SEGURIDAD.md`: APIs, credenciales y medidas de seguridad.
- `docs/PROMPTS_IA.md`: prompts principales.
- `marketing/landing.html`: landing page estatica de comunicacion.
