import { Types } from "mongoose";
import { Account } from "../models/Account";
import { FinancialProfile } from "../models/FinancialProfile";
import { User } from "../models/User";
import { AppError } from "../utils/appError";
import { accountDTO, profileDTO } from "./serializers";

type ProfileInput = Record<string, unknown>;

function normalizeProfile(input: ProfileInput) {
  return {
    countryCode: (input.countryCode || input.country_code || "UY") as string,
    language: (input.language || "es") as "es" | "en" | "pt",
    locale: (input.locale || (input.language === "pt" ? "pt-BR" : input.language === "en" ? "en-US" : "es-UY")) as string,
    primaryCurrency: (input.primaryCurrency || input.primary_currency || "UYU") as "UYU" | "USD" | "EUR",
    secondaryCurrencies: (input.secondaryCurrencies || input.secondary_currencies || []) as string[],
    incomeFrequency: input.incomeFrequency ?? input.income_frequency ?? null,
    payday: input.payday ?? null,
    monthlyIncome: input.monthlyIncome ?? input.monthly_income ?? null,
    hasVariableIncome: Boolean(input.hasVariableIncome ?? input.has_variable_income ?? false),
    initialBalance: Number(input.initialBalance ?? input.initial_balance ?? 0),
    financialGoal: (input.financialGoal ?? input.financial_goal ?? null) as string | null,
    antExpenseThreshold: Number(input.antExpenseThreshold ?? input.ant_expense_threshold ?? 400),
    notificationsEnabled: Boolean(input.notificationsEnabled ?? input.notifications_enabled ?? false),
    weeklySummaryEnabled: Boolean(input.weeklySummaryEnabled ?? input.weekly_summary_enabled ?? false)
  };
}

export async function getProfileForUser(userId: Types.ObjectId) {
  const [user, profile] = await Promise.all([User.findById(userId), FinancialProfile.findOne({ userId })]);
  return profileDTO(profile, user);
}

export async function patchProfileForUser(userId: Types.ObjectId, input: ProfileInput) {
  const update = normalizeProfile(input);
  const profile = await FinancialProfile.findOneAndUpdate({ userId }, update, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });

  if (input.fullName || input.full_name) {
    await User.findByIdAndUpdate(userId, { fullName: input.fullName || input.full_name });
  }

  const user = await User.findById(userId);
  return profileDTO(profile, user);
}

export async function completeOnboardingForUser(userId: Types.ObjectId, input: ProfileInput) {
  const normalized = normalizeProfile(input);
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
  }

  const profile = await FinancialProfile.findOneAndUpdate({ userId }, normalized, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
  user.onboardingCompleted = true;
  await user.save();

  let account = await Account.findOne({ userId, name: "Cuenta principal" });
  if (!account) {
    account = await Account.create({
      userId,
      name: "Cuenta principal",
      type: "cash",
      currency: normalized.primaryCurrency,
      initialBalance: normalized.initialBalance,
      currentBalance: normalized.initialBalance,
      isActive: true
    });
  }

  return {
    profile: profileDTO(profile, user),
    account: accountDTO(account)
  };
}
