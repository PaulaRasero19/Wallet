import { z } from "zod";
import { currencySchema, objectIdSchema } from "./commonValidators";

export const recurringPaymentSchema = z.object({
  merchant: z.string().trim().min(1, "El nombre del pago es obligatorio."),
  category: z.string().trim().min(1, "La categoría es obligatoria."),
  amount: z.coerce.number().min(0, "El importe no puede ser negativo."),
  currency: currencySchema,
  frequency: z.enum(["once", "weekly", "monthly", "annual"]),
  nextChargeDate: z.coerce.date(),
  reminderDaysBefore: z.coerce.number().int().min(0).max(30).default(3),
  kind: z.enum(["fixed", "subscription", "service"]).default("service"),
  accountId: objectIdSchema.optional(),
  notificationsEnabled: z.boolean().optional().default(true)
});

export const installmentPurchaseSchema = z.object({
  accountId: objectIdSchema.optional(),
  name: z.string().trim().min(1, "El nombre de la compra es obligatorio."),
  totalAmount: z.coerce.number().positive("El importe total debe ser mayor a cero."),
  totalInstallments: z.coerce.number().int().min(1),
  firstDueDate: z.coerce.date(),
  category: z.string().trim().min(1, "La categoría es obligatoria."),
  currency: currencySchema,
  reminderDaysBefore: z.coerce.number().int().min(0).max(30).default(3)
});

export const goalSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la meta es obligatorio."),
  target: z.coerce.number().positive("El monto objetivo debe ser mayor a cero."),
  saved: z.coerce.number().min(0).default(0),
  currency: currencySchema,
  monthlyContribution: z.coerce.number().min(0).default(0),
  targetDate: z.coerce.date().nullable().optional()
});
