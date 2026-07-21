const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split("\n");

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const PORT = Number(process.env.PORT || 3333);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(data));
}

function buildPrompt({ context, question }) {
  return `
Sos FinFlow IA, un asesor de finanzas personales para usuarios jovenes de Uruguay.
Analiza solo agregados reales enviados por la app y devolve una respuesta breve, concreta y accionable.
No inventes bancos reales ni productos financieros. No des asesoramiento financiero profesional.

Datos:
${JSON.stringify(context, null, 2)}

Pregunta del usuario:
${question || "Analiza mi mes y recomienda que hacer."}

Responde SOLO JSON valido con esta forma:
{
  "source": "Gemini",
  "summary": "string",
  "riskLevel": "Bajo | Medio | Alto",
  "answer": "string",
  "recommendedActions": ["string", "string", "string"],
  "notificationSuggestion": "string"
}
`;
}

function fallbackAdvice() {
  return {
    source: "Backend local sin GEMINI_API_KEY",
    summary: "El backend esta activo, pero no tiene una API key configurada.",
    riskLevel: "Sin datos",
    answer: "No se generan recomendaciones financieras de prueba.",
    recommendedActions: ["Configurar GEMINI_API_KEY en el backend o usar una Edge Function segura."],
    notificationSuggestion: "Sin sugerencias hasta tener datos reales."
  };
}

async function callGemini(payload) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(payload) }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini response did not include text");
  }

  return JSON.parse(text);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, {});
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      ok: true,
      geminiConfigured: Boolean(GEMINI_API_KEY),
      model: GEMINI_MODEL
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/financial-advice") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");

      if (!GEMINI_API_KEY) {
        sendJson(res, 200, fallbackAdvice());
        return;
      }

      const advice = await callGemini(payload);
      sendJson(res, 200, advice);
    } catch (error) {
      sendJson(res, 500, {
        error: "AI_ADVICE_FAILED",
        message: error.message
      });
    }
    return;
  }

  sendJson(res, 404, {
    error: "NOT_FOUND"
  });
});

server.listen(PORT, () => {
  console.log(`FinFlow AI server running on http://localhost:${PORT}`);
});
