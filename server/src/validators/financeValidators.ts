import { z } from "zod";
import { currencySchema, objectIdSchema } from "./commonValidators";

export const recurringPaymentSchema = z.object({
  merchant: z.string().trim().min(1, "El nombre del pago es obligatorio."),
  category: z.string().trim().min(1, "La categoría es obligatoria."),
  amount: z.coerce.number().min(0, "El importe no puede ser negativo."),
  currency: currencySchema,
  frequency: z.enum(["weekly", "monthly", "annual"]),
  nextChargeDate: z.coerce.date(),
  kind: z.enum(["fixed", "subscription", "service"]).default("service"),
  accountId: objectIdSchema.optional(),
  notificationsEnabled: z.boolean().optional().default(true)
});
