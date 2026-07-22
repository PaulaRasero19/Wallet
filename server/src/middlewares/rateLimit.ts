import rateLimit from "express-rate-limit";

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMITED",
    message: "Too many requests. Please try again later."
  }
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AUTH_RATE_LIMITED",
    message: "Demasiados intentos. Probá de nuevo en unos minutos."
  }
});
