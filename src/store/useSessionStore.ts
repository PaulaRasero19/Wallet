import { create } from "zustand";
import {
  AuthSession,
  AuthUser,
  getCurrentAuth,
  onAuthChanged,
  saveProfileLanguage,
  sendPasswordRecovery,
  signInDemoAccount,
  signInWithEmail,
  signOut,
  signUpWithEmail
} from "../services/authService";
import { completeProfileOnboarding, Language, Profile, ProfileUpdate, updateProfile } from "../services/profileService";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SessionState = {
  authUser: AuthUser | null;
  error: string | null;
  hasInitialized: boolean;
  language: Language;
  profile: Profile | null;
  session: AuthSession | null;
  status: SessionStatus;
  completeOnboarding: (update: ProfileUpdate) => Promise<void>;
  initialize: () => Promise<void>;
  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<string | undefined>;
  saveProfile: (update: ProfileUpdate) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
};

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected authentication error.";
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  authUser: null,
  error: null,
  hasInitialized: false,
  language: "es",
  profile: null,
  session: null,
  status: "loading",
  initialize: async () => {
    set({ error: null, status: "loading" });

    try {
      const result = await getCurrentAuth();
      set({
        authUser: result.user,
        error: result.message || null,
        hasInitialized: true,
        language: result.profile?.language || get().language,
        profile: result.profile,
        session: result.session,
        status: result.user ? "authenticated" : "unauthenticated"
      });
      onAuthChanged();
    } catch (error) {
      set({
        error: messageFrom(error),
        hasInitialized: true,
        status: "unauthenticated"
      });
    }
  },
  restoreSession: async () => get().initialize(),
  login: async (email, password) => {
    set({ error: null, status: "loading" });
    try {
      const result = await signInWithEmail(email, password);
      set({
        authUser: result.user,
        language: result.profile?.language || get().language,
        profile: result.profile,
        session: result.session,
        status: "authenticated"
      });
    } catch (error) {
      set({ error: messageFrom(error), status: "unauthenticated" });
      throw error;
    }
  },
  register: async (email, password, fullName) => {
    set({ error: null, status: "loading" });
    try {
      const result = await signUpWithEmail({ email, password, fullName, language: get().language });
      set({
        authUser: result.user,
        language: result.profile?.language || get().language,
        profile: result.profile,
        session: result.session,
        status: result.user ? "authenticated" : "unauthenticated"
      });
      return result.message;
    } catch (error) {
      set({ error: messageFrom(error), status: "unauthenticated" });
      throw error;
    }
  },
  loginDemo: async () => {
    set({ error: null, status: "loading" });
    try {
      const result = await signInDemoAccount();
      set({
        authUser: result.user,
        language: result.profile?.language || get().language,
        profile: result.profile,
        session: result.session,
        status: "authenticated"
      });
    } catch (error) {
      set({ error: messageFrom(error), status: "unauthenticated" });
      throw error;
    }
  },
  logout: async () => {
    set({ error: null, status: "loading" });
    try {
      await signOut();
      set({
        authUser: null,
        profile: null,
        session: null,
        status: "unauthenticated"
      });
    } catch (error) {
      set({ error: messageFrom(error), status: "authenticated" });
      throw error;
    }
  },
  recoverPassword: async (email) => {
    set({ error: null });
    try {
      await sendPasswordRecovery(email);
    } catch (error) {
      set({ error: messageFrom(error) });
      throw error;
    }
  },
  saveProfile: async (update) => {
    const { authUser } = get();
    if (!authUser) {
      throw new Error("You must be logged in to update your profile.");
    }

    const profile = await updateProfile(authUser.id, update);
    set({ language: profile.language, profile });
  },
  setLanguage: async (language) => {
    const { authUser, profile } = get();
    set({ language, profile: profile ? { ...profile, language } : profile });

    if (authUser) {
      const nextProfile = await saveProfileLanguage(authUser.id, language);
      set({ profile: nextProfile });
    }
  },
  completeOnboarding: async (update) => {
    const { authUser } = get();
    if (!authUser) {
      throw new Error("You must be logged in to complete onboarding.");
    }

    const profile = await completeProfileOnboarding(update);
    set({ language: profile.language, profile });
  }
}));
