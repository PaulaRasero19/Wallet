import type { RequestHandler } from "express";
import { env } from "../config/env";
import { getDatabaseStatus } from "../config/database";

export const getHealth: RequestHandler = (_req, res) => {
  const database = getDatabaseStatus();

  res.status(200).json({
    ok: true,
    service: "finflow-api",
    environment: env.nodeEnv,
    database,
    features: {
      auth: "implemented",
      financialCore: "implemented",
      mongoPrepared: true,
      geminiConfigured: env.geminiConfigured
    },
    timestamp: new Date().toISOString()
  });
};
