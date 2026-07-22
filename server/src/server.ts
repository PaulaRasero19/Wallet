import type { Server } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { ensureSystemCategories } from "./services/categorySeedService";
import { logger } from "./utils/logger";

let server: Server | undefined;

async function start() {
  await connectDatabase();
  if (mongoose.connection.readyState === 1) {
    await ensureSystemCategories();
  }

  const app = createApp();
  server = app.listen(env.port, () => {
    logger.info(`FinFlow API listening on port ${env.port}.`, {
      environment: env.nodeEnv
    });
  });
}

async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down FinFlow API.`);

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

start().catch((error) => {
  logger.error("Failed to start FinFlow API.", {
    error: error instanceof Error ? error.message : "Unknown startup error"
  });
  process.exit(1);
});
