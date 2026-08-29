"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Globe,
  Terminal,
  Sprout,
  Landmark,
  Search,
  Code2,
  FolderGit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCallItem } from "./types";

interface ThinkingAccordionProps {
  isStreaming?: boolean;
  toolCalls?: ToolCallItem[];
  completedDurationSeconds?: number;
}

export function ThinkingAccordion({
  isStreaming = false,
  toolCalls = [],
  completedDurationSeconds = 2,
}: ThinkingAccordionProps) {
  const [seconds, setSeconds] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isStreaming) return;
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const hasTools = Boolean(toolCalls && toolCalls.length > 0);

  // If streaming and NO tools have been called yet: render thinking shimmer in text-[14.5px]
  if (isStreaming && !hasTools) {
    const formattedDuration = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return (
      <div className="mb-2.5 py-0.5 select-none">
        <span className="thinking-text text-[14.5px] font-medium">
          Thinking... {seconds > 0 ? `(${formattedDuration}s)` : ""}
        </span>
      </div>
    );
  }

  // If finished and NO tools were ever used: render nothing (leaves NO box or accordion behind)
  if (!isStreaming && !hasTools) {
    return null;
  }

  // IF AT LEAST ONE TOOL WAS CALLED: Immediately render the accordion
  const durationToShow = completedDurationSeconds || Math.max(seconds, 1);
  const formattedDuration = seconds < 10 ? `0${seconds}` : `${seconds}`;

  const headerText = isStreaming
    ? `Thinking... ${seconds > 0 ? `(${formattedDuration}s)` : ""}`
    : `Thought for ${durationToShow}s`;

  return (
    <div className="mb-3 select-none">
      {/* Borderless, Boxless Header Button (text-[14.5px] matching ChatGPT screenshot) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-[14.5px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer py-0.5 group"
      >
        <span
          className={cn(
            "text-[14.5px] font-normal leading-none",
            isStreaming
              ? "thinking-text font-medium"
              : "text-zinc-400 group-hover:text-zinc-200"
          )}
        >
          {headerText}
        </span>

        {/* Chevron: Points Right when closed, Rotates Down when open */}
        <ChevronDown
          className={cn(
            "size-4 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ease-out shrink-0",
            isOpen ? "rotate-0 text-zinc-300" : "-rotate-90"
          )}
        />
      </button>

      {/* Clean Dynamic Tool Actions List in text-[14px] */}
      {isOpen && (
        <div className="mt-2 pl-0.5 space-y-2 text-[14px] text-zinc-300 animate-in fade-in-50 duration-150">
          {toolCalls.map((tc, idx) => {
            const icon = renderToolIcon(tc.icon || tc.toolName);
            const summary = tc.summary || `Executed ${tc.toolName}`;

            return (
              <div key={idx} className="flex items-center gap-2.5 py-0.5">
                <span className="shrink-0 text-zinc-400">{icon}</span>
                <span className="text-[14px] font-normal text-zinc-300 leading-relaxed">
                  {summary}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderToolIcon(iconType?: string) {
  const t = (iconType || "").toLowerCase();

  if (t === "globe" || t.includes("web") || t.includes("search")) {
    return <Globe className="size-4 text-zinc-400" />;
  }
  if (t === "github" || t.includes("git")) {
    return <FolderGit2 className="size-4 text-zinc-400" />;
  }
  if (t === "sprout" || t.includes("mandi") || t.includes("rate")) {
    return <Sprout className="size-4 text-emerald-400" />;
  }
  if (t === "landmark" || t.includes("scheme") || t.includes("loan") || t.includes("mudra")) {
    return <Landmark className="size-4 text-sky-400" />;
  }
  if (t === "code" || t.includes("clone")) {
    return <Terminal className="size-4 text-zinc-400" />;
  }

  return <Terminal className="size-4 text-zinc-400" />;
}
