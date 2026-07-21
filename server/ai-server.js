const http = require("http");
const crypto = require("crypto");
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
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "finflow-db.json");

function defaultProfile(user, overrides = {}) {
  const now = new Date().toISOString();

  return {
    id: user.id,
    full_name: user.full_name || null,
    country_code: "UY",
    language: user.language || "es",
    locale: "es-UY",
    primary_currency: "UYU",
    secondary_currencies: [],
    monthly_income: null,
    payday: null,
    income_frequency: null,
    financial_goal: null,
    onboarding_completed: false,
    is_demo: Boolean(user.is_demo),
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return { hash, salt };
}

function verifyPassword(password, user) {
  const next = hashPassword(password, user.password_salt);
  return crypto.timingSafeEqual(Buffer.from(next.hash, "hex"), Buffer.from(user.password_hash, "hex"));
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name || null
  };
}

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const session = {
    access_token: token,
    user_id: userId,
    created_at: now
  };
  db.sessions = db.sessions.filter((item) => item.user_id !== userId);
  db.sessions.push(session);
  return session;
}

function findUserByToken(db, req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  const session = db.sessions.find((item) => item.access_token === token);

  if (!session) {
    return null;
  }

  return db.users.find((item) => item.id === session.user_id) || null;
}

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
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(data));
}

function sendAuth(res, db, user, statusCode = 200) {
  const session = createSession(db, user.id);
  writeDb(db);
  sendJson(res, statusCode, {
    session,
    user: publicUser(user),
    profile: user.profile
  });
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
      authBackend: "local-json",
      geminiConfigured: Boolean(GEMINI_API_KEY),
      model: GEMINI_MODEL
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/auth/register") {
    try {
      const db = readDb();
      const body = JSON.parse((await readBody(req)) || "{}");
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const fullName = String(body.fullName || "").trim();
      const language = ["es", "en", "pt"].includes(body.language) ? body.language : "es";

      if (!fullName) {
        sendJson(res, 400, { error: "FULL_NAME_REQUIRED", message: "Ingresá tu nombre." });
        return;
      }

      if (!email.includes("@")) {
        sendJson(res, 400, { error: "INVALID_EMAIL", message: "Ingresá un email válido." });
        return;
      }

      if (password.length < 6) {
        sendJson(res, 400, { error: "INVALID_PASSWORD", message: "La contraseña debe tener al menos 6 caracteres." });
        return;
      }

      if (db.users.some((user) => user.email === email)) {
        sendJson(res, 409, { error: "EMAIL_EXISTS", message: "Ese email ya tiene una cuenta." });
        return;
      }

      const passwordData = hashPassword(password);
      const user = {
        id: crypto.randomUUID(),
        email,
        full_name: fullName,
        language,
        password_hash: passwordData.hash,
        password_salt: passwordData.salt,
        is_demo: false,
        created_at: new Date().toISOString()
      };
      user.profile = defaultProfile(user);
      db.users.push(user);
      sendAuth(res, db, user, 201);
    } catch (error) {
      sendJson(res, 500, { error: "REGISTER_FAILED", message: error.message });
    }
    return;
  }

  if (req.method === "POST" && req.url === "/api/auth/login") {
    try {
      const db = readDb();
      const body = JSON.parse((await readBody(req)) || "{}");
      const email = normalizeEmail(body.email);
      const user = db.users.find((item) => item.email === email);

      if (!user || !verifyPassword(body.password || "", user)) {
        sendJson(res, 401, { error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos." });
        return;
      }

      sendAuth(res, db, user);
    } catch (error) {
      sendJson(res, 500, { error: "LOGIN_FAILED", message: error.message });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/api/auth/me") {
    const db = readDb();
    const user = findUserByToken(db, req);

    if (!user) {
      sendJson(res, 401, { error: "UNAUTHENTICATED", message: "No hay sesión activa." });
      return;
    }

    sendJson(res, 200, {
      user: publicUser(user),
      profile: user.profile
    });
    return;
  }

  if (req.method === "POST" && req.url === "/api/auth/logout") {
    const db = readDb();
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
    db.sessions = db.sessions.filter((item) => item.access_token !== token);
    writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && req.url === "/api/auth/recover") {
    sendJson(res, 200, {
      ok: true,
      message: "Backend local: recuperación simulada para pruebas."
    });
    return;
  }

  if (req.method === "PATCH" && req.url === "/api/profile") {
    try {
      const db = readDb();
      const user = findUserByToken(db, req);

      if (!user) {
        sendJson(res, 401, { error: "UNAUTHENTICATED", message: "No hay sesión activa." });
        return;
      }

      const body = JSON.parse((await readBody(req)) || "{}");
      user.profile = {
        ...defaultProfile(user),
        ...user.profile,
        ...body,
        id: user.id,
        updated_at: new Date().toISOString()
      };
      writeDb(db);
      sendJson(res, 200, { profile: user.profile });
    } catch (error) {
      sendJson(res, 500, { error: "PROFILE_UPDATE_FAILED", message: error.message });
    }
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
