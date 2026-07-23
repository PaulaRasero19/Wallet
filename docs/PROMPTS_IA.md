# Prompts, integración y curaduría de inteligencia artificial

## 1. Herramientas utilizadas

- Google Gemini API como modelo generativo integrado al producto.
- Asistentes generativos durante ideación, programación, revisión y documentación.
- Motor determinístico propio como fallback y mecanismo de control.

La feature evaluable con IA generativa es el chat “IA FinFlow”. El fallback no se presenta como Gemini: permite responder con cálculos reales cuando el servicio generativo no está disponible.

## 2. Prompt de sistema implementado

El backend utiliza estas instrucciones base:

> Sos FinFlow, una asistente de finanzas personales integrada en la aplicación. Respondé en español rioplatense de forma cercana, clara y breve. Contestá primero exactamente lo que la persona preguntó. No muestres información financiera que no haya solicitado. Usá únicamente el contexto real proporcionado. No inventes movimientos, fechas, montos, categorías ni predicciones. Cuando falte información, explicalo o pedí una aclaración. Conservá el contexto reciente. Diferenciá hechos de estimaciones. Si la pregunta no está relacionada con finanzas personales o FinFlow, limitá amablemente el alcance.

## 3. Estructura enviada al modelo

Gemini recibe:

1. las instrucciones base;
2. contexto financiero autorizado y estructurado;
3. hasta ocho mensajes recientes;
4. la pregunta actual.

Ejemplo conceptual del contexto:

```json
{
  "accounts": [
    { "name": "Cuenta principal", "type": "bank", "currency": "UYU", "balance": 18080 }
  ],
  "period": {
    "label": "este mes",
    "expenseTotal": 37920,
    "incomeTotal": 58000,
    "topCategory": { "name": "Alquiler", "total": 18000 }
  },
  "antExpenses": { "count": 1, "total": 1420 },
  "goals": [],
  "installments": [],
  "payments": []
}
```

Los valores dependen de la cuenta autenticada y no están escritos dentro del prompt.

## 4. Parámetros de generación

La implementación utiliza:

- modelo: `gemini-1.5-flash`;
- temperatura: `0.35`;
- máximo de salida: `280` tokens;
- endpoint: Google Generative Language API desde backend.

La temperatura baja reduce creatividad innecesaria en respuestas financieras.

## 5. Prompts principales para probar

### Consulta de gastos

> ¿Cuánto gasté este mes?

Resultado esperado: total calculado desde movimientos persistidos.

### Categoría principal

> ¿En qué gasté más?

Resultado esperado: categoría de mayor gasto y total correspondiente.

### Estimación diaria

> ¿Cuánto puedo gastar por día hasta fin de mes?

Resultado esperado: estimación basada en saldo, compromisos registrados y días restantes, identificada como estimación.

### Meta

> ¿Voy a cumplir mi meta?

Resultado esperado: progreso de una meta existente o solicitud de aclaración.

### Gastos hormiga

> ¿Cuáles son mis gastos hormiga?

Resultado esperado: cantidad y total detectado.

### Contexto conversacional

1. `¿Cuánto gasté este mes?`
2. `¿Y el mes pasado?`

Resultado esperado: interpretar la segunda pregunta usando el contexto reciente.

### Fuera de alcance

> ¿Quién va a ganar el próximo partido?

Resultado esperado: limitar la respuesta a finanzas personales.

## 6. Interpretación para “Agregar con IA”

Ejemplo:

> Gasté 800 pesos en PedidosYa ayer con la Visa.

Campos esperados:

- tipo: gasto;
- monto: 800;
- comercio: PedidosYa;
- categoría: comida;
- fecha: ayer;
- medio de pago: tarjeta;
- confirmación: requerida.

Otros conceptos curados incluyen Rappi, Uber Eats, UTE, Antel, Uber, Netflix, Spotify, farmacia, supermercado y expresiones frecuentes.

Esta prestación utiliza interpretación local y relaciones curadas. No debe describirse como una llamada a Gemini.

## 7. Curaduría y decisiones tomadas

- Se redujo la longitud de las respuestas.
- Se prohibió inventar datos no presentes.
- Se agregaron aclaraciones para preguntas ambiguas.
- Se limitó el dominio a finanzas personales.
- Se separaron hechos y estimaciones.
- Se incorporó detección de intención antes de llamar al modelo.
- Se agregó fallback calculado con datos reales.
- Se exige confirmación para acciones interpretadas.
- Se restringió la cantidad y longitud de mensajes recibidos.

## 8. Limitaciones

- La precisión depende de la calidad de los datos registrados.
- Gemini puede cometer errores de interpretación.
- El fallback cubre intenciones conocidas, no conversación abierta.
- No se realizan recomendaciones de inversión, crédito o asesoramiento profesional.
- No se ejecutan acciones financieras automáticamente.
- La evaluación con Gemini requiere una `GEMINI_API_KEY` válida en el backend.

## 9. Uso de IA durante el proceso

La IA también asistió tareas de ideación, programación, revisión, redacción y comunicación. Esas salidas fueron curadas y adaptadas. La autora debe completar en la versión PDF los nombres exactos de las herramientas externas utilizadas y, si corresponde, adjuntar capturas o enlaces de sesiones relevantes.
