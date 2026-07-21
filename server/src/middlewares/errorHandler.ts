import type { ErrorRequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/appError";
import { logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const isKnown = error instanceof AppError;
  const statusCode = isKnown ? error.statusCode : 500;
  const code = isKnown ? error.code : "INTERNAL_ERROR";
  const message = isKnown ? error.message : "Unexpected server error.";

  logger.error("Request failed.", {
    code,
    message: error instanceof Error ? error.message : "Unknown error"
  });

  res.status(statusCode).json({
    error: code,
    message,
    ...(env.nodeEnv === "development" && error instanceof Error ? { stack: error.stack } : {})
  });
};
