"use client";

import { Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CollegeIcon } from "@/components/icons/college-icon";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage, type ChatMessage } from "@/lib/chat-client";
import { cn } from "@/lib/utils";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Viscol Assistant. Ask me about colleges, fees, placements, scholarships, or how to use the platform.",
};

const SUGGESTIONS = [
  "Best colleges under ₹2L/year?",
  "Colleges in Lucknow",
  "How do I apply on Viscol?",
];

function ChatMessageContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter(Boolean);
        const headline = lines[0] ?? "";
        const isCollegeCard = /^\d+\.\s/.test(headline);
        const details = lines.slice(1);

        if (isCollegeCard) {
          return (
            <div
              key={blockIndex}
              className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5"
            >
              <p className="font-medium text-white">{headline}</p>
              {details.map((line, lineIndex) => (
                <p key={lineIndex} className="mt-1 pl-2 text-xs text-white/65">
                  {line.trim()}
                </p>
              ))}
            </div>
          );
        }

        return (
          <div key={blockIndex} className="space-y-1">
            {lines.map((line, lineIndex) => (
              <p
                key={lineIndex}
                className={cn(
                  lineIndex === 0 && lines.length > 1 ? "font-medium text-white" : "",
                )}
              >
                {line}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await sendChatMessage(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(input);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1d706d] text-white shadow-lg shadow-black/30 transition hover:scale-105 hover:bg-[#25918d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6c091]"
          aria-label="Open chat assistant"
        >
          <CollegeIcon className="h-7 w-7" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(560px,calc(100vh-3rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a2427] shadow-2xl shadow-black/40">
          <header className="flex items-center justify-between border-b border-white/10 bg-[#07191b] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1d706d]/20 text-[#6ecfc9]">
                <CollegeIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Viscol Assistant</p>
                <p className="text-xs text-white/50">College advisor · AI powered</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1d706d]/20 text-[#6ecfc9]">
                      <CollegeIcon className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "rounded-br-md bg-[#1d706d] text-white whitespace-pre-line"
                        : "rounded-bl-md bg-white/5 text-white/90",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <ChatMessageContent content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-white/50">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d706d]/20">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6ecfc9]" />
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submit(suggestion)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-[#1d706d]/50 hover:bg-[#1d706d]/10 hover:text-white"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-white/10 bg-[#07191b] p-3">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about colleges..."
                rows={1}
                disabled={loading}
                className="min-h-[42px] max-h-28 resize-none border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-[#1d706d]"
              />
              <Button
                size="icon"
                disabled={!input.trim() || loading}
                onClick={() => submit(input)}
                className="h-[42px] w-[42px] shrink-0 rounded-xl bg-[#1d706d] hover:bg-[#25918d]"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
