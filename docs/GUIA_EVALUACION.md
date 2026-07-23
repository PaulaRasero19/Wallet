# Guía de instalación, ejecución y evaluación

Esta guía permite probar FinFlow sin depender de una explicación oral.

## 1. Requisitos

- Node.js 20 o superior;
- npm;
- Android Studio con emulador o un teléfono Android;
- Java/JDK compatible con Expo SDK 53;
- MongoDB local o Docker Desktop;
- clave de Google Gemini opcional pero recomendada para evaluar IA generativa.

## 2. Instalación

Desde la raíz:

```bash
npm install
npm install --prefix server
```

Crear archivos locales:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Los valores de ejemplo están preparados para evaluación local. No utilizarlos en producción.

## 3. Base de datos

### Opción A: Docker

```bash
docker compose up -d mongodb
```

La base queda disponible en:

```text
mongodb://127.0.0.1:27017/finflow
```

### Opción B: MongoDB instalado

Iniciar el servicio local y conservar el mismo `MONGODB_URI`, o reemplazarlo por una conexión propia.

## 4. Activar Gemini

Agregar en `server/.env`:

```bash
GEMINI_API_KEY=CLAVE_ENTREGADA_POR_CANAL_PRIVADO
```

Sin esta clave, el chat sigue siendo testeable mediante respuestas determinísticas basadas en datos reales. Para evaluar específicamente generación con Gemini, la clave es necesaria.

## 5. Crear datos de demostración

```bash
npm run server:seed:sample-user
```

Cuenta creada:

```text
Email: usuario@gmail.com
Contraseña: Usuario.123
```

La semilla puede ejecutarse nuevamente para restaurar los datos.

La cuenta incluye historial desde marzo de 2026, cuatro cuentas, dos tarjetas, cuatro metas, dos compras en cuotas, cinco compromisos programados y notificaciones vinculadas. Esto permite probar gráficos, tendencias, IA y planificación sin cargar información manualmente.

## 6. Ejecutar

### Backend y app juntos

```bash
npm run dev
```

### En terminales separadas

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev:mobile
```

En Android Emulator, la app reemplaza automáticamente `localhost` por `10.0.2.2`.

### Teléfono físico

Configurar `.env` con la IP local del equipo:

```bash
EXPO_PUBLIC_API_URL=http://192.168.X.X:3333/api
```

El teléfono y el equipo deben estar en la misma red. El firewall debe permitir el puerto 3333.

## 7. APK debug

Generar:

```bash
npm run apk
```

Resultado:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

El APK necesita acceso al backend configurado. No contiene MongoDB ni claves privadas.

## 8. Verificación técnica

```bash
npm run typecheck
npm run server:build
npm run lint
npm run server:test
```

Resultado esperado:

- TypeScript sin errores;
- backend compilado;
- 27 pruebas aprobadas.

## 9. Recorrido de prueba recomendado

### A. Autenticación

1. Abrir la aplicación.
2. Iniciar sesión con la cuenta de demostración.
3. Verificar que Inicio muestre información.

### B. Movimientos

1. Abrir Movimientos.
2. Buscar o filtrar.
3. Abrir un movimiento.
4. Verificar detalle, edición y navegación.

### C. Agregar con IA

1. Abrir Agregar.
2. Seleccionar Registrar con IA.
3. Escribir:

```text
Gasté 800 pesos en PedidosYa ayer con la Visa
```

4. Preparar la ficha.
5. Verificar monto, PedidosYa, categoría Comida, fecha y método.
6. Editar o confirmar.

### D. IA FinFlow

Probar:

```text
¿Cuánto gasté este mes?
¿En qué gasté más?
¿Cuáles son mis gastos hormiga?
¿Qué pagos tengo próximos?
```

Probar contexto:

```text
¿Cuánto gasté este mes?
¿Y el mes pasado?
```

Probar límite:

```text
¿Quién va a ganar el próximo partido?
```

### E. Plan y pagos

1. Abrir Plan.
2. Revisar Próximos pagos.
3. Abrir Internet.
4. Marcar como pagado y observar el estado de carga.
5. Abrir una cuota.
6. Revisar información específica y marcarla como pagada.

### F. Notificaciones

1. Abrir Notificaciones.
2. Tocar una tarjeta.
3. Verificar navegación a la entidad relacionada.

Las notificaciones push remotas requieren un teléfono físico y permisos concedidos.

### G. Metas

1. Abrir una meta.
2. Revisar monto y progreso.
3. Agregar dinero.

## 10. Problemas frecuentes

### La app no conecta

- comprobar que el backend esté en el puerto 3333;
- comprobar `EXPO_PUBLIC_API_URL`;
- en emulador usar `10.0.2.2`, no `localhost`;
- en teléfono físico usar la IP local del equipo.

### No hay datos

Ejecutar:

```bash
npm run server:seed:sample-user
```

### Gemini no responde

- comprobar `GEMINI_API_KEY`;
- reiniciar el backend;
- verificar acceso a Internet;
- comprobar la cuota de Google.

El fallback seguirá respondiendo intenciones financieras conocidas.

### No llegan push

- usar dispositivo físico;
- conceder permisos;
- verificar registro del Expo Push Token;
- comprobar conexión con el backend.

## 11. Credenciales y secretos

La cuenta de demostración puede incluirse en la entrega. No incluir:

- `server/.env`;
- `MONGODB_URI` productivo;
- claves JWT productivas;
- `GEMINI_API_KEY`;
- credenciales de WhatsApp.

Entregar claves externas por un canal privado o utilizar un backend desplegado que ya las tenga configuradas.
