"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const AUTH_STATE_EVENT = "college-visitor-auth-state";

export interface AuthUser {
  id: number;
  name: string;
  mobile: string;
  email: string;
  role: "Student" | "College" | "Admin";
}

export interface RegisterInput {
  name: string;
  mobile: string;
  email: string;
}

export interface VerifyOtpInput extends RegisterInput {
  otp: string;
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

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as { error?: string | { message?: string; issues?: Array<{ message?: string }> }; message?: string };

  if (typeof data.error === "string") return data.error;
  if (data.error?.issues?.[0]?.message) return data.error.issues[0].message;
  if (data.error?.message) return data.error.message;
  if (data.message) return data.message;
  return fallback;
};

export async function sendOtp(input: RegisterInput): Promise<void> {
  const response = await authFetch("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Unable to continue"));
  }
}

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthUser> {
  const response = await authFetch("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Unable to verify OTP"));
  }

  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  return payload.data;
}

export const register = verifyOtp;

export async function getMe(): Promise<AuthUser | null> {
  const response = await authFetch("/api/auth/me");
  if (response.status === 401) return null;

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Unable to load user"));
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
