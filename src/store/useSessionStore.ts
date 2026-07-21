import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  getCurrentAuth,
  onAuthChanged,
  saveProfileLanguage,
  sendPasswordRecovery,
  signInDemoAccount,
  signInWithEmail,
  signOut,
  signUpWithEmail
} from "../services/authService";
import { isSupabaseConfigured } from "../services/supabase/client";
import { Language, Profile, ProfileUpdate, updateProfile } from "../services/profileService";

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "config-missing";

type SessionState = {
  authUser: User | null;
  error: string | null;
  hasInitialized: boolean;
  language: Language;
  profile: Profile | null;
  session: Session | null;
  status: SessionStatus;
  completeOnboarding: (update: ProfileUpdate) => Promise<void>;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<string | undefined>;
  setLanguage: (language: Language) => Promise<void>;
};

let authSubscription: { unsubscribe: () => void } | null = null;

function statusFor(session: Session | null) {
  if (!isSupabaseConfigured) return "config-missing";
  return session ? "authenticated" : "unauthenticated";
}

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
        status: statusFor(result.session)
      });

      if (!authSubscription) {
        authSubscription = onAuthChanged((next) => {
          set({
            authUser: next.user,
            language: next.profile?.language || get().language,
            profile: next.profile,
            session: next.session,
            status: statusFor(next.session)
          });
        });
      }
    } catch (error) {
      set({
        error: messageFrom(error),
        hasInitialized: true,
        status: isSupabaseConfigured ? "unauthenticated" : "config-missing"
      });
    }
  },
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
      set({ error: messageFrom(error), status: isSupabaseConfigured ? "unauthenticated" : "config-missing" });
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
        status: result.session ? "authenticated" : "unauthenticated"
      });
      return result.message;
    } catch (error) {
      set({ error: messageFrom(error), status: isSupabaseConfigured ? "unauthenticated" : "config-missing" });
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
      set({ error: messageFrom(error), status: isSupabaseConfigured ? "unauthenticated" : "config-missing" });
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
        status: isSupabaseConfigured ? "unauthenticated" : "config-missing"
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

    const profile = await updateProfile(authUser.id, {
      ...update,
      onboarding_completed: true
    });
    set({ language: profile.language, profile });
  }
}));
