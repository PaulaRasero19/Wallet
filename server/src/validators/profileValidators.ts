import { z } from "zod";
import { currencySchema, languageSchema } from "./commonValidators";

const incomeFrequencySchema = z.enum(["monthly", "biweekly", "weekly", "variable"]).nullable().optional();

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es obligatorio.").optional(),
  countryCode: z.string().trim().min(2, "El país es obligatorio.").max(3).optional(),
  country_code: z.string().trim().min(2).max(3).optional(),
  language: languageSchema.optional(),
  locale: z.string().trim().min(2).optional(),
  primaryCurrency: currencySchema.optional(),
  primary_currency: currencySchema.optional(),
  secondaryCurrencies: z.array(currencySchema).optional(),
  secondary_currencies: z.array(currencySchema).optional(),
  incomeFrequency: incomeFrequencySchema,
  income_frequency: incomeFrequencySchema,
  payday: z.coerce.number().int().min(1).max(31).nullable().optional(),
  monthlyIncome: z.coerce.number().min(0).nullable().optional(),
  monthly_income: z.coerce.number().min(0).nullable().optional(),
  hasVariableIncome: z.boolean().optional(),
  has_variable_income: z.boolean().optional(),
  initialBalance: z.coerce.number().optional(),
  initial_balance: z.coerce.number().optional(),
  financialGoal: z.string().trim().nullable().optional(),
  financial_goal: z.string().trim().nullable().optional(),
  antExpenseThreshold: z.coerce.number().min(0).optional(),
  ant_expense_threshold: z.coerce.number().min(0).optional(),
  notificationsEnabled: z.boolean().optional(),
  notifications_enabled: z.boolean().optional(),
  weeklySummaryEnabled: z.boolean().optional(),
  weekly_summary_enabled: z.boolean().optional(),
  onboarding_completed: z.boolean().optional()
});

export const onboardingSchema = profileUpdateSchema.extend({
  countryCode: z.string().trim().min(2, "El país es obligatorio.").max(3).optional(),
  country_code: z.string().trim().min(2).max(3).optional(),
  primaryCurrency: currencySchema.optional(),
  primary_currency: currencySchema.optional()
});
