import { z } from "zod";
import { currencySchema } from "./commonValidators";

export const accountTypeSchema = z.enum(["cash", "bank", "savings", "wallet", "credit", "other"]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la cuenta es obligatorio."),
  type: accountTypeSchema.default("cash"),
  currency: currencySchema,
  initialBalance: z.coerce.number().default(0),
  initial_balance: z.coerce.number().optional()
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
});
