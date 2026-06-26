# FinFlow

FinFlow es una app movil de finanzas personales para Uruguay, hecha con React Native y Expo.

## Funcionalidades incluidas

- Splash screen y onboarding.
- Dashboard con saldo, gastos, presupuesto y progreso mensual.
- Movimientos mockeados.
- Presupuesto por categorias con barras de progreso.
- Objetivos de ahorro con accion simulada para agregar ahorro.
- Suscripciones con switches de recordatorio.
- Insights de IA simulados.
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
