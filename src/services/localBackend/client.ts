import { Platform } from "react-native";
import { secureSessionStorage } from "../supabase/secureStorage";

const TOKEN_KEY = "finflow.local.access_token";
const defaultBaseUrl = Platform.OS === "android" ? "http://10.0.2.2:3333" : "http://localhost:3333";

function resolveBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_FINFLOW_API_URL || defaultBaseUrl;

  if (Platform.OS === "android") {
    return configured.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
  }

  return configured;
}

export const apiBaseUrl = resolveBaseUrl();

type ApiOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH";
  requireAuth?: boolean;
};

export async function getStoredToken() {
  return secureSessionStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null) {
  if (!token) {
    await secureSessionStorage.removeItem(TOKEN_KEY);
    return;
  }

  await secureSessionStorage.setItem(TOKEN_KEY, token);
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (options.requireAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || data.error || "No se pudo conectar con el backend local.");
  }

  return data as T;
}
