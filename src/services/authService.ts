import { apiRequest, setStoredToken } from "./localBackend/client";
import { Language, Profile, updateProfile } from "./profileService";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string | null;
};

export type AuthSession = {
  access_token: string;
  user_id: string;
  created_at: string;
};

export type AuthResult = {
  session: AuthSession | null;
  user: AuthUser | null;
  profile: Profile | null;
  message?: string;
};

type AuthResponse = {
  session: AuthSession;
  user: AuthUser;
  profile: Profile;
};

export async function getCurrentAuth(): Promise<AuthResult> {
  try {
    const result = await apiRequest<{ user: AuthUser; profile: Profile }>("/api/auth/me", { requireAuth: true });
    return {
      session: null,
      user: result.user,
      profile: result.profile
    };
  } catch {
    return { session: null, user: null, profile: null };
  }
}

export function onAuthChanged() {
  return { unsubscribe: () => undefined };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const result = await apiRequest<AuthResponse>("/api/auth/login", {
    body: { email, password },
    method: "POST"
  });
  await setStoredToken(result.session.access_token);
  return result;
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  language: Language;
}): Promise<AuthResult> {
  const result = await apiRequest<AuthResponse>("/api/auth/register", {
    body: params,
    method: "POST"
  });
  await setStoredToken(result.session.access_token);
  return result;
}

export async function signInDemoAccount(): Promise<AuthResult> {
  const email = process.env.EXPO_PUBLIC_FINFLOW_DEMO_EMAIL;
  const password = process.env.EXPO_PUBLIC_FINFLOW_DEMO_PASSWORD;

  if (!email || !password) {
    throw new Error("La cuenta demo no está configurada en .env.");
  }

  const result = await signInWithEmail(email, password);

  if (result.user) {
    result.profile = await updateProfile(result.user.id, {
      is_demo: true,
      onboarding_completed: true
    });
  }

  return result;
}

export async function sendPasswordRecovery(email: string) {
  await apiRequest("/api/auth/recover", {
    body: { email },
    method: "POST"
  });
}

export async function signOut() {
  try {
    await apiRequest("/api/auth/logout", {
      method: "POST",
      requireAuth: true
    });
  } finally {
    await setStoredToken(null);
  }
}

export async function saveProfileLanguage(userId: string, language: Language) {
  return updateProfile(userId, { language });
}
