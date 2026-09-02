"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  MessageSquareText,
  Radio,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  PieChart,
  BarChart3,
  IndianRupee,
  Layers,
  Landmark,
  AlertTriangle,
  WifiOff,
  ShieldAlert,
  Target,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportedLanguageCode } from "@/lib/agent/chat-config";
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
  onDownloadDebugAudio?: () => void;
}

// ── Memoized Live Transcript Card (Light & Dark Theme Optimized) ──
const LiveTranscriptView = React.memo(function LiveTranscriptView({
  liveTranscript,
  isHoldingToSpeak,
}: {
  liveTranscript: string;
  isHoldingToSpeak: boolean;
}) {
  if (!liveTranscript) return null;
  return (
    <div className="w-full rounded-2xl border border-emerald-300/80 dark:border-emerald-800/40 bg-white/95 dark:bg-emerald-950/30 p-3.5 shrink-0 text-left shadow-md dark:shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-200/60 dark:border-emerald-800/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-300">
            You {isHoldingToSpeak ? "· speaking" : "· transcript"}
          </span>
        </div>
      </div>
      <div className="max-h-[70px] overflow-y-auto pr-1 text-xs md:text-sm font-medium text-emerald-950 dark:text-emerald-200 leading-relaxed">
        {liveTranscript}
      </div>
    </div>
  );
});

// ── Memoized Assistant Caption Card (Light & Dark Theme Optimized) ──
const AssistantCaptionView = React.memo(function AssistantCaptionView({
  assistantTranscript,
  isSpeaking,
}: {
  assistantTranscript: string;
  isSpeaking: boolean;
}) {
  if (!assistantTranscript) return null;
  return (
    <div className="w-full rounded-2xl border border-sky-200 dark:border-sky-800/40 bg-white/95 dark:bg-sky-950/40 p-3.5 text-left shadow-lg dark:shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-sky-200/60 dark:border-sky-800/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse" />
          <span className="text-[10.5px] font-bold tracking-wider uppercase text-sky-700 dark:text-sky-300">
            VyaparSetu {isSpeaking ? "· speaking" : "· response"}
          </span>
        </div>
        <span className="text-[9.5px] font-semibold text-sky-700 dark:text-sky-300/90 uppercase px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 border border-sky-200 dark:border-sky-700/40">
          Live
        </span>
      </div>

      <div className="max-h-[120px] md:max-h-[150px] overflow-y-auto pr-1 text-xs md:text-[13.5px] font-normal text-zinc-800 dark:text-zinc-100 leading-relaxed prose prose-zinc dark:prose-invert prose-p:my-0.5 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {assistantTranscript}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export const VoiceAgentView = React.memo(function VoiceAgentView({
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
  onDownloadDebugAudio,
}: VoiceAgentViewProps) {
  const [showLiveCaptions, setShowLiveCaptions] = useState(true);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // ── Classify error type from the errorMessage string ──
  const errorType = useMemo(() => {
    if (!errorMessage) return "mic" as const;
    const msg = errorMessage.toLowerCase();
    if (
      msg.includes("microphone") ||
      msg.includes("mic") ||
      msg.includes("notallowederror") ||
      msg.includes("permission") ||
      msg.includes("not allowed") ||
      msg.includes("blocked") ||
      msg.includes("notfounderror") ||
      msg.includes("no microphone") ||
      msg.includes("notreadableerror") ||
      msg.includes("busy in another")
    ) {
      return "mic" as const;
    }
    if (
      msg.includes("connection") ||
      msg.includes("vertex") ||
      msg.includes("websocket") ||
      msg.includes("ended unexpectedly") ||
      msg.includes("could not be established") ||
      msg.includes("reconnect") ||
      msg.includes("session") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("token") ||
      msg.includes("unauthorized") ||
      msg.includes("401") ||
      msg.includes("500")
    ) {
      return "connection" as const;
    }
    return "general" as const;
  }, [errorMessage]);

  const errorConfig = useMemo(() => {
    switch (errorType) {
      case "mic":
        return {
          statusPillText: "Microphone Permission Required",
          orbLabel: "Mic Blocked",
          dialogTitle: "Microphone Permission Blocked",
          dialogDescription:
            errorMessage ||
            "VyaparSetu Voice requires microphone access to start the conversation.",
          dialogIcon: MicOff,
          dialogIconColor: "text-rose-500 dark:text-rose-400",
          dialogIconBg: "bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30",
          retryLabel: "Retry Microphone",
          showMicSteps: true,
        };
      case "connection":
        return {
          statusPillText: "Connection Lost",
          orbLabel: "Disconnected",
          dialogTitle: "Voice Connection Failed",
          dialogDescription:
            errorMessage ||
            "The secure voice connection to VyaparSetu could not be established.",
          dialogIcon: WifiOff,
          dialogIconColor: "text-amber-500 dark:text-amber-400",
          dialogIconBg: "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30",
          retryLabel: "Reconnect",
          showMicSteps: false,
        };
      case "general":
      default:
        return {
          statusPillText: "Something Went Wrong",
          orbLabel: "Error",
          dialogTitle: "Something Went Wrong",
          dialogDescription:
            errorMessage ||
            "An unexpected error occurred. Please try again.",
          dialogIcon: ShieldAlert,
          dialogIconColor: "text-orange-500 dark:text-orange-400",
          dialogIconBg: "bg-orange-50 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30",
          retryLabel: "Try Again",
          showMicSteps: false,
        };
    }
  }, [errorType, errorMessage]);

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

  const isInitializing = status === "initializing" || status === "connecting";
  const isError = status === "error";

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full p-6 md:p-10 select-none overflow-hidden bg-radial from-emerald-50/40 via-[#FDFCFA] to-cream dark:from-[#181a20] dark:via-[#121316] dark:to-[#0d0e11] transition-colors duration-300 animate-in fade-in duration-300">
      {/* ── Top Header / Status Pill (mt-10 on mobile to clear navbar cleanly) ── */}
      <div className="flex items-center justify-between w-full max-w-2xl z-20 gap-2 mt-10 sm:mt-0">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800 backdrop-blur shadow-xs">
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

          <span className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200 capitalize tracking-wide">
            {isError
              ? errorConfig.statusPillText
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

        {/* Top Right Controls: Captions Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLiveCaptions(!showLiveCaptions)}
            title="Toggle live captions"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer backdrop-blur shadow-xs",
              showLiveCaptions
                ? "bg-zinc-900 dark:bg-zinc-800/90 text-white dark:text-zinc-200 border-zinc-900 dark:border-zinc-700/80"
                : "bg-white/90 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-500 border-zinc-200/90 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-300",
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
          className="w-full max-w-md my-2 p-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-emerald-500/40 hover:border-emerald-500 text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-3 shadow-xl dark:shadow-2xl backdrop-blur-xl transition-all cursor-pointer group animate-in slide-in-from-top-4 duration-300 select-none z-30"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-emerald-50 dark:bg-mint/15 border border-emerald-200 dark:border-mint/30 text-emerald-700 dark:text-mint flex items-center justify-center shrink-0">
              {activeArtifact.artifactType === "chart" && <BarChart3 className="size-4" />}
              {activeArtifact.artifactType === "budget" && <PieChart className="size-4" />}
              {activeArtifact.artifactType === "expense" && <IndianRupee className="size-4" />}
              {activeArtifact.artifactType === "transaction" && <Layers className="size-4" />}
              {activeArtifact.artifactType === "saving_goal" && <Target className="size-4" />}
              {activeArtifact.artifactType === "debt" && <Landmark className="size-4" />}
              {activeArtifact.artifactType === "form" && <ClipboardList className="size-4" />}
              {activeArtifact.artifactType === "delete_record" && <AlertTriangle className="size-4 text-rose-500" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-mint transition-colors truncate">
                {activeArtifact.title || "Interactive Action Draft"}
              </h4>
              <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {activeArtifact.summary || "Draft prepared • Tap to review & edit"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-mint px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-mint/10 border border-emerald-200 dark:border-mint/20">
              Review
            </span>
            <ArrowUpRight className="size-4 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-mint group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>
        </div>
      )}

      {/* ── Central Stage: Ambient Glowing Voice Orb ── */}
      <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-md my-auto z-10">
        {/* Glowing Background Radial Bloom (Hardware accelerated) */}
        <div
          className={cn(
            "absolute -inset-10 rounded-full blur-3xl opacity-40 dark:opacity-40 pointer-events-none will-change-transform",
            (isHoldingToSpeak || status === "listening") && "animate-pulse",
            isError
              ? "bg-rose-500/20"
              : isInitializing
                ? "bg-amber-500/20"
                : status === "speaking"
                  ? "bg-sky-500/25 dark:bg-sky-500/30 animate-pulse"
                  : isHoldingToSpeak || status === "listening"
                    ? "bg-emerald-500/20 dark:bg-emerald-500/25"
                    : status === "thinking"
                      ? "bg-purple-500/20 dark:bg-purple-500/25 animate-pulse"
                      : "bg-indigo-500/15 dark:bg-indigo-500/20",
          )}
        />

        {/* Ambient Orb Center Piece */}
        <div className="relative flex items-center justify-center size-48 md:size-56">
          {/* Outer Ripple Rings */}
          <div
            className={cn(
              "absolute inset-0 rounded-full border border-sky-400/30 dark:border-sky-500/20",
              status === "speaking" ||
                isHoldingToSpeak ||
                status === "listening"
                ? "animate-ping opacity-30 dark:opacity-25"
                : "opacity-15 dark:opacity-10",
            )}
          />
          <div
            className={cn(
              "absolute -inset-4 rounded-full border border-indigo-400/30 dark:border-indigo-500/20 will-change-transform transition-transform duration-150",
              (isHoldingToSpeak || status === "listening") && "scale-105",
            )}
          />

          {/* Main Glowing Sphere */}
          <div
            className={cn(
              "relative size-36 md:size-44 rounded-full flex items-center justify-center shadow-xl dark:shadow-2xl cursor-pointer overflow-hidden will-change-transform transition-transform duration-150 ring-1 ring-black/5 dark:ring-white/10",
              isHoldingToSpeak && "scale-105 ring-4 ring-emerald-500/40 shadow-emerald-500/30",
              status === "speaking" && "scale-105 shadow-sky-500/30",
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
          >
            {/* Fluid inner orb distortion */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xs rounded-full animate-pulse" />

            {isError ? (
              <div className="flex flex-col items-center gap-2 text-white/90">
                {errorType === "mic" ? (
                  <MicOff className="size-8 text-rose-100" />
                ) : errorType === "connection" ? (
                  <WifiOff className="size-8 text-amber-100" />
                ) : (
                  <ShieldAlert className="size-8 text-orange-100" />
                )}
                <span className="text-[11px] font-semibold tracking-wider uppercase text-rose-100">
                  {errorConfig.orbLabel}
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
                <Loader2 className="size-8 animate-spin text-purple-100" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-purple-100">
                  Thinking...
                </span>
              </div>
            ) : isHoldingToSpeak || status === "listening" ? (
              <div className="flex flex-col items-center gap-2 text-white/90">
                <Mic className="size-8 animate-pulse text-emerald-100" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-100">
                  Listening...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/90">
                <Radio className="size-8 text-indigo-100 opacity-90" />
                <span className="text-[11px] font-medium tracking-wider uppercase text-indigo-100">
                  Idle
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Active Tool Badge */}
        {activeToolName && (
          <div className="mt-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-medium shadow-xs animate-in fade-in zoom-in-95">
            <span>Executing {activeToolName}...</span>
          </div>
        )}

        {/* Real-time Mic Activity Level / Half-Duplex Indicator */}
        {(isHoldingToSpeak || status === "listening") && !isMuted && (
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800 shadow-xs animate-in fade-in-50">
            <div className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
              Listening to your voice
            </span>
            <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-100 rounded-full"
                style={{
                  width: `${Math.max(6, Math.min(100, micVolume * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {status === "speaking" && (
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 shadow-xs animate-in fade-in-50">
            <div className="size-2 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse" />
            <span className="text-[11.5px] font-medium text-sky-700 dark:text-sky-300">
              AI Speaking &bull; Mic Locked
            </span>
          </div>
        )}

        {/* ── Live Captions / Subtitle Area with Responsive Max Height ── */}
        {showLiveCaptions && (
          <div className="mt-4 md:mt-6 w-full max-w-lg flex flex-col items-center justify-start gap-2.5 text-center px-2 z-20">
            <LiveTranscriptView
              liveTranscript={liveTranscript}
              isHoldingToSpeak={isHoldingToSpeak}
            />

            <AssistantCaptionView
              assistantTranscript={assistantTranscript}
              isSpeaking={status === "speaking"}
            />

            {!liveTranscript && !assistantTranscript && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 tracking-wide font-normal py-2">
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
              "size-13 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md dark:shadow-lg shrink-0",
              isMuted
                ? "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-500/30"
                : "bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-700/60 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-white",
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
            onPointerDown={(e) => {
              if (
                status === "speaking" ||
                isMuted ||
                isInitializing ||
                isEnding ||
                isError
              )
                return;
              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              } catch { /* ignored */ }
              e.preventDefault();
              onStartSpeaking?.();
            }}
            onPointerUp={(e) => {
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              } catch { /* already released */ }
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
              "h-13 px-5 md:px-6 rounded-full flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-md dark:shadow-xl select-none touch-none cursor-pointer will-change-transform",
              isHoldingToSpeak
                ? "bg-emerald-600 hover:bg-emerald-500 text-white scale-105 shadow-emerald-600/30 dark:shadow-emerald-950/60 ring-4 ring-emerald-500/30"
                : "bg-white dark:bg-zinc-800/90 hover:bg-zinc-50 dark:hover:bg-zinc-700/90 text-zinc-800 dark:text-zinc-100 border border-zinc-200/90 dark:border-zinc-700/60",
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
              touchAction: "none",
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
              "h-13 px-5 md:px-6 rounded-full flex items-center justify-center gap-2 font-medium text-sm transition-all shadow-md dark:shadow-xl shadow-rose-600/20 dark:shadow-rose-950/50 shrink-0",
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

        <p className="hidden md:block text-[11px] text-zinc-500 dark:text-zinc-400 tracking-wide text-center select-none">
          Tip: Press &amp; hold{" "}
          <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-200/80 dark:bg-zinc-800/60 px-1 py-0.5 rounded text-[10px]">
            Spacebar
          </span>{" "}
          to speak
        </p>
        {process.env.NODE_ENV === "development" && (
          <button
            type="button"
            onClick={onDownloadDebugAudio}
            className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            title="Download the last 20 seconds of locally captured 16 kHz PCM as WAV"
          >
            Download local input WAV (development)
          </button>
        )}
      </div>

      {/* ── LOCKING BACKGROUND DIALOG POPUP (Error-Type Aware) ── */}
      {isError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div className={cn(
            "relative w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#18191c] shadow-2xl text-center animate-in zoom-in-95 duration-200 border",
            errorType === "mic" ? "border-rose-200 dark:border-rose-500/30 shadow-rose-950/30" :
            errorType === "connection" ? "border-amber-200 dark:border-amber-500/30 shadow-amber-950/30" :
            "border-orange-200 dark:border-orange-500/30 shadow-orange-950/30"
          )}>
            {/* Top Icon */}
            <div className={cn(
              "mx-auto mb-4 size-14 rounded-2xl border flex items-center justify-center",
              errorConfig.dialogIconBg, errorConfig.dialogIconColor
            )}>
              <errorConfig.dialogIcon className="size-7" />
            </div>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              {errorConfig.dialogTitle}
            </h3>

            <p className="text-xs md:text-[13px] text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
              {errorConfig.dialogDescription}
            </p>

            {/* Step-by-step Quick Guide — only for microphone errors */}
            {errorConfig.showMicSteps && (
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-left mb-6 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-[11px] font-bold text-rose-600 dark:text-rose-300 items-center justify-center mt-0.5">
                    1
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Click the{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      lock 🔒 or tune 🎛️ icon
                    </strong>{" "}
                    in your browser address bar (top left of the URL).
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-[11px] font-bold text-rose-600 dark:text-rose-300 items-center justify-center mt-0.5">
                    2
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Toggle <strong className="text-zinc-900 dark:text-white">Microphone</strong> to{" "}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      &ldquo;Allow&rdquo;
                    </span>
                    .
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 rounded-full bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-[11px] font-bold text-rose-600 dark:text-rose-300 items-center justify-center mt-0.5">
                    3
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Click{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      &ldquo;{errorConfig.retryLabel}&rdquo;
                    </strong>{" "}
                    below.
                  </p>
                </div>
              </div>
            )}

            {/* Connection error help tips */}
            {errorType === "connection" && (
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-left mb-6 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-[11px] font-bold text-amber-700 dark:text-amber-300 items-center justify-center mt-0.5">
                    1
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Check your <strong className="text-zinc-900 dark:text-white">internet connection</strong> is stable.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-[11px] font-bold text-amber-700 dark:text-amber-300 items-center justify-center mt-0.5">
                    2
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    The voice server may be temporarily busy. <strong className="text-zinc-900 dark:text-white">Wait a moment</strong> and try again.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-[11px] font-bold text-amber-700 dark:text-amber-300 items-center justify-center mt-0.5">
                    3
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Click{" "}
                    <strong className="text-zinc-900 dark:text-white">
                      &ldquo;{errorConfig.retryLabel}&rdquo;
                    </strong>{" "}
                    below to reconnect.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    "w-full py-2.5 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                    errorType === "mic"
                      ? "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-600/30 dark:shadow-rose-950/40"
                      : errorType === "connection"
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30 dark:shadow-amber-950/40"
                        : "bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 shadow-indigo-600/30 dark:shadow-indigo-950/40"
                  )}
                >
                  <RefreshCw className="size-4" />
                  <span>{errorConfig.retryLabel}</span>
                </button>
              )}

              <button
                onClick={onEndSession}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 hover:bg-zinc-200 dark:hover:bg-zinc-700/90 border border-zinc-200 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneOff className="size-4 text-zinc-500 dark:text-zinc-400" />
                <span>Return to Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
