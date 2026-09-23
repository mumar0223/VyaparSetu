"use client";

import React, { useState, useEffect, useId } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Check, Copy, Workflow, Code as CodeIcon, Loader2 } from "lucide-react";
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
          // Fenced Code Block Handler (pre element wraps fenced blocks in react-markdown v10)
          pre({ children, ...props }: any) {
            // Extract the child code element's props if available
            const child = React.isValidElement(children) ? children : null;
            const childProps = (child ? child.props : null) as any;
            const className = childProps?.className || "";
            const match = /language-(\w+)/.exec(className);
            const language = match ? match[1].toLowerCase() : "";
            const rawCode = childProps?.children
              ? String(childProps.children).replace(/\n$/, "")
              : typeof children === "string"
              ? children.replace(/\n$/, "")
              : "";

            // Intelligent classifier: determines if it's Mermaid, Process Flow, Code, or Plain Text
            const block = detectBlockClassification(language, rawCode);

            // 1. Render Mermaid Flowchart / Sequence / State Diagrams natively
            if (block.type === "mermaid") {
              return <MermaidDiagram chart={rawCode} />;
            }

            // 2. Render Process Flow / Step Diagrams (e.g. [Step 1] -> [Step 2])
            if (block.type === "process-flow") {
              return (
                <div className="relative my-3 rounded-xl border border-sage/30 dark:border-border bg-white dark:bg-zinc-900 overflow-hidden not-prose shadow-2xs">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-cream dark:bg-zinc-950 border-b border-sage/20 dark:border-border text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-semibold text-forest dark:text-mint">
                      <Workflow className="size-3.5" />
                      <span>{block.label}</span>
                    </div>
                    <CodeCopyButton code={rawCode} />
                  </div>
                  <pre className="p-4 overflow-x-auto text-[13px] sm:text-[13.5px] font-mono leading-relaxed text-foreground select-text whitespace-pre">
                    <code>{rawCode}</code>
                  </pre>
                </div>
              );
            }

            // 3. Render Real Code with detected/specified Language Header
            if (block.type === "code" && block.label) {
              return (
                <div className="relative my-3 rounded-xl border border-sage/30 dark:border-border bg-white dark:bg-zinc-900 overflow-hidden not-prose shadow-2xs">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-cream dark:bg-zinc-950 border-b border-sage/20 dark:border-border text-xs text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5 font-semibold text-forest dark:text-mint">
                      <CodeIcon className="size-3.5" />
                      <span>{block.label}</span>
                    </div>
                    <CodeCopyButton code={rawCode} />
                  </div>
                  <pre className="p-4 overflow-x-auto text-[13.5px] font-mono text-foreground leading-relaxed select-text">
                    <code className={className}>{rawCode}</code>
                  </pre>
                </div>
              );
            }

            // 4. Render Plain Text / Non-Code Blocks (NO "code" text label at all)
            return (
              <div className="relative my-3 rounded-xl border border-sage/30 dark:border-border bg-white dark:bg-zinc-900 overflow-hidden not-prose shadow-2xs">
                <div className="flex items-center justify-end px-3.5 py-1.5 bg-cream/60 dark:bg-zinc-950/60 border-b border-sage/20 dark:border-border text-xs text-muted-foreground">
                  <CodeCopyButton code={rawCode} />
                </div>
                <pre className="p-4 overflow-x-auto text-[13.5px] font-mono text-foreground leading-relaxed select-text">
                  <code>{rawCode || children}</code>
                </pre>
              </div>
            );
          },

          // Inline Code Component (Pure inline element; never returns a block or <pre>)
          code({ className, children, node, ...props }: any) {
            return (
              <code
                className={cn(
                  "bg-mint-pale dark:bg-mint/10 text-forest dark:text-mint px-1.5 py-0.5 rounded text-xs font-mono border border-mint/20 font-medium select-text",
                  className
                )}
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

          // Paragraphs: guarded against any nested block children to prevent hydration errors
          p({ children, ...props }: any) {
            const hasBlockChild = React.Children.toArray(children).some((child) => {
              if (!React.isValidElement(child)) return false;
              const type = child.type;
              return (
                type === "div" ||
                type === "pre" ||
                type === "table" ||
                type === "ul" ||
                type === "ol" ||
                type === "blockquote" ||
                type === "hr"
              );
            });

            if (hasBlockChild) {
              return (
                <div className="leading-relaxed my-2 text-foreground" {...props}>
                  {children}
                </div>
              );
            }

            return (
              <p className="leading-relaxed my-2 text-foreground" {...props}>
                {children}
              </p>
            );
          },

          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-mint pl-3.5 italic text-muted-foreground my-3">
                {children}
              </blockquote>
            );
          },

          hr() {
            return <hr className="my-4 border-sage/30 dark:border-border" />;
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

          img({ src, alt }: any) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt || "Image"}
                className="my-3 rounded-xl max-w-full h-auto border border-sage/30 dark:border-border shadow-2xs"
                loading="lazy"
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Native Mermaid Diagram Client Component
 * Supports dynamic rendering with light/dark theme synchronization,
 * source code toggle, copy button, and graceful error fallback.
 */
function MermaidDiagram({ chart }: { chart: string }) {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const rawChart = chart.trim();
  const uid = useId().replace(/:/g, "_");

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = document.documentElement.classList.contains("dark");

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "var(--font-sans), system-ui, -apple-system, sans-serif",
          themeVariables: isDark
            ? {
                darkMode: true,
                background: "#18181b",
                primaryColor: "#059669",
                primaryTextColor: "#f4f4f5",
                primaryBorderColor: "#10b981",
                lineColor: "#71717a",
                secondaryColor: "#1e293b",
                tertiaryColor: "#27272a",
              }
            : {
                primaryColor: "#064e3b",
                primaryTextColor: "#064e3b",
                primaryBorderColor: "#059669",
                lineColor: "#94a3b8",
                secondaryColor: "#f0fdf4",
                tertiaryColor: "#f4f4f5",
              },
        });

        // Ensure unique element ID for each render pass
        const renderId = `mermaid_${uid}_${Math.random().toString(36).substring(2, 7)}`;
        const { svg } = await mermaid.render(renderId, rawChart);

        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err: any) {
        console.warn("Mermaid render error:", err);
        if (isMounted) {
          setError(err?.message || "Diagram syntax could not be rendered");
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [rawChart, uid]);

  return (
    <div className="relative my-4 rounded-xl border border-sage/30 dark:border-border bg-white dark:bg-zinc-900 overflow-hidden not-prose shadow-2xs">
      <div className="flex items-center justify-between px-3.5 py-2 bg-cream dark:bg-zinc-950 border-b border-sage/20 dark:border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-forest dark:text-mint">
          <Workflow className="size-3.5" />
          <span>Workflow Diagram</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Toggle source code"
          >
            <CodeIcon className="size-3" />
            <span>{showCode ? "Hide Code" : "Source"}</span>
          </button>
          <CodeCopyButton code={rawChart} />
        </div>
      </div>

      {showCode && (
        <pre className="p-3 bg-muted/40 border-b border-sage/20 dark:border-border overflow-x-auto text-[12px] font-mono text-foreground">
          <code>{rawChart}</code>
        </pre>
      )}

      <div className="p-4 overflow-x-auto flex justify-center items-center min-h-[100px] bg-white/50 dark:bg-zinc-900/50">
        {error ? (
          <div className="text-xs text-muted-foreground py-2 text-center w-full">
            <p className="text-amber-600 dark:text-amber-400 font-medium mb-1">
              Diagram preview unavailable (Syntax Error)
            </p>
            <pre className="text-[11.5px] font-mono bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-left overflow-x-auto">
              <code>{rawChart}</code>
            </pre>
          </div>
        ) : svgHtml ? (
          <div
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
            <Loader2 className="size-4 animate-spin text-mint" />
            <span>Rendering diagram...</span>
          </div>
        )}
      </div>
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

interface BlockClassification {
  type: "mermaid" | "process-flow" | "code" | "text";
  label: string | null;
}

/**
 * Intelligent classifier for fenced blocks.
 * Distinguishes between:
 * 1. Native Mermaid diagrams
 * 2. ASCII / Unicode process flows & workflow step diagrams
 * 3. Real code (specified or auto-detected by syntax patterns)
 * 4. Plain text / data tables (which show NO code label at all)
 */
function detectBlockClassification(language: string, rawCode: string): BlockClassification {
  const lang = (language || "").toLowerCase().trim();
  const code = rawCode.trim();

  // 1. Explicit Mermaid diagram
  if (lang === "mermaid") {
    return { type: "mermaid", label: "Workflow Diagram" };
  }

  // 2. Known programming languages
  const knownLanguages: Record<string, string> = {
    javascript: "JavaScript",
    js: "JavaScript",
    typescript: "TypeScript",
    ts: "TypeScript",
    tsx: "TypeScript (React)",
    jsx: "JavaScript (React)",
    python: "Python",
    py: "Python",
    bash: "Terminal",
    sh: "Terminal",
    shell: "Terminal",
    zsh: "Terminal",
    json: "JSON",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    yaml: "YAML",
    yml: "YAML",
    rust: "Rust",
    rs: "Rust",
    go: "Go",
    golang: "Go",
    java: "Java",
    c: "C",
    cpp: "C++",
    csharp: "C#",
    cs: "C#",
    php: "PHP",
    dockerfile: "Docker",
    docker: "Docker",
    graphql: "GraphQL",
    xml: "XML",
    markdown: "Markdown",
    md: "Markdown",
  };

  if (lang && knownLanguages[lang]) {
    return { type: "code", label: knownLanguages[lang] };
  }

  // 3. Process Flow / ASCII Diagram / Step sequences
  // Matches arrows: ->, -->, ==>, =>, ➔, ➜, →, ►, ▶, <-, <--
  // and step boxes: [ Step 1: ... ] or tree connectors: ├──, └──, │
  const hasArrows = /(?:->|-->|==>|=>|➔|➜|→|►|▶|<-|<--|←)/.test(code);
  const hasStepBoxes = /\[\s*(?:Step|\d+|Phase|[A-Za-z0-9\s]+?)\s*\]/i.test(code);
  const hasTreeChars = /[├└│┌┐┘┴┬┼]/.test(code) || /(?:\+--|\|--|\+-\+-)/.test(code);
  const hasNumberedSteps = /(?:Step\s*\d+:|Phase\s*\d+:)/i.test(code);

  if ((hasArrows && (hasStepBoxes || hasNumberedSteps)) || hasTreeChars) {
    return { type: "process-flow", label: "Process Flow" };
  }

  // 4. Code heuristic detection if language tag was omitted:
  // JSON
  if (
    (code.startsWith("{") && code.endsWith("}")) ||
    (code.startsWith("[") && code.endsWith("]"))
  ) {
    try {
      JSON.parse(code);
      return { type: "code", label: "JSON" };
    } catch (_) {}
  }

  // SQL
  if (
    /\b(SELECT\s+[\s\S]+?\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/i.test(
      code
    )
  ) {
    return { type: "code", label: "SQL" };
  }

  // Shell / Terminal
  if (
    /^(?:npm|npx|pnpm|yarn|git|docker|curl|pip|sudo|cd|export)\s+[a-zA-Z0-9_-]/m.test(code) ||
    /^\$\s+[a-zA-Z0-9_-]/m.test(code)
  ) {
    return { type: "code", label: "Terminal" };
  }

  // Python
  if (
    /\b(def\s+[a-zA-Z0-9_]+\s*\(|import\s+[a-zA-Z0-9_]+|from\s+[a-zA-Z0-9_]+\s+import|class\s+[a-zA-Z0-9_]+:)\b/.test(
      code
    )
  ) {
    return { type: "code", label: "Python" };
  }

  // JavaScript / TypeScript
  if (
    /\b(const\s+[a-zA-Z0-9_$]+\s*=|let\s+[a-zA-Z0-9_$]+\s*=|function\s+[a-zA-Z0-9_$]*\s*\(|console\.(?:log|error|warn)\(|export\s+(?:default|const|function))\b/.test(
      code
    )
  ) {
    return { type: "code", label: "JavaScript" };
  }

  // HTML / XML
  if (
    /^<([a-zA-Z0-9_-]+)(?:\s+[^>]*)?>[\s\S]*<\/\1>$/m.test(code) &&
    /<\/[a-zA-Z0-9_-]+>/.test(code)
  ) {
    return { type: "code", label: "HTML" };
  }

  // If an explicit language tag was provided that isn't a plain text alias
  if (
    lang &&
    lang !== "text" &&
    lang !== "plaintext" &&
    lang !== "none" &&
    lang !== "code"
  ) {
    return { type: "code", label: lang.toUpperCase() };
  }

  // 5. Default: It is NOT code! Return text with NO label at all.
  return { type: "text", label: null };
}


