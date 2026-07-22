import { Currency } from "../types/finflow";
import { apiRequest } from "./apiClient";

export type Language = "es" | "en" | "pt";

export type Profile = {
  id: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  full_name: string | null;
  countryName?: string;
  country_name?: string;
  country_code: string;
  language: Language;
  locale: string;
  currencyName?: string;
  currency_name?: string;
  currencySymbol?: string;
  currency_symbol?: string;
  currencyCode?: Currency;
  currency_code?: Currency;
  primary_currency: Currency;
  secondary_currencies: Currency[];
  profileSetupStep?: number;
  profile_setup_step?: number;
  monthly_income: number | null;
  payday: number | null;
  paydayDay?: number | null;
  payday_day?: number | null;
  secondPayday?: number | null;
  second_payday?: number | null;
  paydayWeekday?: number | null;
  payday_weekday?: number | null;
  income_frequency: "monthly" | "biweekly" | "weekly" | "variable" | null;
  has_variable_income?: boolean;
  initial_balance?: number;
  financial_goal: string | null;
  primaryGoal?: string | null;
  primary_goal?: string | null;
  ant_expense_threshold?: number;
  notifications_enabled?: boolean;
  weekly_summary_enabled?: boolean;
  onboarding_completed: boolean;
  profileSetupCompleted?: boolean;
  profile_setup_completed?: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "full_name"
    | "countryName"
    | "country_name"
    | "country_code"
    | "language"
    | "locale"
    | "currencyName"
    | "currency_name"
    | "currencySymbol"
    | "currency_symbol"
    | "currencyCode"
    | "currency_code"
    | "primary_currency"
    | "secondary_currencies"
    | "profileSetupStep"
    | "profile_setup_step"
    | "monthly_income"
    | "payday"
    | "paydayDay"
    | "payday_day"
    | "secondPayday"
    | "second_payday"
    | "paydayWeekday"
    | "payday_weekday"
    | "income_frequency"
    | "financial_goal"
    | "primaryGoal"
    | "primary_goal"
    | "has_variable_income"
    | "initial_balance"
    | "ant_expense_threshold"
    | "notifications_enabled"
    | "weekly_summary_enabled"
    | "onboarding_completed"
    | "profileSetupCompleted"
    | "profile_setup_completed"
    | "is_demo"
  >
>;

export async function getProfile(userId: string) {
  const response = await apiRequest<{ profile: Profile }>("/profile", { requireAuth: true });
  return response.profile;
}

export async function upsertProfile(userId: string, update: ProfileUpdate) {
  const response = await apiRequest<{ profile: Profile }>("/profile", {
    body: update,
    method: "PATCH",
    requireAuth: true
  });
  return response.profile;
}

export async function updateProfile(userId: string, update: ProfileUpdate) {
  const response = await apiRequest<{ profile: Profile }>("/profile", {
    body: update,
    method: "PATCH",
    requireAuth: true
  });
  return response.profile;
}

export async function completeProfileOnboarding(update: ProfileUpdate) {
  const response = await apiRequest<{ profile: Profile }>("/profile/onboarding", {
    body: update,
    method: "POST",
    requireAuth: true
  });
  return response.profile;
}
