"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  MessageSquareText,
  Radio,
  Loader2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "./types";


export type VoiceAgentStatus =
  | "initializing"
  | "connecting"
  | "ready"
  | "listening"
  | "speaking"
  | "thinking"
  | "disconnected"
  | "error";

interface VoiceAgentViewProps {
  status?: VoiceAgentStatus;
  isMuted?: boolean;
  micVolume?: number;
  isEnding?: boolean;
  errorMessage?: string | null;
  onToggleMute?: () => void;
  onEndSession: () => void;
  onRetry?: () => void;
  liveTranscript?: string;
  assistantTranscript?: string;
  activeToolName?: string | null;
  recentMessages?: ChatMessage[];
}

export function VoiceAgentView({
  status = "initializing",
  isMuted = false,
  micVolume = 0,
  isEnding = false,
  errorMessage = null,
  onToggleMute,
  onEndSession,
  onRetry,
  liveTranscript = "",
  assistantTranscript = "",
  activeToolName = null,
  recentMessages = [],
}: VoiceAgentViewProps) {

  const [showLiveCaptions, setShowLiveCaptions] = useState(true);
  const [pulseLevel, setPulseLevel] = useState(1);

  // Simulated ambient visual pulse when speaking/listening
  useEffect(() => {
    if (status === "speaking" || status === "listening") {
      const interval = setInterval(() => {
        setPulseLevel(0.8 + Math.random() * 0.5);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setPulseLevel(1);
    }
  }, [status]);

  const isInitializing = status === "initializing" || status === "connecting";
  const isError = status === "error";

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full p-6 md:p-10 select-none overflow-hidden bg-radial from-[#181a20] via-[#121316] to-[#0d0e11] animate-in fade-in duration-300">
      {/* ── Top Header / Status Pill ── */}
      <div className="flex items-center justify-between w-full max-w-2xl z-20">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur shadow-sm">
          <span className="relative flex size-2.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                isError
                  ? "bg-rose-400"
                  : isInitializing
                  ? "bg-amber-400"
                  : status === "speaking"
                  ? "bg-sky-400"
                  : status === "listening"
                  ? "bg-emerald-400"
                  : "bg-indigo-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full size-2.5",
                isError
                  ? "bg-rose-500"
                  : isInitializing
                  ? "bg-amber-500"
                  : status === "speaking"
                  ? "bg-sky-500"
                  : status === "listening"
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              )}
            />
          </span>

          <span className="text-[12.5px] font-medium text-zinc-200 capitalize tracking-wide">
            {isError
              ? "Microphone Permission Required"
              : isInitializing
              ? "Setting up Voice OS..."
              : status === "speaking"
              ? "VyaparSetu is speaking"
              : status === "listening"
              ? isMuted
                ? "Microphone Muted"
                : "Listening to you..."
              : status === "thinking"
              ? "Analyzing..."
              : "Voice Connected"}
          </span>
        </div>

        {/* Captions Toggle */}
        <button
          onClick={() => setShowLiveCaptions(!showLiveCaptions)}
          title="Toggle live captions"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer backdrop-blur",
            showLiveCaptions
              ? "bg-zinc-800/80 text-zinc-200 border-zinc-700/80"
              : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-zinc-300"
          )}
        >
          <MessageSquareText className="size-3.5" />
          <span>Captions</span>
        </button>
      </div>

      {/* ── Central Stage: Ambient Glowing Voice Orb ── */}
      <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-md my-auto z-10">
        {/* Glowing Background Radial Bloom */}
        <div
          className={cn(
            "absolute -inset-10 rounded-full blur-3xl opacity-40 transition-all duration-700 pointer-events-none",
            isError
              ? "bg-rose-500/20"
              : isInitializing
              ? "bg-amber-500/20"
              : status === "speaking"
              ? "bg-sky-500/30"
              : status === "listening"
              ? "bg-emerald-500/25"
              : "bg-indigo-500/20"
          )}
          style={{ transform: `scale(${pulseLevel * 1.1})` }}
        />

        {/* Ambient Orb Center Piece */}
        <div className="relative flex items-center justify-center size-48 md:size-56">
          {/* Outer Ripple Rings */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border border-sky-500/20 transition-all duration-500",
              status === "speaking" || status === "listening"
                ? "animate-ping opacity-25"
                : "opacity-10"
            )}
          />
          <div
            className="absolute -inset-4 rounded-full border border-indigo-500/20 transition-all duration-300"
            style={{ transform: `scale(${pulseLevel})` }}
          />

          {/* Main Glowing Sphere */}
          <div
            className={cn(
              "relative size-36 md:size-44 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden",
              isError
                ? "bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-600 shadow-rose-500/30"
                : isInitializing
                ? "bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400"
                : status === "speaking"
                ? "bg-gradient-to-tr from-sky-600 via-indigo-500 to-cyan-400 shadow-sky-500/30"
                : status === "listening"
                ? "bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-emerald-500/30"
                : "bg-gradient-to-tr from-indigo-700 via-purple-600 to-sky-500"
            )}
            style={{
              transform: `scale(${pulseLevel})`,
              boxShadow: isError
                ? "0 0 50px rgba(244, 63, 94, 0.4)"
                : isInitializing
                ? "0 0 50px rgba(245, 158, 11, 0.4)"
                : status === "speaking"
                ? "0 0 60px rgba(14, 165, 233, 0.5)"
                : "0 0 50px rgba(16, 185, 129, 0.4)",
            }}
          >
            {/* Fluid inner orb distortion */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xs rounded-full animate-pulse" />

            {isError ? (
              <div className="flex flex-col items-center gap-2 text-white/90">
                <MicOff className="size-8 text-rose-200" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-rose-100">
                  Mic Blocked
                </span>
              </div>
            ) : isInitializing ? (
              <div className="flex flex-col items-center gap-2 text-white/90">
                <Loader2 className="size-8 animate-spin" />
                <span className="text-xs font-semibold tracking-wider uppercase">
                  Setting up...
                </span>
              </div>
            ) : status === "speaking" ? (
              <div className="flex items-center gap-1.5 text-white/90">
                <span className="h-6 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-10 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-14 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="h-8 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "450ms" }} />
                <span className="h-5 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "200ms" }} />
              </div>
            ) : (
              <div className="flex items-center justify-center text-white/90">
                <Radio className="size-10 animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Active Tool Badge */}
        {activeToolName && (
          <div className="mt-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-300 text-xs font-medium animate-in fade-in zoom-in-95">
            <Sparkles className="size-3.5 text-sky-400 animate-spin" />
            <span>Executing {activeToolName}...</span>
          </div>
        )}

        {/* Real-time Mic Activity Level / Half-Duplex Indicator */}
        {status === "listening" && !isMuted && (
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-sm animate-in fade-in-50">
            <div className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-medium text-zinc-300">Mic Active</span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                style={{ width: `${Math.max(6, Math.min(100, micVolume * 100))}%` }}
              />
            </div>
          </div>
        )}

        {status === "speaking" && (
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-950/60 border border-sky-800/40 shadow-sm animate-in fade-in-50">
            <div className="size-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[11.5px] font-medium text-sky-300">AI Speaking &bull; Mic Paused</span>
          </div>
        )}

        {/* ── Live Captions / Subtitle Area ── */}
        {showLiveCaptions && (
          <div className="mt-8 w-full min-h-[80px] flex flex-col items-center justify-center text-center px-4">
            {status === "listening" && liveTranscript ? (
              <div className="flex flex-col items-center gap-1.5 transition-all animate-in fade-in-50 max-w-lg">
                <span className="text-[10.5px] font-semibold tracking-wider uppercase text-emerald-400/90 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  Listening to you
                </span>
                <p className="text-[15px] md:text-base font-medium text-emerald-300 leading-relaxed">
                  &ldquo;{liveTranscript}&rdquo;
                </p>
              </div>
            ) : status === "speaking" && assistantTranscript ? (
              <div className="flex flex-col items-center gap-1.5 transition-all animate-in fade-in-50 max-w-lg">
                <span className="text-[10.5px] font-semibold tracking-wider uppercase text-sky-400/90 bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-800/40">
                  VyaparSetu Speaking
                </span>
                <div className="text-[15px] md:text-base font-normal text-zinc-100 leading-relaxed prose prose-invert prose-p:my-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {assistantTranscript}
                  </ReactMarkdown>
                </div>
              </div>
            ) : assistantTranscript ? (
              <div className="text-[15px] md:text-base font-normal text-zinc-200 leading-relaxed max-w-lg transition-all animate-in fade-in-50 prose prose-invert prose-p:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {assistantTranscript}
                </ReactMarkdown>
              </div>
            ) : liveTranscript ? (
              <p className="text-[14.5px] font-medium text-emerald-400/90 leading-relaxed max-w-lg transition-all animate-in fade-in-50">
                You: &ldquo;{liveTranscript}&rdquo;
              </p>
            ) : (
              <p className="text-xs md:text-[13px] text-zinc-400 tracking-wide font-normal">
                {isInitializing
                  ? "Connecting to Voice OS..."
                  : isMuted
                  ? "Microphone is paused. Tap mic below to resume."
                  : status === "speaking"
                  ? "VyaparSetu is speaking..."
                  : "Speak naturally in Hindi, Hinglish, or English..."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Control Deck ── */}
      <div className="flex items-center justify-center gap-4 w-full max-w-md pb-4 z-20">
        {/* Mute / Unmute Button */}
        <button
          onClick={onToggleMute}
          disabled={isInitializing || isEnding || isError}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={cn(
            "size-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg",
            isMuted
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
              : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 hover:bg-zinc-700/80 hover:text-white",
            isError && "opacity-50 cursor-not-allowed"
          )}
        >
          {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>

        {/* End Call / Return to Chat Button */}
        <button
          onClick={onEndSession}
          disabled={isEnding}
          title="End voice session & return to chat"
          className={cn(
            "h-13 px-6 rounded-full flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-xl shadow-rose-950/50",
            isEnding
              ? "bg-rose-900/80 text-white/80 cursor-wait opacity-80"
              : "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer hover:scale-105 active:scale-95"
          )}
        >
          {isEnding ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Ending session...</span>
            </>
          ) : (
            <>
              <PhoneOff className="size-4" />
              <span>End Session</span>
            </>
          )}
        </button>
      </div>

      {/* ── LOCKING BACKGROUND DIALOG POPUP (Microphone Permission Blocked) ── */}
      {isError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#18191c] border border-rose-500/30 shadow-2xl shadow-rose-950/50 text-center animate-in zoom-in-95 duration-200">
            {/* Top Amber/Rose Bloom */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-12 bg-rose-500/20 blur-2xl rounded-full pointer-events-none" />

            {/* Glowing Icon Header */}
            <div className="mx-auto size-16 rounded-2xl bg-gradient-to-tr from-rose-600/30 to-amber-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
              <MicOff className="size-8 text-rose-400 animate-pulse" />
            </div>

            <h3 className="text-lg md:text-xl font-semibold text-zinc-100 mb-1.5 tracking-tight">
              Microphone Access Blocked
            </h3>

            <p className="text-xs md:text-[13px] text-zinc-400 mb-5 leading-relaxed">
              VyaparSetu Voice OS requires microphone access to listen to your voice and converse in real-time.
            </p>

            {/* Step-by-step Quick Guide */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left mb-6 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300 items-center justify-center mt-0.5">
                  1
                </span>
                <p className="text-xs text-zinc-300">
                  Click the <strong className="text-white">lock 🔒 or tune 🎛️ icon</strong> in your browser address bar (top left of the URL).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300 items-center justify-center mt-0.5">
                  2
                </span>
                <p className="text-xs text-zinc-300">
                  Toggle <strong className="text-white">Microphone</strong> to <span className="text-emerald-400 font-semibold">&ldquo;Allow&rdquo;</span>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300 items-center justify-center mt-0.5">
                  3
                </span>
                <p className="text-xs text-zinc-300">
                  Click <strong className="text-white">&ldquo;Retry Microphone&rdquo;</strong> below.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-sm transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <RefreshCw className="size-4" />
                  <span>Retry Microphone</span>
                </button>
              )}

              <button
                onClick={onEndSession}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/60 text-zinc-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneOff className="size-4 text-zinc-400" />
                <span>Return to Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
