import { Currency } from "../types/finflow";
import { apiRequest } from "./apiClient";

export type Language = "es" | "en" | "pt";

export type Profile = {
  id: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  full_name: string | null;
  country_code: string;
  language: Language;
  locale: string;
  primary_currency: Currency;
  secondary_currencies: Currency[];
  monthly_income: number | null;
  payday: number | null;
  income_frequency: "monthly" | "biweekly" | "weekly" | "variable" | null;
  has_variable_income?: boolean;
  initial_balance?: number;
  financial_goal: string | null;
  ant_expense_threshold?: number;
  notifications_enabled?: boolean;
  weekly_summary_enabled?: boolean;
  onboarding_completed: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | "full_name"
    | "country_code"
    | "language"
    | "locale"
    | "primary_currency"
    | "secondary_currencies"
    | "monthly_income"
    | "payday"
    | "income_frequency"
    | "financial_goal"
    | "has_variable_income"
    | "initial_balance"
    | "ant_expense_threshold"
    | "notifications_enabled"
    | "weekly_summary_enabled"
    | "onboarding_completed"
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
