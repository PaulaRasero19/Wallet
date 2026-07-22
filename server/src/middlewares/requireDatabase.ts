import type { NextFunction, Response } from "express";
import mongoose from "mongoose";
import type { FinFlowRequest } from "../types/http";
import { AppError } from "../utils/appError";

export function requireDatabase(_req: FinFlowRequest, _res: Response, next: NextFunction) {
  if (mongoose.connection.readyState === 1) {
    next();
    return;
  }

  next(new AppError("MongoDB Atlas no está configurado o conectado. Revisá MONGODB_URI en server/.env.", 503, "DATABASE_DISCONNECTED"));
}
