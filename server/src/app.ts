import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { apiRateLimit } from "./middlewares/rateLimit";
import { healthRouter } from "./routes/health.routes";
import { AppError } from "./utils/appError";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new AppError("Origin not allowed by CORS.", 403, "CORS_BLOCKED"));
      },
      credentials: true
    })
  );
  app.use(apiRateLimit);
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use(healthRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
