"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function managementFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof FormData === "undefined" || !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || payload.error || "Unable to complete request");
  return payload;
}
