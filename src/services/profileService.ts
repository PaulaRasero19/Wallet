import { Currency } from "../types/finflow";
import { apiRequest } from "./localBackend/client";

export type Language = "es" | "en" | "pt";

export type Profile = {
  id: string;
  full_name: string | null;
  country_code: string;
  language: Language;
  locale: string;
  primary_currency: Currency;
  secondary_currencies: Currency[];
  monthly_income: number | null;
  payday: number | null;
  income_frequency: "monthly" | "biweekly" | "weekly" | "variable" | null;
  financial_goal: string | null;
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
    | "onboarding_completed"
    | "is_demo"
  >
>;

export async function getProfile(userId: string) {
  const response = await apiRequest<{ profile: Profile }>("/api/auth/me", { requireAuth: true });
  return response.profile;
}

export async function upsertProfile(userId: string, update: ProfileUpdate) {
  const response = await apiRequest<{ profile: Profile }>("/api/profile", {
    body: update,
    method: "PATCH",
    requireAuth: true
  });
  return response.profile;
}

export async function updateProfile(userId: string, update: ProfileUpdate) {
  const response = await apiRequest<{ profile: Profile }>("/api/profile", {
    body: update,
    method: "PATCH",
    requireAuth: true
  });
  return response.profile;
}
