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
    <div className="prose max-w-none text-[14.5px] sm:text-[15px] leading-relaxed text-foreground dark:prose-invert font-sans">
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
                <div className="relative my-3 rounded-xl border border-sage/30 dark:border-border bg-white dark:bg-zinc-900 overflow-hidden not-prose shadow-2xs">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-cream dark:bg-zinc-950 border-b border-sage/20 dark:border-border text-xs text-muted-foreground font-mono">
                    <span>{language}</span>
                    <CodeCopyButton code={rawCode} />
                  </div>
                  <pre className="p-4 overflow-x-auto text-[13.5px] font-mono text-foreground leading-relaxed">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }

            if (!inline) {
              return (
                <pre className="my-3 p-3.5 rounded-xl border border-sage/30 dark:border-border bg-white dark:bg-zinc-900 overflow-x-auto text-[13.5px] font-mono text-foreground not-prose">
                  <code>{children}</code>
                </pre>
              );
            }

            return (
              <code
                className="bg-mint-pale dark:bg-mint/10 text-forest dark:text-mint px-1.5 py-0.5 rounded text-xs font-mono border border-mint/20"
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
                <table className="w-full text-left text-sm border-collapse rounded-xl border border-sage/30 dark:border-border bg-white dark:bg-card shadow-2xs">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-cream dark:bg-muted border-b border-sage/30 dark:border-border font-semibold text-foreground">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return (
              <tbody className="divide-y divide-sage/20 dark:divide-border">
                {children}
              </tbody>
            );
          },
          tr({ children }) {
            return (
              <tr className="hover:bg-cream/50 dark:hover:bg-muted/50 transition-colors">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-3.5 py-2.5 text-xs font-serif font-bold text-forest dark:text-foreground">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3.5 py-2.5 text-xs text-foreground/90 leading-normal">
                {children}
              </td>
            );
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-2xl font-serif font-bold text-forest dark:text-foreground mt-5 mb-2">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-xl font-serif font-bold text-forest dark:text-foreground mt-4 mb-2">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-lg font-serif font-bold text-forest dark:text-foreground mt-3 mb-1.5">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-base font-serif font-bold text-forest dark:text-foreground mt-2.5 mb-1">
                {children}
              </h4>
            );
          },

          // Lists
          ul({ children }) {
            return (
              <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5 text-foreground/90">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2.5 text-foreground/90">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Paragraphs & Blockquotes
          p({ children }) {
            return <p className="leading-relaxed my-2 text-foreground">{children}</p>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-mint pl-3.5 italic text-muted-foreground my-3">
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
                className="text-forest dark:text-mint font-semibold underline underline-offset-2 hover:opacity-80 transition-colors"
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
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="size-3 text-mint" />
          <span className="text-mint font-semibold">Copied</span>
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
