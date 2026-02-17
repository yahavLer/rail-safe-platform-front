// src/api/config.ts

// API Configuration for Spring Boot Backend
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ✅ Keys used across the app
export const SESSION_KEY = "railsafe.session";
export const ORG_ID_KEY = "railsafe.orgId";

/** fallback רק לפיתוח/בדיקות */
const FALLBACK_ORG_ID = import.meta.env.VITE_ORG_ID || "";

// ------- safe localStorage helpers -------
function safeGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ✅ IMPORTANT: keep DEFAULT_ORG_ID as a LIVE exported binding (so old code won't break)
export let DEFAULT_ORG_ID: string = safeGet(ORG_ID_KEY) || FALLBACK_ORG_ID;

// ✅ Recommended getters/setters going forward
export function getCurrentOrgId(): string {
  return safeGet(ORG_ID_KEY) || DEFAULT_ORG_ID || "";
}

export function setCurrentOrgId(orgId: string): void {
  const clean = (orgId || "").trim();
  if (!clean) return;
  safeSet(ORG_ID_KEY, clean);
  DEFAULT_ORG_ID = clean; // updates live binding for existing imports
}

export function clearCurrentOrgId(): void {
  safeRemove(ORG_ID_KEY);
  DEFAULT_ORG_ID = FALLBACK_ORG_ID;
}

/** שימושי במקומות ש"חייב" orgId */
export function requireOrgId(): string {
  const id = getCurrentOrgId();
  if (!id) throw new Error("אין orgId מחובר. התחברי מחדש.");
  return id;
}

// ------------------ fetch helper ------------------
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = { ...(options.headers || {}) };

  // אם לא FormData – נשלח JSON
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  // Add auth token if available
  const token = safeGet("authToken");
  if (token && !("Authorization" in headers)) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    // מנסים להחזיר הודעה נורמלית מהשרת
    const text = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// HTTP method helpers
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "DELETE" }),
};
