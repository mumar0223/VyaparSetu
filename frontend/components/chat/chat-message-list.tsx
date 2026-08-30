"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Volume2, VolumeX, AudioLines } from "lucide-react";
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
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

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
    <div className="flex flex-col space-y-6 w-full font-sans">
      {messages.map((msg, index) => {
        const isSystem = msg.role === "system";
        const isUser = msg.role === "user";

        if (isSystem) {
          return (
            <div
              key={msg.id || index}
              className="w-full flex items-center justify-center my-4 animate-in fade-in-50 select-none"
            >
              <div className="w-full max-w-sm flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-mint-pale dark:bg-mint/10 border border-mint/30 text-forest dark:text-mint shadow-2xs">
                <div className="flex items-center gap-2">
                  <AudioLines className="size-4 text-mint animate-pulse" />
                  <span className="text-[12.5px] font-medium">Voice Agent OS Session</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-mint/20 text-forest dark:text-mint border border-mint/30">
                  Live
                </span>
              </div>
            </div>
          );
        }

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
              <div className="max-w-[85%] md:max-w-xl rounded-3xl bg-forest dark:bg-card dark:border dark:border-border px-4 py-3 text-[14px] sm:text-[15px] leading-relaxed text-white dark:text-foreground shadow-xs">
                <MarkdownMessage content={msg.content} variant="user" />
              </div>
            ) : (
              /* Assistant Message */
              <div className="w-full text-foreground text-[14px] sm:text-[15px] leading-relaxed">
                {/* Thinking Loader / Dynamic Tool Accordion */}
                <ThinkingAccordion
                  isStreaming={msg.isStreaming && !msg.content}
                  toolCalls={msg.toolCalls}
                  completedDurationSeconds={msg.thoughtDurationSeconds || 2}
                />

                {/* Rich Markdown Message Content (LaTeX, GFM Tables, Code) */}
                {msg.content && (
                  <MarkdownMessage
                    content={msg.content}
                    variant="assistant"
                  />
                )}

                {/* Assistant Action Bar: Copy & Speak Aloud only */}
                {!msg.isStreaming && msg.content && (
                  <div className="mt-3 flex items-center gap-1.5 text-muted-foreground select-none">
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
      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
    >
      {copied ? (
        <Check className="size-4 text-mint" />
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
          ? "text-mint bg-mint/15 hover:bg-mint/25"
          : "text-muted-foreground hover:text-foreground hover:bg-cream dark:hover:bg-muted"
      )}
    >
      {isSpeaking ? (
        <VolumeX className="size-4 text-mint animate-pulse" />
      ) : (
        <Volume2 className="size-4" />
      )}
    </button>
  );
}
