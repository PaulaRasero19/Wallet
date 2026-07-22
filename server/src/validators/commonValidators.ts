import { z } from "zod";
import { AppError } from "../utils/appError";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Identificador inválido.");
export const currencySchema = z.enum(["UYU", "USD", "EUR"]);
export const languageSchema = z.enum(["es", "en", "pt"]);
export const transactionTypeSchema = z.enum(["income", "expense", "transfer", "refund", "goal_contribution", "internal_transfer"]);

export function parseBody<T>(schema: z.ZodType<T>, body: unknown) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Datos inválidos.";
    throw new AppError(message, 400, "VALIDATION_ERROR");
  }

  return result.data;
}
