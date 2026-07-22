import { Types } from "mongoose";
import { Account } from "../models/Account";
import { FinancialProfile } from "../models/FinancialProfile";
import { User } from "../models/User";
import { AppError } from "../utils/appError";
import { accountDTO, profileDTO } from "./serializers";

type ProfileInput = Record<string, unknown>;

function valueFrom(input: ProfileInput, camel: string, snake: string) {
  return input[camel] ?? input[snake];
}

function hasValue(input: ProfileInput, camel: string, snake: string) {
  return input[camel] !== undefined || input[snake] !== undefined;
}

function profileUpdateFrom(input: ProfileInput, useDefaults: boolean) {
  const update: Record<string, unknown> = {};

  function assign(target: string, camel: string, snake: string, fallback?: unknown) {
    if (hasValue(input, camel, snake)) {
      update[target] = valueFrom(input, camel, snake);
    } else if (useDefaults && fallback !== undefined) {
      update[target] = fallback;
    }
  }

  assign("countryName", "countryName", "country_name", "Uruguay");
  assign("countryCode", "countryCode", "country_code", "UY");
  assign("language", "language", "language", "es");
  assign("locale", "locale", "locale", input.language === "pt" ? "pt-BR" : input.language === "en" ? "en-US" : "es-UY");
  assign("currencyName", "currencyName", "currency_name", "Peso uruguayo");
  assign("currencySymbol", "currencySymbol", "currency_symbol", "$U");
  assign("primaryCurrency", "primaryCurrency", "primary_currency", "UYU");
  if (input.currencyCode !== undefined || input.currency_code !== undefined) {
    update.primaryCurrency = input.currencyCode ?? input.currency_code;
  }
  assign("secondaryCurrencies", "secondaryCurrencies", "secondary_currencies", []);
  assign("profileSetupStep", "profileSetupStep", "profile_setup_step", 0);
  assign("incomeFrequency", "incomeFrequency", "income_frequency", null);
  assign("payday", "payday", "payday_day", null);
  assign("secondPayday", "secondPayday", "second_payday", null);
  assign("paydayWeekday", "paydayWeekday", "payday_weekday", null);
  assign("monthlyIncome", "monthlyIncome", "monthly_income", null);
  assign("hasVariableIncome", "hasVariableIncome", "has_variable_income", false);
  assign("initialBalance", "initialBalance", "initial_balance", 0);
  assign("financialGoal", "financialGoal", "financial_goal", null);
  assign("primaryGoal", "primaryGoal", "primary_goal", null);
  assign("antExpenseThreshold", "antExpenseThreshold", "ant_expense_threshold", 400);
  assign("notificationsEnabled", "notificationsEnabled", "notifications_enabled", false);
  assign("weeklySummaryEnabled", "weeklySummaryEnabled", "weekly_summary_enabled", false);

  if (input.paydayDay !== undefined || input.payday_day !== undefined) {
    update.payday = input.paydayDay ?? input.payday_day;
  }

  return update;
}

function normalizeProfile(input: ProfileInput) {
  const update = profileUpdateFrom(input, true);

  return {
    ...update,
    hasVariableIncome: Boolean(update.hasVariableIncome),
    initialBalance: Number(update.initialBalance),
    antExpenseThreshold: Number(update.antExpenseThreshold),
    notificationsEnabled: Boolean(update.notificationsEnabled),
    weeklySummaryEnabled: Boolean(update.weeklySummaryEnabled)
  };
}

export async function getProfileForUser(userId: Types.ObjectId) {
  const [user, profile] = await Promise.all([User.findById(userId), FinancialProfile.findOne({ userId })]);
  return profileDTO(profile, user);
}

export async function patchProfileForUser(userId: Types.ObjectId, input: ProfileInput) {
  const update = profileUpdateFrom(input, false);
  const profile = await FinancialProfile.findOneAndUpdate({ userId }, update, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });

  if (input.fullName || input.full_name) {
    await User.findByIdAndUpdate(userId, { fullName: input.fullName || input.full_name });
  }

  const setupCompleted = input.profileSetupCompleted ?? input.profile_setup_completed ?? input.onboarding_completed;
  if (setupCompleted !== undefined) {
    await User.findByIdAndUpdate(userId, { onboardingCompleted: Boolean(setupCompleted) });
  }

  const user = await User.findById(userId);
  return profileDTO(profile, user);
}

export async function completeOnboardingForUser(userId: Types.ObjectId, input: ProfileInput) {
  const normalized = normalizeProfile(input) as Record<string, any>;
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
