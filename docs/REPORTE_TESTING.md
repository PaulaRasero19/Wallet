# Reporte de testing funcional

Fecha de ejecución: 23 de julio de 2026.

## Alcance

Se realizaron pruebas integradas contra una base MongoDB aislada (`finflow_test`), verificación TypeScript, build del backend e inspección de la aplicación Android instalada en el emulador.

## Resultados

| Flujo solicitado | Resultado | Evidencia |
|---|---|---|
| Crear una cuenta | Aprobado | Registro real, persistencia del usuario, contraseña hasheada y rechazo de email duplicado. |
| Seleccionar país y moneda | Aprobado | Onboarding con Uruguay y UYU; creación automática de cuenta inicial. |
| Registrar un gasto | Aprobado | Creación persistida, impacto en cuenta y aparición en movimientos/estadísticas. |
| Registrar un ingreso | Aprobado | Creación persistida, actualización de cuenta y resumen. |
| Crear una compra en cuotas | Aprobado | Compra de 3 cuotas, distribución exacta 333,33 + 333,33 + 333,34 y fechas mensuales. |
| Crear una meta | Aprobado | Meta persistida, aporte posterior e historial de progreso. |
| Registrar mediante IA | Aprobado con revisión funcional | La pantalla produce una ficha revisable; el caso PedidosYa reconoce gasto, monto, comercio, comida y fecha. La confirmación humana sigue siendo obligatoria. |
| Recibir un recordatorio | Aprobado | La compra en cuotas genera notificación persistida con entidad e installmentId relacionados. |
| Marcar un pago como pagado | Aprobado | Se genera un solo movimiento aunque la solicitud se repita. |
| Usar el calendario | Aprobado | Inspección Android confirmó navegación, selector mensual, días accesibles y compromisos provenientes de pagos/cuotas. |
| Consultar al chat | Aprobado | Saludos, preguntas financieras, límites temáticos y cálculo de gastos. |
| Cambiar datos y actualizar estadísticas | Aprobado | Crear +50, editar a +75 y eliminar devuelve el resumen exactamente al valor inicial. |
| No duplicar movimientos | Aprobado después de corrección | Pagos, cuotas y movimientos manuales usan protección idempotente. |
| No mostrar números inventados | Aprobado | La respuesta al total mensual contiene el valor derivado de las transacciones persistidas. |
| Estados vacíos | Aprobado | Usuario nuevo devuelve cuentas/movimientos vacíos y overview con conteo cero. |
| Errores de formularios | Aprobado | Registro, movimientos, metas y cuotas rechazan entradas inválidas con HTTP 400 y mensaje. |
| Aislamiento entre usuarios | Aprobado | Un segundo usuario no puede acceder a cuentas ni movimientos ajenos. |

## Falla encontrada y solución

### Reintentos de movimientos manuales

Los pagos recurrentes y las cuotas ya evitaban duplicados, pero un movimiento manual podía duplicarse si la misma solicitud llegaba nuevamente por un reintento de red.

Solución implementada:

- la app genera un `clientRequestId` por operación;
- el backend busca una operación previa con esa clave;
- MongoDB mantiene un índice único compuesto por usuario y clave;
- repetir la misma solicitud devuelve el movimiento original sin volver a afectar el saldo.

Archivos principales:

- `src/store/useFinFlowStore.ts`;
- `src/services/financeService.ts`;
- `server/src/validators/transactionValidators.ts`;
- `server/src/services/transactionService.ts`;
- `server/src/models/Transaction.ts`.

### Timeout de una prueba

La ampliación de la suite dejó una prueba de extremo a extremo por encima del timeout predeterminado de cinco segundos. La operación era correcta, pero Vitest cerraba la conexión antes de finalizar.

Solución: timeout explícito de quince segundos para ese caso largo.

## Comandos ejecutados

```bash
npm run typecheck
npm run server:build
npm run server:test
```

Resultado final:

```text
Test Files: 1 passed
Tests: 27 passed
TypeScript: sin errores
Backend build: correcto
```

## Límites de la verificación

- Las pruebas push remotas requieren dispositivo físico; en emulador se verificaron persistencia, permisos, datos relacionados y navegación.
- No se realizó una prueba de carga.
- No se realizó una prueba formal de usabilidad con participantes externos.
- La precisión abierta de Gemini requiere evaluación continua; los tests verifican cifras calculables y fallback, no garantizan todas las respuestas posibles del modelo.

## Recomendación antes de presentar

1. Ejecutar nuevamente `npm run server:test`.
2. Restaurar la cuenta con `npm run server:seed:sample-user`.
3. Abrir la app en el dispositivo de presentación.
4. Confirmar conectividad del backend.
5. Hacer una consulta de IA y un registro con PedidosYa.
6. No actualizar dependencias el día de la evaluación.
