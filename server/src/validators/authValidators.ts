import { z } from "zod";
import { languageSchema } from "./commonValidators";

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "La contraseña debe incluir al menos una letra.")
  .regex(/\d/, "La contraseña debe incluir al menos un número.");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(80, "El nombre es demasiado largo."),
  email: z.string().trim().email("Ingresá un email válido.").toLowerCase(),
  password: passwordSchema,
  language: languageSchema.default("es")
});

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido.").toLowerCase(),
  password: z.string().min(1, "Ingresá tu contraseña.")
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, "Refresh token inválido.")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido.").toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Token inválido."),
  password: passwordSchema
});
