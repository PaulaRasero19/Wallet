import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { User } from "../models/User";
import type { FinFlowRequest } from "../types/http";
import { AppError } from "../utils/appError";

type AccessPayload = {
  sub: string;
  email: string;
  type: "access";
};

export async function authenticate(req: FinFlowRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

    if (!token) {
      throw new AppError("Necesitás iniciar sesión.", 401, "UNAUTHORIZED");
    }

    const payload = jwt.verify(token, env.jwtAccessSecret) as AccessPayload;

    if (payload.type !== "access" || !Types.ObjectId.isValid(payload.sub)) {
      throw new AppError("Sesión inválida.", 401, "INVALID_TOKEN");
    }

    const user = await User.findById(payload.sub).select("_id email isDemo");

    if (!user) {
      throw new AppError("Sesión inválida.", 401, "INVALID_TOKEN");
    }

    req.user = {
      id: user._id.toString(),
      mongoId: user._id,
      email: String(user.email),
      isDemo: Boolean(user.isDemo)
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError("Sesión expirada o inválida.", 401, "INVALID_TOKEN"));
  }
}
