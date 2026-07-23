import { Platform } from "react-native";
import { secureSessionStorage } from "./supabase/secureStorage";

const ACCESS_TOKEN_KEY = "finflow.access_token";
const REFRESH_TOKEN_KEY = "finflow.refresh_token";

const defaultApiUrl = Platform.OS === "android" ? "http://10.0.2.2:3333/api" : "http://localhost:3333/api";

function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL || defaultApiUrl;
  const normalized = configured.endsWith("/") ? configured.slice(0, -1) : configured;

  if (Platform.OS === "android") {
    return normalized.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2");
  }

  return normalized;
}

export const apiBaseUrl = resolveApiUrl();

export type ApiError = Error & {
  status?: number;
  code?: string;
};

type ApiOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  networkRetry?: boolean;
  requireAuth?: boolean;
  retry?: boolean;
  timeoutMs?: number;
};

export async function getAccessToken() {
  return secureSessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return secureSessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string | null, refreshToken?: string | null) {
  if (accessToken) {
    await secureSessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    await secureSessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken !== undefined) {
    if (refreshToken) {
      await secureSessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await secureSessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

export async function clearTokens() {
  await setTokens(null, null);
}

async function refreshSession() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw Object.assign(new Error("La sesión expiró. Iniciá sesión nuevamente."), { status: 401, code: "NO_REFRESH_TOKEN" });
  }

  const result = await apiRequest<{ session: { access_token: string; refresh_token: string } }>("/auth/refresh", {
    body: { refreshToken },
    method: "POST",
    retry: false
  });

  await setTokens(result.session.access_token, result.session.refresh_token);
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  // Render's free instances can need about a minute to wake after inactivity.
  // Keep the first request alive long enough for that cold start to complete.
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 75000);

  try {
    const token = options.requireAuth ? await getAccessToken() : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (response.status === 401 && options.requireAuth && options.retry !== false) {
      try {
        await refreshSession();
        return apiRequest<T>(path, { ...options, retry: false });
      } catch (error) {
        await clearTokens();
        throw error;
      }
    }

    if (!response.ok) {
      const error = Object.assign(new Error(data.message || "No se pudo completar la solicitud."), {
        status: response.status,
        code: data.error
      });
      throw error;
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("FinFlow está tardando en conectarse. Esperá unos segundos e intentá nuevamente.");
    }

    if (error instanceof TypeError) {
      if (options.networkRetry !== false) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return apiRequest<T>(path, { ...options, networkRetry: false });
      }

      throw new Error("No pudimos conectarnos. Revisá tu conexión a internet e intentá nuevamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
