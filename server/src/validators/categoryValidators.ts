import { z } from "zod";
import { transactionTypeSchema } from "./commonValidators";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la categoría es obligatorio."),
  type: transactionTypeSchema,
  icon: z.string().trim().default("circle"),
  color: z.string().trim().default("black")
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional()
});
