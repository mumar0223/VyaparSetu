"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, ArrowUp, Mic, Brain, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

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
  placeholder = "Ask anything about mandi rates, mudra loans, or ledgers...",
}: FloatingInputProps) {
  const [input, setInput] = useState("");
  const [isThinkEnabled, setIsThinkEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
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
      <div className="relative rounded-2xl md:rounded-3xl border border-sage/40 dark:border-border bg-white/95 dark:bg-card/95 p-2 shadow-xl backdrop-blur-xl transition-all focus-within:border-mint focus-within:ring-1 focus-within:ring-mint/40">
        <div className="flex flex-col">
          {/* Main Input Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full resize-none bg-transparent px-3 py-2 text-[14px] sm:text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-hidden disabled:opacity-50 min-h-[44px] max-h-[180px]"
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            {/* Left Actions: Attach & Think */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Attach files or ledger data"
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsThinkEnabled(!isThinkEnabled)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
                  isThinkEnabled
                    ? "bg-mint-pale dark:bg-mint/15 text-forest dark:text-mint border border-mint/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-cream dark:hover:bg-muted"
                )}
              >
                <Brain className="size-3" />
                <span>Think</span>
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
                title="Start Voice Agent OS"
                className="size-8 rounded-full flex items-center justify-center bg-mint-pale dark:bg-mint/15 hover:bg-mint/25 text-forest dark:text-mint border border-mint/30 hover:border-mint/50 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              >
                <AudioLines className="size-4" />
              </button>

              {/* Dictate / Mic */}
              <button
                type="button"
                onClick={startVoiceAgent}
                disabled={isLoading}
                aria-label="Start voice agent"
                title="Start voice agent"
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
              >
                <Mic className="size-4" />
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
                    : "bg-sage/20 dark:bg-muted text-muted-foreground cursor-not-allowed opacity-60"
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
        VyaparSetu AI can make mistakes. Verify important financial &amp; trade decisions.
      </p>
    </div>
  );
}
