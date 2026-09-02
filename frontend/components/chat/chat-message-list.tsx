"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Volume2, VolumeX, AudioLines, FileCheck, ArrowUpRight, PieChart, BarChart3, IndianRupee, Layers, Target, Landmark, AlertTriangle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThinkingAccordion } from "./thinking-accordion";
import { MarkdownMessage } from "./markdown-message";
import type { ChatMessage, ToolCallItem } from "./types";
import type { ArtifactPayload } from "./artifact-modal";
import { useTranslation } from "@/lib/i18n";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onOpenArtifact?: (artifact: ArtifactPayload) => void;
}

export function ChatMessageList({
  messages,
  isLoading = false,
  onOpenArtifact,
}: ChatMessageListProps) {
  const { t } = useTranslation();
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

        // Extract any staged artifacts from tool calls
        const artifacts: ArtifactPayload[] = [];
        (msg.toolCalls || []).forEach((tc) => {
          const res = tc.result as any;
          if (res?.isArtifact && res?.artifactType && res?.data) {
            artifacts.push({
              artifactId: res.artifactId || res.data?.artifactId,
              targetArtifactId: res.targetArtifactId,
              isUpdated: res.isUpdated,
              artifactType: res.artifactType,
              title: res.title,
              summary: res.summary,
              data: res.data,
            });
          }
        });

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
                  completedDurationSeconds={msg.thoughtDurationSeconds}
                />

                {/* Sleek Claude-Style Interactive Artifact Pill */}
                {artifacts.length > 0 && (
                  <div className="my-3 space-y-2 w-full max-w-md">
                    {artifacts.map((art, aIdx) => (
                      <div
                        key={aIdx}
                        onClick={() => onOpenArtifact?.(art)}
                        className="p-3 rounded-2xl border border-sage/40 dark:border-zinc-800 bg-white dark:bg-[#18181b]/95 hover:border-mint dark:hover:border-mint/60 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-xs hover:shadow-md select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-xl bg-mint-pale/60 dark:bg-zinc-800 border border-mint/20 dark:border-zinc-700 text-forest dark:text-mint flex items-center justify-center shrink-0">
                            {art.artifactType === "chart" && <BarChart3 className="size-4" />}
                            {art.artifactType === "budget" && <PieChart className="size-4" />}
                            {art.artifactType === "expense" && <IndianRupee className="size-4" />}
                            {art.artifactType === "transaction" && <Layers className="size-4" />}
                            {art.artifactType === "saving_goal" && <Target className="size-4" />}
                            {art.artifactType === "debt" && <Landmark className="size-4" />}
                            {art.artifactType === "form" && <ClipboardList className="size-4" />}
                            {art.artifactType === "delete_record" && <AlertTriangle className="size-4 text-rose-500" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[13.5px] font-semibold text-forest dark:text-zinc-100 group-hover:text-mint transition-colors truncate">
                                {art.title || t("chat.stagedDraft", "Interactive Action Draft")}
                              </h4>
                              {art.isUpdated && (
                                <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-mint/20 text-forest dark:text-mint border border-mint/30 shrink-0">
                                  Updated
                                </span>
                              )}
                            </div>
                            <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                              {art.summary || (art.isUpdated ? "Draft updated • Click to review changes" : t("chat.clickToReview", "Draft prepared • Click to review & edit"))}
                            </p>
                          </div>
                        </div>

                        <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-mint group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

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
