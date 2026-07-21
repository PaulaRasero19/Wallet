import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export type DatabaseStatus = {
  connected: boolean;
  readyState: number;
  message: string;
};

let databaseMessage = "Database connection has not been attempted.";

export async function connectDatabase() {
  if (!env.mongodbUri) {
    databaseMessage = "MONGODB_URI is not configured. Running in database disconnected mode.";
    logger.warn(databaseMessage);
    return;
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 7000
    });
    databaseMessage = "MongoDB connected.";
    logger.info(databaseMessage);
  } catch (error) {
    databaseMessage = "MongoDB connection failed. Running in database disconnected mode.";
    logger.error(databaseMessage, {
      error: error instanceof Error ? error.message : "Unknown database error"
    });
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected.");
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  const readyState = mongoose.connection.readyState;
  return {
    connected: readyState === 1,
    readyState,
    message: databaseMessage
  };
}
