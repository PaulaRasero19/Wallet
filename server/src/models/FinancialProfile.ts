import { Schema, model, Types, type InferSchemaType } from "mongoose";

const financialProfileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    countryName: { type: String, trim: true, default: "Uruguay" },
    countryCode: { type: String, required: true, uppercase: true, trim: true, default: "UY" },
    language: { type: String, enum: ["es", "en", "pt"], required: true, default: "es" },
    locale: { type: String, required: true, default: "es-UY" },
    currencyName: { type: String, trim: true, default: "Peso uruguayo" },
    currencySymbol: { type: String, trim: true, default: "$U" },
    primaryCurrency: { type: String, enum: ["UYU", "USD", "EUR"], required: true, default: "UYU" },
    secondaryCurrencies: [{ type: String, enum: ["UYU", "USD", "EUR"] }],
    profileSetupStep: { type: Number, min: 0, max: 4, default: 0 },
    incomeFrequency: { type: String, enum: ["monthly", "biweekly", "weekly", "variable", null], default: null },
    payday: { type: Number, min: 1, max: 31, default: null },
    secondPayday: { type: Number, min: 1, max: 31, default: null },
    paydayWeekday: { type: Number, min: 0, max: 6, default: null },
    monthlyIncome: { type: Number, min: 0, default: null },
    hasVariableIncome: { type: Boolean, default: false },
    initialBalance: { type: Number, default: 0 },
    financialGoal: { type: String, trim: true, default: null },
    primaryGoal: { type: String, trim: true, default: null },
    antExpenseThreshold: { type: Number, min: 0, default: 400 },
    notificationsEnabled: { type: Boolean, default: false },
    weeklySummaryEnabled: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

export type FinancialProfileDocument = InferSchemaType<typeof financialProfileSchema>;
export const FinancialProfile = model("FinancialProfile", financialProfileSchema);
