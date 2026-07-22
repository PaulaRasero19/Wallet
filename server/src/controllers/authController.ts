import type { Request, Response } from "express";
import { env } from "../config/env";
import type { FinFlowRequest } from "../types/http";
import { logger } from "../utils/logger";
import { parseBody } from "../validators/commonValidators";
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema } from "../validators/authValidators";
import { createPasswordReset, getMe, loginUser, logoutUser, registerUser, resetPassword, rotateRefreshToken } from "../services/authService";

export async function register(req: Request, res: Response) {
  const body = parseBody(registerSchema, req.body);
  res.status(201).json(await registerUser(body));
}

export async function login(req: Request, res: Response) {
  const body = parseBody(loginSchema, req.body);
  res.json(await loginUser(body));
}

export async function refresh(req: Request, res: Response) {
  const body = parseBody(refreshSchema, req.body);
  res.json(await rotateRefreshToken(body.refreshToken));
}

export async function logout(req: FinFlowRequest, res: Response) {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;
  await logoutUser(refreshToken, req.user?.mongoId);
  res.status(204).send();
}

export async function me(req: FinFlowRequest, res: Response) {
  res.json(await getMe(req.user!.mongoId));
}

export async function forgotPassword(req: Request, res: Response) {
  const body = parseBody(forgotPasswordSchema, req.body);
  const token = await createPasswordReset(body.email);

  if (token && env.nodeEnv !== "production") {
    logger.info("Password recovery URL generated for development.", {
      url: `finflow://reset-password?token=${token}`
    });
  }

  res.json({ message: "Si el email existe, registramos una solicitud de recuperación." });
}

export async function resetPasswordController(req: Request, res: Response) {
  const body = parseBody(resetPasswordSchema, req.body);
  await resetPassword(body.token, body.password);
  res.json({ message: "Contraseña actualizada correctamente." });
}
