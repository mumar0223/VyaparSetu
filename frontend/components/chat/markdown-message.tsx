"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  variant?: "user" | "assistant";
}

export function MarkdownMessage({
  content,
  variant = "assistant",
}: MarkdownMessageProps) {
  if (variant === "user") {
    return <p className="whitespace-pre-wrap select-text">{content}</p>;
  }

  return (
    <div className="prose prose-invert max-w-none text-[15px] leading-relaxed text-zinc-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code Block Component with Copy Action
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const rawCode = String(children).replace(/\n$/, "");

            if (!inline && language) {
              return (
                <div className="relative my-3 rounded-xl border border-zinc-800 bg-[#1e1e1e] overflow-hidden not-prose">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
                    <span>{language}</span>
                    <CodeCopyButton code={rawCode} />
                  </div>
                  <pre className="p-4 overflow-x-auto text-[13.5px] font-mono text-zinc-200 leading-relaxed">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }

            if (!inline) {
              return (
                <pre className="my-3 p-3.5 rounded-xl border border-zinc-800 bg-[#1e1e1e] overflow-x-auto text-[13.5px] font-mono text-zinc-200 not-prose">
                  <code>{children}</code>
                </pre>
              );
            }

            return (
              <code
                className="bg-zinc-800/80 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-700/40"
                {...props}
              >
                {children}
              </code>
            );
          },

          // GFM Tables
          table({ children }) {
            return (
              <div className="my-4 w-full overflow-x-auto not-prose">
                <table className="w-full text-left text-sm border-collapse rounded-xl border border-zinc-800 bg-zinc-950/40">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-900/90 border-b border-zinc-800 font-semibold text-zinc-200">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-zinc-800/60">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-zinc-900/40 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3.5 py-2.5 text-xs font-semibold text-zinc-300">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3.5 py-2.5 text-xs text-zinc-300">{children}</td>;
          },

          // Headings
          h1({ children }) {
            return <h1 className="text-2xl font-bold text-zinc-100 mt-5 mb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold text-zinc-100 mt-4 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold text-zinc-100 mt-3 mb-1.5">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-base font-semibold text-zinc-200 mt-2.5 mb-1">{children}</h4>;
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5 text-zinc-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2.5 text-zinc-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Paragraphs & Blockquotes
          p({ children }) {
            return <p className="leading-relaxed my-2 text-zinc-200">{children}</p>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-primary/60 pl-3.5 italic text-zinc-400 my-3">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Code copy failed:", e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
