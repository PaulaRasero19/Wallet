# FinFlow — Documentación del proceso

## 1. Modalidad elegida

La modalidad seleccionada fue **proyecto digital nuevo desarrollado desde cero**. FinFlow se diseñó y construyó como una aplicación móvil de finanzas personales, acompañada por un backend propio, una base de datos, autenticación, inteligencia artificial y una versión Android instalable.

El resultado es un **MVP funcional y testeable**. La entrega incluye:

- aplicación móvil desarrollada con React Native y Expo;
- APK instalable para Android;
- backend desarrollado con Node.js, Express y TypeScript;
- persistencia de datos en MongoDB;
- autenticación y separación de información por usuario;
- integración de IA disponible desde la aplicación;
- datos de demostración;
- pruebas automatizadas y pruebas manuales en emulador;
- documentación técnica, de proceso, seguridad y comunicación.

La APK final se encuentra en:

```text
Entrega-Final/FinFlow-Android-v1.0.9.apk
```

## 2. Problema o necesidad abordada

Muchas personas jóvenes administran su dinero entre aplicaciones bancarias, efectivo, notas personales, memoria y planillas que suelen abandonar. Aunque pueden conocer el saldo de una cuenta, no siempre logran responder preguntas simples como:

- ¿en qué se fue mi dinero?;
- ¿cuánto puedo gastar hasta el próximo ingreso?;
- ¿qué pagos y cuotas todavía tengo pendientes?;
- ¿cuánto estoy destinando a gastos pequeños?;
- ¿estoy avanzando realmente hacia mis metas?;
- ¿cómo afecta una compra de hoy al resto del mes?

Las aplicaciones bancarias muestran operaciones, pero normalmente no relacionan movimientos, cuotas, metas, recordatorios y compromisos futuros. Las planillas son flexibles, aunque requieren tiempo, conocimientos y constancia.

FinFlow aborda esa necesidad mediante una experiencia centralizada, visual y cercana. La persona registra sus datos y la aplicación los transforma en:

- un resumen financiero comprensible;
- estadísticas actualizadas;
- próximos pagos y cuotas;
- recordatorios;
- progreso de metas;
- respuestas en lenguaje natural basadas en información real.

El objetivo no es reemplazar al banco ni brindar asesoramiento profesional, sino ayudar a comprender mejor el mes financiero y tomar decisiones cotidianas con mayor anticipación.

## 3. Público objetivo

El público principal está compuesto por personas de **18 a 35 años residentes en Uruguay**, especialmente:

- estudiantes;
- jóvenes que comienzan a trabajar;
- trabajadores part-time;
- freelancers o personas con ingresos variables;
- usuarios de tarjetas, transferencias, efectivo y aplicaciones de pago;
- personas con servicios, suscripciones o compras en cuotas;
- personas que quieren ahorrar, pero no desean utilizar una herramienta contable compleja.

Características relevantes del público:

- utiliza el celular como herramienta principal;
- valora interfaces rápidas y visuales;
- necesita pesos uruguayos como moneda principal;
- utiliza expresiones cotidianas para hablar de dinero;
- busca orientación sin lenguaje técnico;
- puede abandonar una herramienta si la carga manual es extensa;
- necesita recordatorios y una visión conjunta de gastos presentes y futuros.

## 4. User persona

### Lucía Fernández

- **Edad:** 24 años.
- **Ubicación:** Montevideo, Uruguay.
- **Ocupación:** estudia y trabaja part-time.
- **Ingresos:** recibe un ingreso mensual y, ocasionalmente, pagos variables por trabajos freelance.
- **Medios de pago:** débito, crédito, transferencia y efectivo.
- **Hábitos:** utiliza aplicaciones de comida, paga servicios y suscripciones, realiza compras en cuotas y busca ahorrar.
- **Metas:** viajar, continuar formándose y construir un fondo de emergencia.

Lucía revisa su cuenta bancaria, pero le cuesta relacionar el saldo visible con los compromisos que todavía faltan durante el mes. A veces siente que “tenía más plata” y no logra identificar rápidamente qué gastos pequeños se acumularon.

### Pain points

- No sabe con claridad en qué se fue el dinero.
- Olvida fechas de pagos o cuotas.
- Los gastos pequeños se acumulan sin que lo note.
- Le cuesta calcular cuánto puede gastar hasta el próximo ingreso.
- Quiere ahorrar, pero no sabe cuánto puede separar sin comprometer el mes.
- Abandona aplicaciones que exigen demasiados pasos o conocimientos contables.

### Necesidades

- registrar movimientos rápidamente;
- visualizar la información más importante sin sobrecarga;
- anticipar pagos y vencimientos;
- seguir metas de manera sencilla;
- consultar sus finanzas mediante preguntas cotidianas;
- recibir respuestas basadas en sus propios datos;
- mantener siempre el control final antes de guardar una acción interpretada por IA.

## 5. Investigación y análisis de competencia

La investigación realizada fue **exploratoria y de escritorio**. Se observaron patrones presentes en tres tipos de soluciones:

### Aplicaciones bancarias

Fortalezas:

- muestran saldos y operaciones reales;
- transmiten seguridad;
- permiten realizar pagos y transferencias.

Debilidades detectadas:

- ofrecen poca interpretación transversal;
- no siempre relacionan cuentas, cuotas, metas y gastos cotidianos;
- suelen estar centradas en operar y no en explicar.

### Planillas y registros manuales

Fortalezas:

- son flexibles;
- permiten personalización;
- facilitan cálculos propios.

Debilidades detectadas:

- requieren configuración y mantenimiento constante;
- no ofrecen recordatorios integrados;
- pueden resultar intimidantes o difíciles de sostener.

### Aplicaciones de presupuesto

Se tomaron como referencia general productos como Wallet, Monefy y Fintonic, además de interfaces contemporáneas de aplicaciones fintech.

Fortalezas observadas:

- categorización de movimientos;
- gráficos y presupuestos;
- seguimiento mensual;
- diseño pensado para dispositivos móviles.

Oportunidades detectadas:

- localización específica para Uruguay;
- tono rioplatense y cotidiano;
- mejor integración entre cuotas, próximos pagos y metas;
- consultas en lenguaje natural;
- registro asistido por IA con revisión humana;
- una experiencia menos contable y más enfocada en decisiones simples.

### Conclusión del análisis

FinFlow se posiciona entre la aplicación bancaria y la planilla. Ofrece más interpretación y planificación que una vista bancaria, pero requiere menos conocimiento y mantenimiento que una herramienta contable.

La investigación no constituye todavía un estudio formal con una muestra representativa. Como futura validación se propone realizar entre cinco y ocho pruebas moderadas con personas del público objetivo.

## 6. Ideación inicial

La pregunta inicial del proyecto fue:

> ¿Cómo ayudar a una persona joven a entender qué puede hacer con su dinero sin obligarla a utilizar una planilla o una herramienta contable compleja?

La primera idea consistía en una billetera sencilla para registrar ingresos y gastos. Al analizar el caso de Lucía, se concluyó que registrar movimientos no era suficiente. También era necesario:

- anticipar servicios y vencimientos;
- organizar compras en cuotas;
- visualizar cuánto falta para una meta;
- recibir recordatorios;
- comprender el impacto de los gastos pequeños;
- consultar información sin aprender filtros financieros;
- reducir la carga manual.

A partir de esa evolución surgieron los principales módulos:

1. resumen financiero;
2. movimientos;
3. registro manual;
4. compras en cuotas;
5. metas;
6. calendario;
7. notificaciones;
8. chat financiero;
9. registro mediante lenguaje natural.

El concepto evolucionó desde un “registro de gastos” hacia un **asistente de organización financiera personal**.

## 7. Bocetos, wireframes y prototipos

El proceso visual fue iterativo. No se trabajó desde una única maqueta cerrada, sino mediante:

1. definición del mapa de pantallas;
2. bocetos estructurales de baja fidelidad;
3. implementación de una primera versión funcional;
4. revisión en emulador Android;
5. comparación con referencias visuales;
6. ajustes de jerarquía, escala, espaciado y navegación;
7. unificación final del sistema visual.

### Flujo estructural inicial

```text
Splash
  ↓
Bienvenida
  ↓
Crear cuenta / Iniciar sesión
  ↓
Configuración inicial
  ↓
Home
  ├── Movimientos
  ├── Agregar
  │     ├── Gasto
  │     ├── Ingreso
  │     ├── Compra en cuotas
  │     ├── Meta
  │     └── Registrar con IA
  ├── Calendario
  ├── IA FinFlow
  ├── Notificaciones
  └── Perfil y ajustes
```

### Evolución de los prototipos

Los primeros prototipos priorizaban la presencia de todas las funciones. Las iteraciones posteriores se concentraron en:

- reducir elementos demasiado grandes en celulares de diferentes tamaños;
- evitar la necesidad de desplazamiento innecesario en login;
- mantener las tarjetas dentro de los límites de pantalla;
- asegurar que el panel “Tus metas” no cubriera las métricas de Home;
- unificar botones, inputs y desplegables;
- simplificar formularios;
- crear estados vacíos claros;
- mejorar el detalle de pagos;
- hacer visible la transición de “Marcar como pagado”;
- diseñar una pantalla de notificaciones compacta;
- alinear onboarding, login y registro con el lenguaje visual interno.

Los prototipos de alta fidelidad fueron validados directamente en el emulador y en una APK instalada en un dispositivo Android.

## 8. Definición de tecnologías

### Aplicación móvil

- React Native 0.79;
- Expo SDK 53;
- Expo Router;
- TypeScript;
- Zustand para estado global;
- Expo SecureStore para tokens;
- Expo Notifications;
- React Native Skia;
- Expo Linear Gradient;
- Lucide React Native;
- AsyncStorage para preferencias auxiliares.

### Backend

- Node.js;
- Express 5;
- TypeScript;
- MongoDB;
- Mongoose;
- Zod para validación;
- bcrypt para contraseñas;
- JSON Web Tokens;
- Helmet;
- CORS;
- rate limiting.

### Inteligencia artificial

- Google Gemini mediante Google Generative Language API;
- modelo configurado: `gemini-1.5-flash`;
- motor determinístico propio como fallback;
- interpretación local y reglas curadas para “Registrar con IA”.

### Testing y distribución

- Vitest;
- Supertest;
- TypeScript typecheck;
- Android Gradle;
- emulador Android;
- APK release.

### Justificación

React Native y Expo permitieron desarrollar una aplicación móvil con un único código principal. Node y Express facilitaron mantener el backend en TypeScript. MongoDB fue elegido por su flexibilidad para representar usuarios, movimientos, cuotas, metas, pagos y notificaciones relacionados. La separación frontend/backend evita exponer credenciales y concentra las reglas financieras en el servidor.

## 9. Decisiones de diseño

### Identidad

FinFlow utiliza:

- fondo gris oscuro;
- gradientes cálidos en cobre, naranja, rojo y dorado;
- granulado sutil;
- movimiento lento de los gradientes;
- tipografía clara;
- componentes redondeados;
- contraste alto para montos y acciones principales.

El isotipo se construyó con tres trazos diagonales ascendentes. Representa flujo, progreso y movimiento sin depender de una letra literal.

### Principios aplicados

- Mostrar primero la información más importante.
- Reducir decisiones por pantalla.
- Utilizar lenguaje cotidiano y rioplatense.
- Mantener consistencia en botones, inputs y tarjetas.
- Usar color como apoyo y no como única señal.
- Confirmar acciones sensibles.
- Incluir estados de carga, éxito, vacío y error.
- Evitar que la IA guarde información sin aprobación.
- Diseñar componentes adaptables a distintos tamaños de celular.

### Decisiones funcionales relevantes

- En una compra en cuotas, el medio de pago se interpreta como tarjeta de crédito.
- El comercio no es obligatorio para registrar un gasto.
- La frecuencia se selecciona mediante un input desplegable.
- La fecha habitual de cobro se ingresa manualmente.
- “Marcar como pagado” muestra carga y luego confirma el estado.
- Los detalles de próximos pagos comparten una estructura visual consistente.
- “PedidosYa” y servicios similares se relacionan con la categoría comida.
- Los números mostrados por la IA deben provenir de los datos persistidos.

## 10. Desarrollo e implementación

El desarrollo se organizó en etapas:

1. definición del problema y alcance;
2. diseño del recorrido principal;
3. construcción del frontend móvil;
4. creación del backend;
5. conexión con MongoDB;
6. implementación de registro e inicio de sesión;
7. onboarding financiero;
8. cuentas, categorías y movimientos;
9. cuotas, pagos recurrentes y metas;
10. calendario y notificaciones;
11. estadísticas y actualización de datos;
12. chat financiero;
13. registro mediante lenguaje natural;
14. unificación visual;
15. adaptación responsive;
16. pruebas, correcciones y generación de APK.

### Flujo principal

1. La persona crea una cuenta.
2. Selecciona país, moneda e información inicial.
3. Ingresa a Home.
4. Registra ingresos, gastos, cuotas o metas.
5. Consulta calendario y próximos pagos.
6. Recibe recordatorios.
7. Marca compromisos como pagados.
8. Consulta estadísticas.
9. Formula preguntas a IA FinFlow.
10. Los datos se actualizan en todas las vistas relacionadas.

### Controles implementados

- validación de formularios;
- aislamiento entre usuarios;
- protección de endpoints;
- hash de contraseñas;
- access y refresh tokens;
- idempotencia para evitar movimientos duplicados;
- estados vacíos;
- manejo de errores de red;
- límites para evitar gastos superiores al saldo permitido;
- confirmación antes de guardar interpretaciones de IA.

En la última ejecución se aprobaron **27 pruebas automatizadas de integración**.

## 11. Integración de IA

FinFlow incorpora dos experiencias relacionadas con IA.

### IA FinFlow

El chat permite preguntas como:

- “¿Cuánto gasté este mes?”;
- “¿En qué gasté más?”;
- “¿Cuánto puedo gastar por día?”;
- “¿Voy a cumplir mi meta?”;
- “¿Cuáles son mis gastos hormiga?”.

El frontend envía la pregunta y el contexto conversacional reciente al endpoint autenticado:

```text
POST /api/ai/chat
```

El backend:

1. identifica la intención;
2. consulta únicamente los datos del usuario autenticado;
3. construye un contexto financiero estructurado;
4. envía instrucciones y contexto a Gemini;
5. valida y devuelve una respuesta breve.

Si Gemini no está configurado o falla, el backend utiliza respuestas determinísticas calculadas con datos reales. De esta manera, la función sigue siendo testeable y no inventa números.

### Registrar con IA

Ejemplo:

> Gasté 800 pesos en PedidosYa ayer con la Visa.

La aplicación interpreta:

- tipo de movimiento;
- monto;
- fecha;
- categoría;
- método de pago;
- concepto o comercio cuando existe;
- si corresponde o no a una cuota.

La ficha resultante es editable y requiere confirmación. Esta función utiliza reglas semánticas curadas y reconocimiento de lenguaje natural. No se presenta como una llamada a Gemini.

### Seguridad y límites

- Gemini nunca se invoca directamente desde la aplicación móvil.
- La API key se mantiene en el backend.
- El modelo recibe solamente el contexto necesario.
- No se envían contraseñas ni tokens.
- La IA no ejecuta operaciones bancarias.
- No brinda asesoramiento profesional.
- No inventa montos ausentes.
- Las acciones interpretadas requieren revisión humana.

## 12. Estrategia de comunicación

### Concepto

**Tu dinero, en flujo inteligente.**

### Propuesta de valor

FinFlow transforma movimientos, pagos, cuotas y metas en información fácil de entender.

### Diferencial

- experiencia localizada para Uruguay;
- lenguaje cercano;
- cuotas y compromisos futuros;
- recordatorios vinculados a datos reales;
- consultas en lenguaje natural;
- registro con IA y confirmación humana;
- diseño visual cálido y tecnológico.

### Tono

- claro;
- cercano;
- rioplatense;
- directo;
- práctico;
- sin juicios;
- sin promesas financieras exageradas.

### Mensajes principales

- Entendé en qué se va tu plata.
- Anticipá pagos, cuotas y vencimientos.
- Preguntale a FinFlow usando tus propias palabras.
- Organizá tus metas sin perderte en planillas.
- Tomá pequeñas decisiones antes de que termine el mes.

### Canales

- Instagram;
- TikTok;
- landing page;
- presentación académica;
- video demostrativo;
- email de bienvenida para una futura beta.

## 13. Piezas generadas

Se desarrollaron los siguientes insumos de comunicación:

1. copy para publicación de Instagram;
2. estructura de carrusel de cinco placas;
3. anuncio digital corto;
4. guion para video promocional de veinte segundos;
5. email de bienvenida;
6. textos para una landing page;
7. claim de marca;
8. mensajes principales y llamados a la acción.

Ejemplos:

### Claim

> FinFlow. Tu dinero, en flujo inteligente.

### Publicación

> Llegar a fin de mes no debería ser una sorpresa.

### Anuncio

> Tu plata en orden, sin vueltas.

### CTA

> Probá la demo de FinFlow.

Los textos están desarrollados en `docs/PIEZAS_COMUNICACION.md`. Las piezas visuales finales, mockups y video deben ser diseñados y exportados por la autora para incorporarlos al PDF o a la presentación final.

## 14. Automatizaciones implementadas

### Automatizaciones internas del producto

La aplicación implementa:

- generación de recordatorios asociados a pagos;
- notificaciones persistidas en MongoDB;
- programación local de avisos;
- actualización automática de estadísticas;
- actualización de saldos al registrar movimientos;
- generación de cuotas futuras;
- marcado idempotente de pagos;
- prevención de movimientos duplicados;
- navegación desde recordatorios hacia la entidad relacionada;
- estados pendiente, leído, pospuesto y completado.

### Automatización de comunicación

También se diseñó un flujo opcional:

```text
Landing → formulario → Google Sheets → n8n → email de bienvenida
```

Este flujo de marketing está documentado, pero **no fue implementado en el MVP**. Se presenta como una propuesta futura y no como una funcionalidad terminada.

## 15. Prompts principales utilizados

### Prompt de sistema del chat

> Sos FinFlow, una asistente de finanzas personales integrada en la aplicación. Respondé en español rioplatense de forma cercana, clara y breve. Contestá primero exactamente lo que la persona preguntó. No muestres información financiera que no haya solicitado. Usá únicamente el contexto real proporcionado. No inventes movimientos, fechas, montos, categorías ni predicciones. Cuando falte información, explicalo o pedí una aclaración. Conservá el contexto reciente. Diferenciá hechos de estimaciones. Si la pregunta no está relacionada con finanzas personales o FinFlow, limitá amablemente el alcance.

### Prompts de prueba

- “¿Cuánto gasté este mes?”
- “¿En qué gasté más?”
- “¿Cuánto puedo gastar por día hasta fin de mes?”
- “¿Voy a cumplir mi meta?”
- “¿Cuáles son mis gastos hormiga?”
- “¿Qué pagos tengo próximos?”
- “¿Y el mes pasado?”

### Prompt de registro

> Gasté 800 pesos en PedidosYa ayer con la Visa.

Resultado esperado:

- gasto;
- 800 pesos;
- PedidosYa;
- categoría comida;
- fecha de ayer;
- tarjeta;
- confirmación requerida.

### Criterios de curaduría

- respuestas breves;
- cifras provenientes de datos reales;
- aclaración ante ambigüedad;
- separación entre hechos y estimaciones;
- límite del dominio a finanzas personales;
- control humano antes de guardar.

## 16. Aprendizajes, dificultades y decisiones tomadas

### Aprendizajes

- Una aplicación financiera necesita consistencia de datos además de una buena interfaz.
- Los estados vacíos son parte central de la experiencia.
- Una IA útil necesita contexto estructurado y restricciones claras.
- La confirmación humana es esencial cuando se interpreta lenguaje natural.
- Probar en distintos tamaños descubre problemas que no aparecen en un único emulador.
- La idempotencia es necesaria para evitar duplicados por reintentos.
- Un backend publicado y una APK no garantizan por sí solos una buena experiencia: también deben probarse juntos.

### Dificultades

- conexión inicial entre APK y backend publicado;
- tiempos de arranque del servidor;
- adaptación a diferentes tamaños de pantalla;
- actualización coherente de estadísticas;
- reconocimiento de categorías a partir de comercios;
- prevención de números inventados por IA;
- control de duplicados;
- navegación y representación de estados de notificaciones;
- unificación de gradientes y componentes;
- compilación y distribución Android.

### Decisiones tomadas

- mantener MongoDB como fuente de verdad;
- centralizar las reglas financieras en el backend;
- guardar tokens en SecureStore;
- no exponer API keys en la aplicación;
- utilizar un fallback determinístico;
- exigir confirmación en “Registrar con IA”;
- hacer que el comercio sea opcional;
- asumir tarjeta de crédito en compras en cuotas;
- utilizar un desplegable para frecuencia;
- solicitar manualmente la fecha habitual de cobro;
- adaptar la escala de interfaz al tamaño del dispositivo;
- conservar una identidad visual oscura con gradientes cálidos;
- utilizar a Lucía como user persona y cuenta de demostración;
- documentar con honestidad qué está implementado y qué queda como propuesta futura.

## 17. Cierre

FinFlow evolucionó desde una idea de registro de gastos hacia un sistema móvil de organización financiera personal. El proyecto integra diseño, desarrollo, persistencia, seguridad, inteligencia artificial, comunicación y testing.

El MVP permite demostrar el recorrido principal completo y establece una base para futuras mejoras, como investigación formal con usuarios, automatización de captación, publicación en tiendas y configuración completa de notificaciones push remotas.
