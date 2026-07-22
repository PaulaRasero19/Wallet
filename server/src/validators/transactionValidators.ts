import { z } from "zod";
import { currencySchema, objectIdSchema, transactionTypeSchema } from "./commonValidators";

export const createTransactionSchema = z.object({
  accountId: objectIdSchema,
  account_id: objectIdSchema.optional(),
  categoryId: objectIdSchema,
  category_id: objectIdSchema.optional(),
  type: transactionTypeSchema,
  title: z.string().trim().min(1, "El título es obligatorio."),
  merchant: z.string().trim().optional().default(""),
  amount: z.coerce.number().positive("El importe debe ser mayor a cero."),
  currency: currencySchema,
  date: z.coerce.date(),
  note: z.string().trim().optional().default(""),
  isRecurring: z.boolean().optional().default(false),
  is_recurring: z.boolean().optional(),
  isAntExpense: z.boolean().optional(),
  is_ant_expense: z.boolean().optional()
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
  categoryId: objectIdSchema.optional(),
  accountId: objectIdSchema.optional(),
  currency: currencySchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  isAntExpense: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).default("date_desc")
});
