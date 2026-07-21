import { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, requireSupabase, supabase } from "./supabase/client";
import { Language, Profile, getProfile, updateProfile, upsertProfile } from "./profileService";

export type AuthResult = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  message?: string;
};

async function loadProfile(user: User | null) {
  if (!user) return null;

  try {
    return await getProfile(user.id);
  } catch {
    return upsertProfile(user.id, {
      full_name: (user.user_metadata?.full_name as string | undefined) || null,
      language: ((user.user_metadata?.language as Language | undefined) || "es") as Language
    });
  }
}

export async function getCurrentAuth(): Promise<AuthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, user: null, profile: null, message: "Supabase is not configured." };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const user = data.session?.user ?? null;
  return {
    session: data.session,
    user,
    profile: await loadProfile(user)
  };
}

export function onAuthChanged(callback: (result: AuthResult) => void) {
  if (!isSupabaseConfigured || !supabase) {
    return { unsubscribe: () => undefined };
  }

  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    void loadProfile(user).then((profile) => callback({ session, user, profile }));
  });

  return subscription;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;

  return {
    session: data.session,
    user: data.user,
    profile: await loadProfile(data.user)
  };
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  language: Language;
}): Promise<AuthResult> {
  const { data, error } = await requireSupabase().auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName,
        language: params.language
      }
    }
  });

  if (error) throw error;

  const user = data.session ? data.user : null;

  return {
    session: data.session,
    user,
    profile: await loadProfile(user),
    message: data.session ? undefined : "Check your email to confirm your account before logging in."
  };
}

export async function signInDemoAccount(): Promise<AuthResult> {
  const email = process.env.EXPO_PUBLIC_FINFLOW_DEMO_EMAIL;
  const password = process.env.EXPO_PUBLIC_FINFLOW_DEMO_PASSWORD;

  if (!email || !password) {
    throw new Error("Demo account is not configured. Add EXPO_PUBLIC_FINFLOW_DEMO_EMAIL and EXPO_PUBLIC_FINFLOW_DEMO_PASSWORD.");
  }

  const result = await signInWithEmail(email, password);

  if (result.user) {
    result.profile = await upsertProfile(result.user.id, {
      full_name: result.profile?.full_name || "FinFlow Demo",
      is_demo: true,
      onboarding_completed: true
    });
  }

  return result;
}

export async function sendPasswordRecovery(email: string) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}

export async function saveProfileLanguage(userId: string, language: Language) {
  return updateProfile(userId, { language });
}
