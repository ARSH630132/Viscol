"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const AUTH_STATE_EVENT = "college-visitor-auth-state";

export interface AuthUser {
  id: number;
  name: string;
  mobile: string;
  email: string;
}

export interface RegisterInput {
  name: string;
  mobile: string;
  email: string;
}

const authFetch = (path: string, init?: RequestInit) =>
  fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

export async function register(input: RegisterInput): Promise<AuthUser> {
  const response = await authFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Unable to continue");
  }

  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  return payload.data;
}

export async function getMe(): Promise<AuthUser | null> {
  const response = await authFetch("/api/auth/me");
  if (response.status === 401) return null;

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load user");
  }

  return payload.data;
}

export async function logout() {
  await authFetch("/api/auth/logout", { method: "POST" });
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
}

export async function isLoggedIn() {
  return Boolean(await getMe());
}
