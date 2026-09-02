"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, ArrowUp, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

import { useTranslation } from "@/lib/i18n";

interface FloatingInputProps {
  onSend: (message: string) => void;
  onStartVoiceMode?: () => void;
  isLoading?: boolean;
  isCentered?: boolean;
  placeholder?: string;
}

export function FloatingInput({
  onSend,
  onStartVoiceMode,
  isLoading = false,
  isCentered = false,
  placeholder,
}: FloatingInputProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayPlaceholder =
    placeholder ||
    t(
      "chat.placeholder",
      "Ask anything about mandi rates, mudra loans, or ledgers...",
    );

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180,
      )}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startVoiceAgent = () => {
    if (!isLoading) onStartVoiceMode?.();
  };

  return (
    <div className="w-full transition-all duration-300 ease-out z-20 font-sans">
      {/* Elevated Pill Container */}
      <div className="relative rounded-2xl md:rounded-3xl border border-sage/25 dark:border-border bg-white/45 dark:bg-card/45 backdrop-blur-md p-2 shadow-lg transition-all focus-within:border-mint focus-within:ring-1 focus-within:ring-mint/40 focus-within:bg-white/65 dark:focus-within:bg-card/65">
        <div className="flex flex-col">
          {/* Main Input Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-3 py-2 text-[14px] sm:text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-hidden disabled:opacity-50 min-h-[44px] max-h-[180px]"
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            {/* Left Actions: Attach */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Attach files or ledger data"
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
              </button>
            </div>

            {/* Right Actions: Live Voice Agent & Send */}
            <div className="flex items-center gap-2">
              {/* Gemini Live Voice Agent Trigger */}
              <button
                type="button"
                onClick={startVoiceAgent}
                disabled={isLoading}
                aria-label="Start live voice agent"
                title={t("common.voiceAgent", "Voice Agent OS")}
                className="size-8 rounded-full flex items-center justify-center bg-mint-pale dark:bg-mint/15 hover:bg-mint/25 text-forest dark:text-mint border border-mint/30 hover:border-mint/50 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              >
                <AudioLines className="size-4" />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "size-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
                  input.trim() && !isLoading
                    ? "bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black shadow-md scale-100"
                    : "bg-sage/20 dark:bg-muted text-muted-foreground cursor-not-allowed opacity-60",
                )}
              >
                <ArrowUp className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Footer Disclaimer */}
      <p className="mt-2 text-center text-[11px] text-muted-foreground select-none">
        {t(
          "chat.disclaimer",
          "VyaparSetu AI can make mistakes. Verify important financial & trade decisions.",
        )}
      </p>
    </div>
  );
}
