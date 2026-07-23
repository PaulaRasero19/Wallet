# FinFlow — Memoria de entrega final

## 1. Síntesis del proyecto

FinFlow es una aplicación móvil de finanzas personales orientada a jóvenes de Uruguay. Permite registrar movimientos, organizar cuentas y categorías, controlar compromisos mensuales, administrar compras en cuotas, seguir metas de ahorro y consultar una asistente financiera con inteligencia artificial.

La propuesta busca reducir la incertidumbre cotidiana asociada al dinero. En lugar de mostrar únicamente cifras, FinFlow convierte los datos registrados por la persona en explicaciones, recordatorios y respuestas concretas.

La entrega corresponde a la modalidad **Opción 2: proyecto nuevo desarrollado desde cero**. El resultado alcanzado es un **MVP operativo** con frontend móvil, backend, base de datos, autenticación, integración de IA, datos de demostración y pruebas automatizadas.

## 2. Problema abordado

Muchas personas jóvenes administran sus gastos entre aplicaciones bancarias, notas, memoria y planillas que abandonan rápidamente. Esto genera cuatro problemas frecuentes:

- no saber con claridad en qué se gastó el dinero;
- olvidar pagos y vencimientos;
- perder de vista compras en cuotas y compromisos futuros;
- querer ahorrar sin saber cuánto margen real existe.

Las aplicaciones bancarias registran operaciones, pero no necesariamente explican cómo esas operaciones afectan el resto del mes. FinFlow aborda ese espacio: reúne la información que la persona decide registrar y la transforma en una visión financiera simple y accionable.

## 3. Público objetivo

Personas de 18 a 35 años residentes en Uruguay, especialmente estudiantes, trabajadores jóvenes y freelancers que:

- cobran principalmente en pesos uruguayos;
- utilizan débito, crédito, transferencias y efectivo;
- tienen servicios, suscripciones o cuotas;
- quieren ahorrar sin utilizar una herramienta contable compleja;
- valoran una experiencia móvil rápida y un lenguaje cotidiano.

## 4. User persona

**Lucía Fernández, 24 años, Montevideo.**

Lucía es una joven uruguaya que estudia y trabaja part-time. Tiene un ingreso mensual, aunque también recibe ingresos variables por trabajos ocasionales. Paga servicios y suscripciones, utiliza aplicaciones de comida, realiza compras en cuotas y organiza su dinero entre una cuenta bancaria, efectivo y ahorros. Quiere viajar, continuar formándose y construir un fondo de emergencia, pero le cuesta relacionar el saldo disponible con los pagos que todavía faltan durante el mes.

Sus principales frustraciones son:

- sentir que los gastos pequeños se acumulan sin advertencia;
- no recordar todos los vencimientos;
- no entender cuánto puede gastar hasta fin de mes;
- abandonar herramientas que requieren demasiada carga manual.

Necesita una aplicación cercana, visual y directa que le permita registrar con rapidez, revisar compromisos y formular preguntas usando lenguaje natural.

## 5. Propuesta de valor

**FinFlow transforma movimientos y compromisos financieros en decisiones fáciles de entender.**

La aplicación no busca reemplazar al banco ni ofrecer asesoramiento profesional. Su diferencial es combinar en una sola experiencia:

- registro y consulta de movimientos;
- planificación de pagos y cuotas;
- metas de ahorro;
- recordatorios;
- interpretación con IA basada en los datos del propio usuario;
- registro asistido mediante lenguaje natural con confirmación humana.

## 6. Objetivos del MVP

1. Permitir que una persona cree una cuenta y configure su contexto financiero.
2. Registrar ingresos y gastos con categorías, fechas y medios de pago.
3. Mostrar un resumen mensual comprensible.
4. Visualizar próximos pagos, cuotas y metas.
5. Generar notificaciones vinculadas a entidades reales del sistema.
6. Incorporar IA como una prestación evaluable y coherente con el problema.
7. Proteger credenciales y separar frontend, backend y persistencia.

## 7. Funcionalidades desarrolladas

### Autenticación y perfil

- registro e inicio de sesión;
- access token y refresh token rotativo;
- recuperación de sesión;
- onboarding financiero;
- preferencias de moneda, ingresos y notificaciones.

### Gestión financiera

- cuentas y saldos;
- categorías del sistema y categorías personalizadas;
- ingresos, gastos y transferencias;
- búsqueda, filtros y detalle editable;
- pagos recurrentes y servicios;
- compras en cuotas;
- tarjetas;
- metas de ahorro;
- calendario y resumen de compromisos;
- estadísticas y análisis del período.

### Notificaciones

- notificaciones internas persistidas en MongoDB;
- recordatorios locales para pagos;
- registro de Expo Push Token;
- navegación desde una notificación a la entidad relacionada;
- estados pendiente, leído, pospuesto y completado;
- claves idempotentes para evitar duplicados.

### Inteligencia artificial

- chat financiero autenticado;
- respuestas basadas en datos del usuario;
- memoria conversacional reciente enviada como contexto;
- reconocimiento de intención;
- preguntas aclaratorias cuando falta información;
- fallback determinístico cuando Gemini no está configurado;
- registro de movimientos mediante lenguaje natural;
- confirmación obligatoria antes de guardar una ficha interpretada.

## 8. Arquitectura y tecnologías

### Frontend

- React Native 0.79;
- Expo SDK 53;
- Expo Router;
- TypeScript;
- Zustand;
- Expo SecureStore para tokens;
- AsyncStorage está disponible como servicio auxiliar, pero los datos financieros no se persisten allí;
- Expo Notifications;
- React Native Skia y Linear Gradient;
- Lucide React Native.

### Backend

- Node.js;
- Express 5;
- TypeScript;
- MongoDB y Mongoose;
- Zod;
- bcrypt;
- JSON Web Tokens;
- Helmet;
- CORS;
- rate limiting;
- integración con Google Gemini;
- proveedor de Expo Push.

### Separación de responsabilidades

El frontend nunca accede directamente a MongoDB ni a Gemini. Todas las operaciones financieras y de IA pasan por el backend autenticado. MongoDB funciona como fuente de verdad de los datos financieros. Los tokens de sesión se almacenan en SecureStore y las claves privadas permanecen exclusivamente en variables de entorno del servidor.

## 9. Integración de inteligencia artificial

### Feature 1: IA FinFlow

La pantalla “IA FinFlow” permite realizar preguntas como:

- “¿Cuánto puedo gastar por día?”;
- “¿En qué gasté más?”;
- “¿Voy a cumplir mi meta?”;
- “¿Cuáles son mis gastos hormiga?”;
- “¿Qué pagos tengo próximos?”.

El frontend envía al endpoint autenticado `POST /api/ai/chat`:

- la pregunta actual;
- hasta doce mensajes recientes de la conversación.

El backend identifica primero la intención. Para preguntas financieras consulta exclusivamente los datos pertenecientes al `userId` autenticado y construye un contexto mínimo con:

- nombre, tipo, moneda y saldo de cuentas;
- totales de ingresos y gastos del período;
- categoría de mayor gasto;
- conteo y total de gastos hormiga;
- metas y progreso;
- cuotas pendientes;
- próximos pagos.

Si `GEMINI_API_KEY` está configurada, el backend envía a Gemini las instrucciones, la conversación reciente y ese contexto financiero estructurado. La aplicación utiliza actualmente el endpoint de `gemini-1.5-flash`. Si Gemini no responde o no hay clave, el backend genera una respuesta determinística calculada con los mismos datos reales. El fallback mantiene la experiencia testeable, pero se identifica internamente como proveedor `finflow`, no como una respuesta generativa.

### Feature 2: Agregar con IA

La persona puede escribir una frase como:

> Gasté 800 pesos en PedidosYa ayer con la Visa.

La aplicación interpreta tipo, monto, comercio, categoría, fecha y medio de pago. Utiliza normalización de texto, reconocimiento de expresiones y relaciones semánticas curadas para casos frecuentes. Por ejemplo, PedidosYa, Rappi, Uber Eats, delivery y restaurante se asocian con comida.

La interpretación produce una ficha editable. **Nada se guarda automáticamente:** el usuario debe revisar y confirmar.

### Justificación de IA

La IA reduce dos fricciones centrales del problema:

1. permite consultar información financiera sin conocer filtros o estructuras contables;
2. reduce la carga manual al transformar lenguaje cotidiano en una ficha verificable.

### Limitaciones y manejo de errores

- La calidad depende de que existan datos registrados.
- Gemini puede interpretar incorrectamente una pregunta.
- El contexto se limita a información financiera necesaria para responder.
- Las respuestas son educativas y no constituyen asesoramiento profesional.
- Cuando falta información, el sistema solicita aclaración.
- Cuando Gemini falla, se utiliza una respuesta calculada y no se inventan cifras.
- Las acciones interpretadas requieren confirmación humana.

## 10. Prompts y curaduría

El prompt de sistema establece que FinFlow debe:

- responder en español rioplatense;
- contestar primero lo solicitado;
- utilizar únicamente el contexto proporcionado;
- no inventar movimientos, fechas, montos o categorías;
- diferenciar hechos de estimaciones;
- pedir aclaraciones cuando sea necesario;
- rechazar cortésmente preguntas ajenas a finanzas personales;
- no presentarse como asesoramiento financiero profesional.

Durante el desarrollo se ajustó el prompt para evitar respuestas extensas, información no solicitada y cifras inventadas. Además del prompt, se incorporó validación estructural, límites de longitud, detección de intención y fallback calculado.

Los prompts completos y ejemplos se encuentran en `docs/PROMPTS_IA.md`.

## 11. Decisiones de diseño

La identidad visual utiliza una base oscura con gradientes cálidos que representan movimiento, energía y flujo. La interfaz mantiene jerarquías grandes para montos y tarjetas compactas para información secundaria.

Principios aplicados:

- destacar primero el dato financiero principal;
- usar lenguaje cotidiano y rioplatense;
- reducir la cantidad de decisiones por pantalla;
- exigir confirmación en acciones sensibles;
- mantener consistencia entre detalles de pagos, cuotas, metas y movimientos;
- ofrecer estados visibles de carga, éxito, vacío y error;
- conservar tamaños táctiles adecuados para controles principales.

La evolución visual fue iterativa. Se revisaron pantallas de inicio, movimientos, registro, IA, notificaciones, pagos, cuotas y metas hasta construir un sistema más consistente que la primera exploración.

## 12. Investigación y análisis de alternativas

La investigación fue de tipo exploratorio y de escritorio. Se observaron tres familias de soluciones:

- aplicaciones bancarias, centradas en operaciones y saldos;
- planillas, flexibles pero demandantes;
- aplicaciones de presupuesto, completas pero frecuentemente complejas para una consulta cotidiana.

La oportunidad detectada fue ofrecer una experiencia localizada para Uruguay, con pesos uruguayos, tono cercano, compromisos mensuales e interacción mediante lenguaje natural.

No se realizó todavía un estudio formal con una muestra representativa. La validación disponible corresponde a revisión heurística, pruebas funcionales y refinamiento iterativo. Una siguiente etapa debería incluir entre cinco y ocho pruebas moderadas con usuarios del público objetivo.

## 13. Proceso de desarrollo

### Primeras ideas

El proyecto comenzó a partir de una pregunta: **¿cómo ayudar a una persona joven a entender qué puede hacer con su dinero sin obligarla a usar una planilla o una herramienta contable compleja?**

Las primeras ideas se enfocaron en crear una billetera digital sencilla que permitiera anotar ingresos y gastos, consultar el saldo y visualizar categorías. Al analizar la experiencia de Lucía, se detectó que registrar movimientos no era suficiente: también necesitaba anticiparse a cuotas y vencimientos, recibir recordatorios, organizar objetivos de ahorro y comprender cómo cada decisión afectaba el resto del mes.

A partir de ese hallazgo, la propuesta evolucionó hacia un asistente financiero personal. Se definieron como ideas centrales:

- una pantalla de resumen que mostrara la información más importante sin sobrecargar;
- un registro rápido de gastos e ingresos;
- compras en cuotas visibles dentro de los compromisos futuros;
- metas de ahorro con progreso;
- calendario y notificaciones para evitar olvidos;
- una IA capaz de responder usando los datos reales de la persona;
- registro mediante lenguaje natural, por ejemplo: “Gasté 800 pesos en PedidosYa ayer con la Visa”;
- confirmación humana antes de guardar cualquier información interpretada por IA.

Estas ideas se organizaron primero como bocetos de pantallas y recorridos básicos. Luego se fueron ajustando mediante pruebas funcionales, revisión de jerarquías, simplificación de formularios y unificación del diseño visual.

### Flujo principal de uso

El recorrido fue diseñado para que Lucía pueda pasar de la configuración inicial al control cotidiano de sus finanzas de manera progresiva:

1. **Crear una cuenta:** ingresa su nombre, correo y contraseña.
2. **Configurar el perfil:** selecciona Uruguay, peso uruguayo, frecuencia de ingresos y preferencias de notificaciones.
3. **Llegar al resumen:** visualiza saldo, ingresos, gastos, próximos pagos, metas y datos destacados del período.
4. **Registrar información:** desde el botón para agregar puede cargar un gasto, un ingreso, una compra en cuotas o una meta.
5. **Usar el registro con IA:** escribe una frase cotidiana, revisa la ficha interpretada, corrige los datos si es necesario y recién entonces confirma el movimiento.
6. **Planificar compromisos:** consulta en el calendario las fechas de servicios, cuotas y pagos próximos.
7. **Recibir recordatorios:** las notificaciones le anticipan vencimientos y permiten acceder al detalle relacionado.
8. **Resolver un pago:** abre el detalle, revisa monto, categoría, fecha y frecuencia, y utiliza “Marcar como pagado”. El botón muestra el proceso de carga y luego confirma el estado “Pagado”.
9. **Seguir sus metas:** consulta el porcentaje alcanzado y registra nuevos aportes.
10. **Consultar a la IA:** formula preguntas sobre sus gastos, saldo o planificación y recibe respuestas construidas con sus propios datos financieros.
11. **Revisar cambios:** al crear, editar, pagar o eliminar información, el resumen y las estadísticas se actualizan para mantener una visión coherente.

El flujo también contempla caminos alternativos: formularios incompletos muestran validaciones, los estados sin información explican qué puede hacer la persona y las operaciones repetidas utilizan controles de idempotencia para evitar movimientos duplicados.

### Etapas de implementación

1. Definición del problema, público y alcance.
2. Diseño de navegación y modelos principales.
3. Construcción del prototipo móvil inicial.
4. Implementación de backend y persistencia.
5. Incorporación de autenticación y aislamiento por usuario.
6. Sustitución de datos simulados por datos persistidos.
7. Implementación de pagos, cuotas, metas y notificaciones.
8. Integración del chat con contexto financiero.
9. Incorporación de registro mediante lenguaje natural.
10. Unificación visual y revisión de estados.
11. Creación de semilla reproducible y pruebas automatizadas.
12. Preparación de documentación y recorrido de evaluación.

## 14. Pruebas y control de calidad

El proyecto incluye:

- verificación TypeScript de frontend y backend;
- build TypeScript del servidor;
- pruebas de integración con Vitest y Supertest;
- validación de autenticación;
- aislamiento entre usuarios;
- creación, consulta, edición y eliminación de movimientos;
- categorías personalizadas;
- pagos recurrentes y marcado como pagado;
- endpoint de IA;
- refresh y cierre de sesión;
- validación de duplicados.

Comandos:

```bash
npm run typecheck
npm run server:build
npm run server:test
npm run lint
```

En la última verificación documentada se ejecutaron 27 pruebas y todas finalizaron correctamente. El detalle se encuentra en `docs/REPORTE_TESTING.md`.

## 15. Datos de demostración

El script `npm run server:seed:sample-user` crea o regenera una cuenta de presentación con:

- perfil financiero completo;
- cuatro cuentas;
- 42 movimientos entre marzo y julio de 2026;
- ingresos fijos, freelance, reintegros y gastos variados;
- gastos hormiga identificados;
- dos tarjetas;
- cuatro metas con estados activo, pausado y completado;
- dos compras en cuotas;
- cinco pagos o ingresos programados;
- eventos de calendario;
- siete notificaciones de demostración.

La semilla es idempotente: puede ejecutarse nuevamente para recuperar el estado inicial.

Credenciales locales de evaluación:

```text
Email: usuario@gmail.com
Contraseña: Usuario.123
```

Estas credenciales pertenecen únicamente al entorno local de demostración y no deben reutilizarse en producción.

## 16. Instalación y recorrido de evaluación

Las instrucciones completas se encuentran en `docs/GUIA_EVALUACION.md`.

Recorrido recomendado:

1. iniciar sesión con la cuenta de demostración;
2. revisar Inicio y Movimientos;
3. abrir un movimiento;
4. revisar Próximos pagos;
5. abrir Internet y una compra en cuotas;
6. marcar un pago;
7. crear un gasto manual;
8. probar “Agregar con IA”;
9. consultar a IA FinFlow;
10. revisar metas y notificaciones.

## 17. Estrategia de comunicación

### Concepto

**Tu dinero, en flujo inteligente.**

### Tono

Claro, cercano, directo, rioplatense y sin juicios.

### Diferencial comunicacional

FinFlow no promete “control total” ni utiliza miedo financiero. Propone entender el mes y tomar pequeñas decisiones a tiempo.

La estrategia completa está desarrollada en `docs/ESTRATEGIA_COMUNICACION.md`.

## 18. Automatización

La automatización de marketing es opcional y no forma parte del MVP ejecutable. Se propone un flujo futuro:

```text
Landing → formulario → Google Sheets → n8n → email de bienvenida
```

La propuesta, datos y criterios están documentados en `docs/AUTOMATIZACION.md`. No se presenta como una implementación terminada.

## 19. Uso de IA durante el proceso

La IA generativa se utilizó como asistencia en:

- exploración de funcionalidades;
- revisión y refactorización de código;
- redacción inicial de textos;
- análisis de casos de lenguaje natural;
- documentación;
- planificación de comunicación.

La integración evaluable dentro del producto es el chat conectado a Gemini. El registro con lenguaje natural complementa esa experiencia mediante interpretación y reglas curadas.

Todo resultado asistido fue revisado, adaptado al alcance del proyecto y validado mediante inspección del código, typecheck y pruebas. La responsabilidad por el resultado final permanece en la autora.

## 20. API Keys y seguridad

APIs y servicios utilizados:

- Google Gemini API;
- Expo Push Service;
- MongoDB.

Medidas aplicadas:

- `GEMINI_API_KEY` existe solo en el backend;
- los archivos `.env` están excluidos de Git;
- los repositorios incluyen únicamente `.env.example`;
- autenticación obligatoria para IA y finanzas;
- aislamiento por `userId`;
- contraseñas hasheadas con bcrypt;
- refresh tokens hasheados;
- tokens móviles en SecureStore;
- Helmet, CORS y rate limiting;
- validación con Zod;
- sanitización contra operadores Mongo;
- límites para mensajes e historial de IA;
- ausencia de claves privadas en variables `EXPO_PUBLIC_*`.

Los datos financieros utilizados por Gemini se limitan al contexto necesario para responder. No se envían contraseñas, tokens, emails, documentos ni números completos de tarjetas.

## 21. Dificultades y aprendizajes

### Dificultades

- conectar emulador, dispositivo, backend y MongoDB;
- manejar fechas y zonas horarias;
- mantener consistencia entre pagos, cuotas, notificaciones y transacciones;
- diseñar un fallback que no inventara información;
- equilibrar contexto útil y minimización de datos para IA;
- unificar pantallas creadas en distintas iteraciones;
- probar notificaciones, que requieren dispositivo físico para push remoto.

### Aprendizajes

- una feature de IA necesita límites y contexto, no solo un prompt;
- la confirmación humana es esencial antes de guardar una interpretación;
- una semilla reproducible facilita evaluación y pruebas;
- la seguridad debe diseñarse desde la arquitectura;
- los estados de carga, error y vacío son parte del producto;
- documentación y código deben evolucionar juntos;
- una propuesta integral incluye producto, comunicación y forma de evaluación.

## 22. Estado y próximos pasos

El MVP es funcional y testeable. Para una siguiente versión se propone:

- desplegar backend y base de datos en infraestructura productiva;
- generar builds firmados;
- realizar pruebas de usabilidad con usuarios;
- medir precisión de consultas de IA;
- incorporar controles de consentimiento más detallados;
- completar automatización de captación;
- producir y validar una campaña visual;
- añadir observabilidad y monitoreo de errores.
