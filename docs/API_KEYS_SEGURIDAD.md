# API Keys y seguridad

## API prevista

Servicio: Google Gemini API.

Uso: generar recomendaciones financieras personalizadas a partir de datos mockeados de FinFlow.

Datos enviados:

- categorias de presupuesto;
- movimientos ficticios;
- objetivos de ahorro ficticios;
- suscripciones ficticias;
- pregunta escrita por el usuario.

No se envian datos bancarios reales, contrasenas, tarjetas ni documentos.

## Medida principal de seguridad

La API key no se guarda en el frontend mobile. La app llama a un backend local (`server/ai-server.js`) y el backend usa `GEMINI_API_KEY` desde variables de entorno.

Archivo de ejemplo:

```bash
.env.example
```

Archivo real:

```bash
.env
```

`.env` esta incluido en `.gitignore` para evitar exponer credenciales.

## Modo sin API key

Si no hay `GEMINI_API_KEY`, la app usa un motor local de recomendaciones. Esto permite que el profesor pueda probar la feature IA sin depender de credenciales.

## Recomendaciones para produccion

- Usar backend real o serverless, no llamar Gemini directo desde React Native.
- Restringir API key por servicio y entorno.
- No subir `.env` a repositorios.
- No registrar datos sensibles en logs.
- Limitar cuota de uso durante evaluacion.
