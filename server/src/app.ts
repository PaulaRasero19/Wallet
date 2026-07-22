import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { requireDatabase } from "./middlewares/requireDatabase";
import { apiRateLimit } from "./middlewares/rateLimit";
import { sanitizeMongoOperators } from "./utils/security";
import { accountRouter } from "./routes/account.routes";
import { aiRouter } from "./routes/ai.routes";
import { authRouter } from "./routes/auth.routes";
import { categoryRouter } from "./routes/category.routes";
import { deviceRouter } from "./routes/device.routes";
import { healthRouter } from "./routes/health.routes";
import { financeRouter } from "./routes/finance.routes";
import { profileRouter } from "./routes/profile.routes";
import { notificationRouter } from "./routes/notification.routes";
import { statisticsRouter } from "./routes/statistics.routes";
import { transactionRouter } from "./routes/transaction.routes";
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
  app.use(sanitizeMongoOperators);
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

  app.use(healthRouter);
  app.use("/api", requireDatabase);
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/accounts", accountRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/categories", categoryRouter);
  app.use("/api/devices", deviceRouter);
  app.use("/api/finance", financeRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/transactions", transactionRouter);
  app.use("/api/statistics", statisticsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
