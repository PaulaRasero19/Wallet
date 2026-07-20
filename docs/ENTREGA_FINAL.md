# FinFlow - Entrega final

## Resumen

FinFlow es una aplicacion movil de finanzas personales para Uruguay. Ayuda a organizar gastos, revisar presupuesto mensual, ver objetivos de ahorro, controlar suscripciones y recibir alertas inteligentes.

La entrega corresponde a la modalidad de proyecto nuevo desde cero. El resultado es un MVP operativo en React Native con Expo, testeable en Android mediante development build o APK debug.

## Problema abordado

Muchas personas jovenes registran gastos de forma irregular, no detectan a tiempo cuando se acercan al limite mensual y mantienen suscripciones pequenas que, sumadas, impactan en su ahorro. FinFlow busca transformar datos financieros simples en decisiones faciles de entender.

## Publico objetivo

Personas jovenes de Uruguay, especialmente estudiantes o trabajadores de 18 a 35 anos, que cobran en pesos uruguayos, usan tarjetas, tienen gastos recurrentes y quieren mejorar su control mensual sin usar una herramienta compleja.

## User persona

Nombre: Paula, 24 anos.

Contexto: estudia y trabaja part-time. Cobra mensualmente, paga servicios y suscripciones, usa PedidosYa y salidas con amigos, y quiere ahorrar para un viaje.

Necesidad: entender rapidamente en que se va su plata y recibir alertas antes de llegar tarde.

Frustracion: las planillas le resultan pesadas y las apps bancarias no le explican que decisiones tomar.

## Propuesta de valor

FinFlow convierte movimientos, presupuestos y objetivos en recomendaciones simples. Su valor principal es que no solo muestra numeros: interpreta el mes y sugiere acciones concretas.

## Funcionalidades desarrolladas

- Splash screen y onboarding.
- Dashboard con saldo, gastos, ingresos, ahorro y avance de presupuesto.
- Lista de movimientos mockeados.
- Presupuesto por categorias con barras de progreso.
- Objetivos de ahorro con accion simulada.
- Suscripciones con recordatorios activables.
- Pantalla de IA con asesor financiero testeable.
- Pantalla de notificaciones con permisos, prueba local, programacion y cancelacion.
- Perfil y ajustes.
- APK debug generable por comando.

## Integracion de IA

La feature de IA esta en la pantalla "IA". El usuario puede escribir una pregunta, por ejemplo: "Como puedo ahorrar mas este mes?", y tocar "Generar recomendacion IA".

La app construye un contexto con:

- movimientos mockeados;
- presupuesto por categorias;
- objetivos de ahorro;
- suscripciones;
- porcentaje de presupuesto usado.

Luego genera una respuesta con:

- resumen financiero;
- nivel de riesgo mensual;
- respuesta a la pregunta;
- acciones recomendadas;
- sugerencia de notificacion.

La integracion tiene dos modos:

1. Backend con Gemini: `server/ai-server.js` recibe los datos, llama a Gemini usando `GEMINI_API_KEY` y devuelve JSON.
2. Fallback local: si no hay backend o no hay API key, `src/services/aiAdvisorService.js` genera una recomendacion local basada en reglas. Esto permite evaluar la experiencia sin credenciales.

## Tecnologias utilizadas

- React Native.
- Expo SDK 53.
- Expo Dev Client.
- React Navigation.
- AsyncStorage.
- Expo Notifications.
- Android SDK / Gradle.
- Backend Node.js simple para integracion opcional con Gemini.

## Instalacion y ejecucion

Instalar dependencias:

```bash
npm install
```

Correr en Android con development build:

```bash
npm run dev
```

Generar APK debug:

```bash
npm run apk
```

APK generado:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Probar IA con Gemini

Crear un archivo `.env` local en la raiz:

```bash
GEMINI_API_KEY=TU_API_KEY
GEMINI_MODEL=gemini-2.0-flash
```

Levantar backend:

```bash
npm run ai-server
```

En otra terminal, correr la app:

```bash
EXPO_PUBLIC_FINFLOW_AI_URL=http://10.0.2.2:3333 npm run dev
```

En emulador Android, `10.0.2.2` apunta a la maquina local.

## Decisiones de diseno

La estetica se mantuvo simple y funcional para priorizar la evaluacion tecnica: fondo claro, tarjetas blancas, azul como color principal, texto negro y controles simples. La interfaz evita complejidad visual para que el foco este en estructura, navegacion, notificaciones e IA.

## Dificultades

- Configuracion de Android SDK y emulador desde cero.
- Limitaciones de `expo-notifications` en Expo Go con SDK 53.
- Necesidad de usar development build para probar notificaciones de forma mas real.
- Conexion entre emulador y Metro, resuelta con `--localhost` y `adb reverse`.
- Build multi-arquitectura fallando en `armeabi-v7a`; se limito el APK local a `arm64-v8a`.

## Aprendizajes

- Diferencia entre Expo Go y development build.
- Importancia de no exponer API keys en frontend.
- Uso de datos mockeados para validar experiencia antes de conectar bancos reales.
- Separacion de responsabilidades entre pantallas, datos, servicios y componentes.
- La IA funciona mejor cuando recibe contexto estructurado y devuelve una accion concreta.
