"use client";

import { useRef, useEffect, useState } from "react";
import { Copy, Check, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThinkingAccordion } from "./thinking-accordion";
import { MarkdownMessage } from "./markdown-message";
import type { ChatMessage } from "./types";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatMessageList({
  messages,
  isLoading = false,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Auto-scroll to bottom on new message / streaming update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Clean up speech synthesis when unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text
      .replace(/[\#\*\`\$\_\[\]\(\)]/g, "")
      .replace(/\n+/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto"
    >
      <div className="max-w-3xl w-full mx-auto px-4 md:px-6 py-6 space-y-6 pb-44">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id || index}
              className={cn(
                "flex flex-col w-full animate-in fade-in-50 duration-200",
                isUser ? "items-end" : "items-start"
              )}
            >
              {isUser ? (
                /* User Message Bubble */
                <div className="max-w-[85%] md:max-w-xl rounded-3xl bg-[#2b2b2b] px-4 py-3 text-[15px] leading-relaxed text-zinc-100 shadow-xs">
                  <MarkdownMessage content={msg.content} variant="user" />
                </div>
              ) : (
                /* Assistant Message */
                <div className="w-full text-zinc-200 text-[15px] leading-relaxed">
                  {/* Thinking Loader / Dynamic Tool Accordion */}
                  <ThinkingAccordion
                    isStreaming={msg.isStreaming && !msg.content}
                    toolCalls={msg.toolCalls}
                    completedDurationSeconds={msg.thoughtDurationSeconds || 2}
                  />

                  {/* Rich Markdown Message Content (LaTeX, GFM Tables, Code) */}
                  {msg.content && (
                    <MarkdownMessage content={msg.content} variant="assistant" />
                  )}

                  {/* Assistant Action Bar: Copy & Speak Aloud only */}
                  {!msg.isStreaming && msg.content && (
                    <div className="mt-3 flex items-center gap-1.5 text-zinc-400 select-none">
                      <CopyButton text={msg.content} />
                      <SpeakButton
                        isSpeaking={speakingMessageId === msg.id}
                        onToggle={() => handleToggleSpeak(msg.id, msg.content)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied" : "Copy"}
      className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
    >
      {copied ? (
        <Check className="size-4 text-emerald-400" />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}

function SpeakButton({
  isSpeaking,
  onToggle,
}: {
  isSpeaking: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isSpeaking ? "Stop reading" : "Read aloud"}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg transition-colors cursor-pointer",
        isSpeaking
          ? "text-sky-400 bg-sky-500/10 hover:bg-sky-500/20"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
      )}
    >
      {isSpeaking ? (
        <VolumeX className="size-4 text-sky-400 animate-pulse" />
      ) : (
        <Volume2 className="size-4" />
      )}
    </button>
  );
}
