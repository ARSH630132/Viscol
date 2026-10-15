"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") return fallback;
  const data = payload as {
    error?: string | { message?: string; issues?: Array<{ message?: string }> };
    message?: string;
  };

  if (typeof data.error === "string") return data.error;
  if (data.error?.issues?.[0]?.message) return data.error.issues[0].message;
  if (data.error?.message) return data.error.message;
  if (data.message) return data.message;
  return fallback;
};

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Unable to reach the assistant"));
  }

  return payload.data.reply;
}
