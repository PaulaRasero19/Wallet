import type { RequestHandler } from "express";
import { AppError } from "../utils/appError";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, 404, "NOT_FOUND"));
};
