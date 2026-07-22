import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function createSecureToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      clean[key] = sanitizeValue(nested);
    }
    return clean;
  }

  return value;
}

export function sanitizeMongoOperators(req: Request, _res: Response, next: NextFunction) {
  req.body = sanitizeValue(req.body) as Request["body"];
  req.params = sanitizeValue(req.params) as Request["params"];
  next();
}
