import { apiRequest, clearTokens, getRefreshToken, setTokens } from "./apiClient";
import { Language, Profile, updateProfile } from "./profileService";

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  full_name: string | null;
  onboardingCompleted?: boolean;
  onboarding_completed?: boolean;
  isDemo?: boolean;
  is_demo?: boolean;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
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
    const result = await apiRequest<{ user: AuthUser; profile: Profile }>("/auth/me", { requireAuth: true });
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
  const result = await apiRequest<AuthResponse>("/auth/login", {
    body: { email, password },
    method: "POST"
  });
  await setTokens(result.session.access_token, result.session.refresh_token);
  return result;
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  language: Language;
}): Promise<AuthResult> {
  const result = await apiRequest<AuthResponse>("/auth/register", {
    body: params,
    method: "POST"
  });
  await setTokens(result.session.access_token, result.session.refresh_token);
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
    result.profile = await updateProfile(result.user.id, {});
  }

  return result;
}

export async function sendPasswordRecovery(email: string) {
  await apiRequest("/auth/forgot-password", {
    body: { email },
    method: "POST"
  });
}

export async function signOut() {
  try {
    const refreshToken = await getRefreshToken();
    await apiRequest("/auth/logout", {
      body: { refreshToken },
      method: "POST",
      requireAuth: true
    });
  } finally {
    await clearTokens();
  }
}

export async function saveProfileLanguage(userId: string, language: Language) {
  return updateProfile(userId, { language });
}
