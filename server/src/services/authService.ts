import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../config/env";
import { FinancialProfile } from "../models/FinancialProfile";
import { PasswordResetToken } from "../models/PasswordResetToken";
import { RefreshToken } from "../models/RefreshToken";
import { User } from "../models/User";
import { AppError } from "../utils/appError";
import { createSecureToken, sha256 } from "../utils/security";
import { profileDTO, userDTO } from "./serializers";

const bcryptRounds = 12;

function signJwt(payload: object, secret: string, expiresIn: string) {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

function refreshExpiryDate() {
  const value = env.jwtRefreshExpiresIn;
  const days = value.endsWith("d") ? Number(value.slice(0, -1)) : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function createSession(user: InstanceType<typeof User>) {
  const accessToken = signJwt({ sub: user._id.toString(), email: user.email, type: "access" }, env.jwtAccessSecret, env.jwtAccessExpiresIn);
  const refreshToken = createSecureToken();
  const refreshHash = sha256(refreshToken);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshHash,
    expiresAt: refreshExpiryDate()
  });

  return {
    accessToken,
    refreshToken,
    access_token: accessToken,
    refresh_token: refreshToken,
    user_id: user._id.toString(),
    created_at: new Date().toISOString()
  };
}

export async function registerUser(input: { fullName: string; email: string; password: string; language: "es" | "en" | "pt" }) {
  const existing = await User.exists({ email: input.email });
  if (existing) {
    throw new AppError("Ya existe una cuenta con ese email.", 409, "EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, bcryptRounds);
  const user = await User.create({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
    emailVerified: true,
    isDemo: false,
    onboardingCompleted: false
  });

  const profile = await FinancialProfile.create({
    userId: user._id,
    language: input.language,
    locale: input.language === "es" ? "es-UY" : input.language === "pt" ? "pt-BR" : "en-US",
    countryCode: "UY",
    primaryCurrency: "UYU",
    secondaryCurrencies: []
  });

  const session = await createSession(user);

  return {
    session,
    user: userDTO(user),
    profile: profileDTO(profile, user)
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");

  if (!user) {
    throw new AppError("Email o contraseña incorrectos.", 401, "INVALID_CREDENTIALS");
  }

  const isValid = await bcrypt.compare(input.password, String(user.passwordHash));
  if (!isValid) {
    throw new AppError("Email o contraseña incorrectos.", 401, "INVALID_CREDENTIALS");
  }

  const profile = await FinancialProfile.findOne({ userId: user._id });
  const session = await createSession(user);

  return {
    session,
    user: userDTO(user),
    profile: profileDTO(profile, user)
  };
}

export async function getMe(userId: Types.ObjectId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
  }

  const profile = await FinancialProfile.findOne({ userId });
  return {
    user: userDTO(user),
    profile: profileDTO(profile, user)
  };
}

export async function rotateRefreshToken(refreshToken: string) {
  const tokenHash = sha256(refreshToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
    throw new AppError("Refresh token inválido.", 401, "INVALID_REFRESH_TOKEN");
  }

  const user = await User.findById(stored.userId);
  if (!user) {
    throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
  }

  const session = await createSession(user);
  stored.revokedAt = new Date();
  stored.replacedByTokenHash = sha256(session.refreshToken);
  await stored.save();

  return {
    session,
    user: userDTO(user),
    profile: profileDTO(await FinancialProfile.findOne({ userId: user._id }), user)
  };
}

export async function logoutUser(refreshToken?: string, userId?: Types.ObjectId) {
  if (refreshToken) {
    await RefreshToken.updateOne({ tokenHash: sha256(refreshToken) }, { revokedAt: new Date() });
    return;
  }

  if (userId) {
    await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  }
}

export async function createPasswordReset(email: string) {
  const user = await User.findOne({ email });
  if (!user) {
    return null;
  }

  const token = createSecureToken(32);
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  });

  return token;
}

export async function resetPassword(token: string, password: string) {
  const stored = await PasswordResetToken.findOne({ tokenHash: sha256(token) });
  if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
    throw new AppError("El enlace de recuperación no es válido o expiró.", 400, "RESET_TOKEN_INVALID");
  }

  const user = await User.findById(stored.userId).select("+passwordHash");
  if (!user) {
    throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
  }

  user.passwordHash = await bcrypt.hash(password, bcryptRounds);
  stored.usedAt = new Date();
  await Promise.all([user.save(), stored.save(), RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() })]);
}
