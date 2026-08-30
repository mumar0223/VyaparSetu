"use client";

import { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  MessageSquareText,
  Radio,
  Loader2,
  RefreshCw,
  Languages,
  ChevronDown,
  ArrowUpRight,
  PieChart,
  BarChart3,
  IndianRupee,
  Layers,
  Landmark,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_INDIAN_LANGUAGES,
  type SupportedLanguageCode,
} from "@/lib/agent/chat-config";
import type { ArtifactPayload } from "./artifact-modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  isUserSpeaking?: boolean;
  isHoldingToSpeak?: boolean;
  isEnding?: boolean;
  errorMessage?: string | null;
  selectedLanguage?: SupportedLanguageCode;
  onSelectLanguage?: (lang: SupportedLanguageCode) => void;
  onToggleMute?: () => void;
  onStartSpeaking?: () => void;
  onStopSpeaking?: () => void;
  onEndSession: () => void;
  onRetry?: () => void;
  liveTranscript?: string;
  assistantTranscript?: string;
  activeToolName?: string | null;
  activeArtifact?: ArtifactPayload | null;
  onOpenArtifact?: (artifact: ArtifactPayload) => void;
}

export function VoiceAgentView({
  status = "initializing",
  isMuted = false,
  micVolume = 0,
  isUserSpeaking = false,
  isHoldingToSpeak = false,
  isEnding = false,
  errorMessage = null,
  selectedLanguage = "hi-IN",
  onSelectLanguage,
  onToggleMute,
  onStartSpeaking,
  onStopSpeaking,
  onEndSession,
  onRetry,
  liveTranscript = "",
  assistantTranscript = "",
  activeToolName = null,
  activeArtifact = null,
  onOpenArtifact,
}: VoiceAgentViewProps) {
  const [showLiveCaptions, setShowLiveCaptions] = useState(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Keyboard shortcut: Spacebar hold-to-speak on PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (
          activeTag === "input" ||
          activeTag === "textarea" ||
          activeTag === "select"
        )
          return;
        if (
          status === "error" ||
          isEnding ||
          status === "initializing" ||
          status === "connecting" ||
          isMuted ||
          status === "speaking"
        )
          return;
        e.preventDefault();
        onStartSpeaking?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (
          activeTag === "input" ||
          activeTag === "textarea" ||
          activeTag === "select"
        )
          return;
        e.preventDefault();
        onStopSpeaking?.();
      }
    };

    const handleBlur = () => {
      if (isHoldingToSpeak) {
        onStopSpeaking?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [
    isHoldingToSpeak,
    status,
    isEnding,
    isMuted,
    onStartSpeaking,
    onStopSpeaking,
  ]);

  const pulseLevel =
    (isHoldingToSpeak || status === "listening") && !isMuted
      ? 1 + Math.min(0.32, micVolume * 0.32)
      : status === "speaking"
        ? 1.12
        : 1;

  const isInitializing = status === "initializing" || status === "connecting";
  const isError = status === "error";
  const currentLangObj =
    SUPPORTED_INDIAN_LANGUAGES.find((l) => l.code === selectedLanguage) ||
    SUPPORTED_INDIAN_LANGUAGES[0];

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full p-6 md:p-10 select-none overflow-hidden bg-radial from-[#181a20] via-[#121316] to-[#0d0e11] animate-in fade-in duration-300">
      {/* ── Top Header / Status Pill ── */}
      <div className="flex items-center justify-between w-full max-w-2xl z-20 gap-2">
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
                      : isHoldingToSpeak || status === "listening"
                        ? "bg-emerald-400"
                        : status === "thinking"
                          ? "bg-purple-400"
                          : "bg-indigo-400 opacity-40",
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
                      : isHoldingToSpeak || status === "listening"
                        ? "bg-emerald-500"
                        : status === "thinking"
                          ? "bg-purple-500"
                          : "bg-indigo-500",
              )}
            />
          </span>

          <span className="text-[12.5px] font-medium text-zinc-200 capitalize tracking-wide">
            {isError
              ? "Microphone Permission Required"
              : isInitializing
                ? "Setting up Voice OS..."
                : isMuted
                  ? "Microphone Muted"
                  : status === "speaking"
                    ? "VyaparSetu is speaking"
                    : isHoldingToSpeak || status === "listening"
                      ? "Listening (Holding)..."
                      : status === "thinking"
                        ? "Analyzing..."
                        : "Idle • Hold to Speak"}
          </span>
        </div>

        {/* Top Right Controls: Language Selector & Captions Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              title="Change voice language"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-zinc-900/80 text-zinc-200 border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer backdrop-blur shadow-xs"
            >
              <Languages className="size-3.5 text-indigo-400" />
              <span>{currentLangObj.nativeName}</span>
              <ChevronDown
                className={cn(
                  "size-3 text-zinc-400 transition-transform",
                  isLangMenuOpen && "rotate-180",
                )}
              />
            </button>

            {isLangMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsLangMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[#16171b] border border-zinc-800 shadow-2xl p-1.5 z-40 animate-in fade-in-0 zoom-in-95 max-h-64 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[10.5px] font-semibold tracking-wider uppercase text-zinc-400">
                    Select Language
                  </div>
                  {SUPPORTED_INDIAN_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLanguage?.(lang.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer",
                        selectedLanguage === lang.code
                          ? "bg-indigo-600/25 text-indigo-300 font-semibold"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                      )}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[10.5px] text-zinc-400">
                        {lang.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Captions Toggle */}
          <button
            onClick={() => setShowLiveCaptions(!showLiveCaptions)}
            title="Toggle live captions"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer backdrop-blur",
              showLiveCaptions
                ? "bg-zinc-800/80 text-zinc-200 border-zinc-700/80"
                : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-zinc-300",
            )}
          >
            <MessageSquareText className="size-3.5" />
            <span className="hidden sm:inline">Captions</span>
          </button>
        </div>
      </div>

      {/* ── Interactive Staged Artifact Pill (Claude Style) ── */}
      {activeArtifact && (
        <div
          onClick={() => onOpenArtifact?.(activeArtifact)}
          className="w-full max-w-md my-2 p-3 rounded-2xl bg-zinc-900/95 hover:bg-zinc-800 border border-mint/40 hover:border-mint text-zinc-100 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl transition-all cursor-pointer group animate-in slide-in-from-top-4 duration-300 select-none z-30"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-mint/15 border border-mint/30 text-mint flex items-center justify-center shrink-0">
              {activeArtifact.artifactType === "chart" && <BarChart3 className="size-4" />}
              {activeArtifact.artifactType === "budget" && <PieChart className="size-4" />}
              {activeArtifact.artifactType === "expense" && <IndianRupee className="size-4" />}
              {activeArtifact.artifactType === "transaction" && <Layers className="size-4" />}
              {activeArtifact.artifactType === "saving_goal" && <Sparkles className="size-4" />}
              {activeArtifact.artifactType === "debt" && <Landmark className="size-4" />}
              {activeArtifact.artifactType === "delete_record" && <AlertTriangle className="size-4 text-rose-500" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-[13.5px] font-semibold text-zinc-100 group-hover:text-mint transition-colors truncate">
                {activeArtifact.title || "Interactive Action Draft"}
              </h4>
              <p className="text-[11.5px] text-zinc-400 truncate mt-0.5">
                {activeArtifact.summary || "Draft prepared • Tap to review & edit"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-mint px-2 py-0.5 rounded-md bg-mint/10 border border-mint/20">
              Review
            </span>
            <ArrowUpRight className="size-4 text-zinc-400 group-hover:text-mint group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </div>
      )}

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
                  : isHoldingToSpeak || status === "listening"
                    ? "bg-emerald-500/25"
                    : status === "thinking"
                      ? "bg-purple-500/25"
                      : "bg-indigo-500/20",
          )}
          style={{ transform: `scale(${pulseLevel * 1.1})` }}
        />

        {/* Ambient Orb Center Piece */}
        <div className="relative flex items-center justify-center size-48 md:size-56">
          {/* Outer Ripple Rings */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border border-sky-500/20 transition-all duration-500",
              status === "speaking" ||
                isHoldingToSpeak ||
                status === "listening"
                ? "animate-ping opacity-25"
                : "opacity-10",
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
                    : isHoldingToSpeak || status === "listening"
                      ? "bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-emerald-500/30"
                      : status === "thinking"
                        ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-sky-400 shadow-purple-500/30"
                        : "bg-gradient-to-tr from-indigo-700 via-purple-600 to-sky-500 shadow-indigo-500/30",
            )}
            style={{
              transform: `scale(${pulseLevel})`,
              boxShadow: isError
                ? "0 0 50px rgba(244, 63, 94, 0.4)"
                : isInitializing
                  ? "0 0 50px rgba(245, 158, 11, 0.4)"
                  : status === "speaking"
                    ? "0 0 60px rgba(14, 165, 233, 0.5)"
                    : isHoldingToSpeak || status === "listening"
                      ? "0 0 50px rgba(16, 185, 129, 0.4)"
                      : "0 0 50px rgba(99, 102, 241, 0.3)",
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
                <span
                  className="h-6 w-1 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-10 w-1 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-14 w-1 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
                <span
                  className="h-8 w-1 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: "450ms" }}
                />
                <span
                  className="h-5 w-1 rounded-full bg-white animate-bounce"
                  style={{ animationDelay: "200ms" }}
                />
              </div>
            ) : status === "thinking" ? (
              <div className="flex flex-col items-center gap-2 text-white/90">
                <Loader2 className="size-8 animate-spin text-purple-200" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-100">
                  Thinking...
                </span>
              </div>
            ) : isHoldingToSpeak || status === "listening" ? (
              <div className="flex flex-col items-center gap-2 text-white/90">
                <Mic className="size-8 animate-pulse text-emerald-200" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-100">
                  Listening...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/90">
                <Radio className="size-8 text-indigo-200 opacity-80" />
                <span className="text-[11px] font-medium tracking-wider uppercase text-indigo-200/80">
                  Idle
                </span>
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
        {(isHoldingToSpeak || status === "listening") && !isMuted && (
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-sm animate-in fade-in-50">
            <div className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-medium text-zinc-300">
              Listening to your voice
            </span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                style={{
                  width: `${Math.max(6, Math.min(100, micVolume * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {status === "speaking" && (
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-950/60 border border-sky-800/40 shadow-sm animate-in fade-in-50">
            <div className="size-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[11.5px] font-medium text-sky-300">
              AI Speaking &bull; Mic Locked
            </span>
          </div>
        )}

        {/* ── Live Captions / Subtitle Area with Responsive Max Height ── */}
        {showLiveCaptions && (
          <div className="mt-4 md:mt-6 w-full max-w-lg flex flex-col items-center justify-start gap-2.5 text-center px-2 z-20">
            {liveTranscript && (
              <div className="w-full rounded-2xl border border-emerald-800/40 bg-emerald-950/30 p-3 transition-all shrink-0 text-left shadow-lg">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-800/30 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300">
                      You {isHoldingToSpeak ? "· speaking" : "· transcript"}
                    </span>
                  </div>
                </div>
                <div className="max-h-[70px] overflow-y-auto pr-1 text-xs md:text-sm font-medium text-emerald-200 leading-relaxed">
                  {liveTranscript}
                </div>
              </div>
            )}

            {assistantTranscript && (
              <div className="w-full rounded-2xl border border-sky-800/40 bg-sky-950/40 p-3 transition-all text-left shadow-xl backdrop-blur-md">
                {/* Fixed Top Header (Non-scrolling) */}
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-sky-800/40 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="text-[10.5px] font-bold tracking-wider uppercase text-sky-300">
                      VyaparSetu {status === "speaking" ? "· speaking" : "· response"}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-semibold text-sky-300/80 uppercase px-2 py-0.5 rounded-full bg-sky-900/50 border border-sky-700/40">
                    Live
                  </span>
                </div>

                {/* Clean Scrollable Content Area */}
                <div className="max-h-[120px] md:max-h-[150px] overflow-y-auto pr-1 text-xs md:text-[13.5px] font-normal text-zinc-100 leading-relaxed prose prose-invert prose-p:my-0.5 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {assistantTranscript}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {!liveTranscript && !assistantTranscript && (
              <p className="text-xs text-zinc-400 tracking-wide font-normal py-2">
                {isInitializing
                  ? "Connecting to Voice OS..."
                  : isMuted
                    ? "Microphone is paused. Tap mic below to resume."
                    : status === "speaking"
                      ? "VyaparSetu is speaking..."
                      : status === "thinking"
                        ? "Analyzing your request..."
                        : isHoldingToSpeak || status === "listening"
                          ? "Listening to you speak..."
                          : "Hold the button or Spacebar to speak in your language..."}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Control Deck ── */}
      <div className="flex flex-col items-center justify-center gap-2 w-full max-w-md pb-4 z-20">
        <div className="flex items-center justify-center gap-3 md:gap-4 w-full">
          {/* Mute / Unmute Button */}
          <button
            onClick={onToggleMute}
            disabled={isInitializing || isEnding || isError}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
            className={cn(
              "size-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg shrink-0",
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 hover:bg-zinc-700/80 hover:text-white",
              isError && "opacity-50 cursor-not-allowed",
            )}
          >
            {isMuted ? (
              <MicOff className="size-5" />
            ) : (
              <Mic className="size-5" />
            )}
          </button>

          {/* Hold to Speak Button */}
          <button
            onPointerDown={() => {
              if (
                status === "speaking" ||
                isMuted ||
                isInitializing ||
                isEnding ||
                isError
              )
                return;
              onStartSpeaking?.();
            }}
            onPointerUp={onStopSpeaking}
            onPointerLeave={onStopSpeaking}
            onTouchStart={(e) => {
              e.preventDefault();
              if (
                status === "speaking" ||
                isMuted ||
                isInitializing ||
                isEnding ||
                isError
              )
                return;
              onStartSpeaking?.();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onStopSpeaking?.();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              onStopSpeaking?.();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              return false;
            }}
            draggable={false}
            disabled={
              isInitializing ||
              isEnding ||
              isError ||
              isMuted ||
              status === "speaking"
            }
            title={
              status === "speaking"
                ? "AI is speaking..."
                : "Hold to speak (or press Spacebar)"
            }
            className={cn(
              "h-13 px-5 md:px-6 rounded-full flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-xl select-none touch-none cursor-pointer",
              isHoldingToSpeak
                ? "bg-emerald-600 hover:bg-emerald-500 text-white scale-105 shadow-emerald-950/60 ring-4 ring-emerald-500/30"
                : "bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 border border-zinc-700/60",
              (isInitializing ||
                isEnding ||
                isError ||
                isMuted ||
                status === "speaking") &&
                "opacity-50 cursor-not-allowed",
            )}
            style={{
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            <Mic
              className={cn(
                "size-4 pointer-events-none select-none",
                isHoldingToSpeak && "animate-pulse text-white",
              )}
            />
            <span className="pointer-events-none select-none">
              {status === "speaking"
                ? "AI Speaking..."
                : isHoldingToSpeak
                  ? "Release to Send"
                  : "Hold to Speak"}
            </span>
          </button>

          {/* End Call / Return to Chat Button */}
          <button
            onClick={onEndSession}
            disabled={isEnding}
            title="End voice session & return to chat"
            className={cn(
              "h-13 px-5 md:px-6 rounded-full flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-xl shadow-rose-950/50 shrink-0",
              isEnding
                ? "bg-rose-900/80 text-white/80 cursor-wait opacity-80"
                : "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer hover:scale-105 active:scale-95",
            )}
          >
            {isEnding ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Ending...</span>
              </>
            ) : (
              <>
                <PhoneOff className="size-4" />
                <span>End Session</span>
              </>
            )}
          </button>
        </div>

        <p className="hidden md:block text-[11px] text-zinc-500 tracking-wide text-center select-none">
          Tip: Press &amp; hold{" "}
          <span className="font-mono text-zinc-400 bg-zinc-800/60 px-1 py-0.5 rounded text-[10px]">
            Spacebar
          </span>{" "}
          to speak
        </p>
      </div>

      {/* ── LOCKING BACKGROUND DIALOG POPUP (Microphone Permission Blocked) ── */}
      {isError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#18191c] border border-rose-500/30 shadow-2xl shadow-rose-950/50 text-center animate-in zoom-in-95 duration-200">
            {/* Top Amber/Rose Bloom */}
            <div className="mx-auto mb-4 size-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <MicOff className="size-7" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              Microphone Permission Blocked
            </h3>

            <p className="text-xs md:text-[13px] text-zinc-400 mb-5 leading-relaxed">
              {errorMessage ||
                "VyaparSetu Voice requires microphone access and a secure Vertex connection to start the conversation."}
            </p>

            {/* Step-by-step Quick Guide */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left mb-6 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300 items-center justify-center mt-0.5">
                  1
                </span>
                <p className="text-xs text-zinc-300">
                  Click the{" "}
                  <strong className="text-white">
                    lock 🔒 or tune 🎛️ icon
                  </strong>{" "}
                  in your browser address bar (top left of the URL).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300 items-center justify-center mt-0.5">
                  2
                </span>
                <p className="text-xs text-zinc-300">
                  Toggle <strong className="text-white">Microphone</strong> to{" "}
                  <span className="text-emerald-400 font-semibold">
                    &ldquo;Allow&rdquo;
                  </span>
                  .
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-bold text-rose-300 items-center justify-center mt-0.5">
                  3
                </span>
                <p className="text-xs text-zinc-300">
                  Click{" "}
                  <strong className="text-white">
                    &ldquo;Retry Microphone&rdquo;
                  </strong>{" "}
                  below.
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
