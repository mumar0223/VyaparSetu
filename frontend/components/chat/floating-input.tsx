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
  placeholder = "Ask anything...",
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

  return (
    <div className="w-full transition-all duration-300 ease-out z-20">
      {/* Elevated Pill Container */}
      <div className="relative rounded-2xl md:rounded-3xl border border-zinc-800 bg-[#1e1e1e]/90 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700/50">
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
            className="w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden disabled:opacity-50 min-h-[44px] max-h-[180px]"
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-1 px-1">
            {/* Left Actions: Attach & Think */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                title="Attach files or ledger data"
                className="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Plus className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsThinkEnabled(!isThinkEnabled)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
                  isThinkEnabled
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
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
                onClick={onStartVoiceMode}
                title="Start Gemini Live Voice Agent"
                className="size-8 rounded-full flex items-center justify-center bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:border-sky-500/40 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
              >
                <AudioLines className="size-4" />
              </button>

              {/* Dictate / Mic */}
              <button
                type="button"
                title="Voice dictation"
                className="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
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
                    ? "bg-white text-black hover:bg-zinc-200 shadow-md scale-100"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-60"
                )}
              >
                <ArrowUp className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Footer Disclaimer */}
      <p className="mt-2 text-center text-[11px] text-zinc-500 select-none">
        VyaparSetu AI can make mistakes. Verify important financial & trade decisions.
      </p>
    </div>
  );
}
