import { Currency } from "../types/finflow";
import { requireSupabase } from "./supabase/client";

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
  const { data, error } = await requireSupabase().from("profiles").select("*").eq("id", userId).single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function upsertProfile(userId: string, update: ProfileUpdate) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .upsert({ id: userId, ...update }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function updateProfile(userId: string, update: ProfileUpdate) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}
