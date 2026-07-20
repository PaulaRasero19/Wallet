# FinFlow Forecast - fases de evolucion

## Inspeccion del estado actual

El proyecto ya contaba con Expo Router, TypeScript, tema visual basado en puntos, pantallas navegables, Zustand con AsyncStorage, datos mockeados, IA con fallback local y backend Gemini opcional.

## Modelos ampliados en Fase 1

- `Currency`: pesos uruguayos, dolares y euros.
- `Account`: ahora incluye moneda.
- `Transaction`: ahora incluye moneda, cuenta, hora, dia, posible gasto hormiga y cuotas.
- `Goal`: ahora incluye moneda y ahorro mensual comprometido.
- `RecurringPayment`: pagos fijos, servicios y suscripciones detectadas.
- `CreditCard`: limite, cierre, vencimiento, saldo usado y moneda.
- `ExchangeRates`: tipo de cambio manual para convertir a UYU.
- `MovementProposal`: propuesta estructurada desde lenguaje natural antes de guardar.

## Archivos afectados

- `src/types/finflow.ts`
- `src/data/mock.ts`
- `src/store/useFinFlowStore.ts`
- `src/services/forecastService.ts`
- `src/services/naturalLanguageService.ts`
- `src/services/aiAdvisorService.ts`
- `src/components/ForecastPanel.tsx`
- `src/components/ForecastScenarioCard.tsx`
- `src/components/RecurringDetectionItem.tsx`
- `app/(tabs)/overview.tsx`
- `app/(tabs)/transactions.tsx`
- `app/forecast.tsx`
- `app/insights.tsx`

## Plan por fases

### Fase 1 - Base de inteligencia financiera

Implementada en esta iteracion.

- Calculo de dinero realmente disponible.
- Proyeccion de saldo a fin de mes.
- Tres escenarios: actual, ahorro moderado y ahorro intensivo.
- Gastos hormiga con patrones avanzados.
- Pagos recurrentes y suscripciones con confirmar/rechazar.
- Cuotas futuras incluidas en la proyeccion.
- Monedas por cuenta y tipo de cambio manual base.
- Limite diario recomendado.
- IA con resumen seguro y propuesta estructurada desde lenguaje natural.
- Confirmacion obligatoria antes de guardar un movimiento detectado por IA.

### Fase 2 - Gestion avanzada

- Editor completo de tipo de cambio.
- Editor de cuotas y tarjetas.
- Alta/baja manual de pagos recurrentes.
- Ajuste de fechas reales por calendario.
- Historial mensual para comparar contra meses anteriores.

### Fase 3 - Resumen semanal

- Historia visual semanal con puntos.
- Logros, alertas, cambios contra semana anterior y recomendacion principal.
- Exportacion o pieza compartible para comunicacion del producto.

### Fase 4 - Preparacion para produccion

- Tests unitarios para calculos financieros.
- Validaciones de formularios mas estrictas.
- Modo demo reseteable.
- Preparacion para futuras integraciones bancarias sin conectar bancos reales.

## Seguridad de IA

La IA recibe un resumen financiero agregado. No se envia contrasena, correo, numero completo de tarjeta, documentos ni datos bancarios sensibles. Las recomendaciones se presentan como orientativas y no como asesoramiento financiero profesional.
