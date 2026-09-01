"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream dark:bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans selection:bg-mint-pale selection:text-forest relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-b from-orange/15 dark:from-orange/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto shrink-0 z-10">
        <Link href="/ai-saathi" className="flex items-center gap-2.5">
          <div className="size-3.5 bg-mint rounded-full shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
          <span className="font-serif font-bold text-xl text-forest dark:text-mint tracking-tight">
            VyaparSetu
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Error Box */}
      <main className="max-w-xl w-full mx-auto text-center my-auto py-8 sm:py-12 z-10">
        {/* Warning Icon Badge */}
        <div className="size-16 sm:size-20 rounded-3xl bg-orange/10 dark:bg-orange/20 border border-orange/30 text-orange flex items-center justify-center mx-auto mb-6 shadow-inner animate-in zoom-in-95 duration-300">
          <AlertTriangle className="size-8 sm:size-10 text-orange" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 border border-orange/30 text-orange text-xs font-bold mb-4">
          <ShieldAlert className="size-3.5" />
          <span>Operational Advisory Interruption</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-forest dark:text-foreground mb-3">
          Something went sideways
        </h1>

        <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
          Our financial reasoning engine encountered an unexpected exception while processing this view. Your database records remain safe and immutable.
        </p>

        {error.digest && (
          <div className="bg-white dark:bg-card border border-sage/30 dark:border-border rounded-xl p-3 mb-6 max-w-sm mx-auto text-[11px] font-mono text-muted-foreground truncate">
            Digest Ref: {error.digest}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="size-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/ai-saathi"
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted text-foreground font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="size-4 text-mint" />
            <span>Go to AI Saathi</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground shrink-0 max-w-5xl w-full mx-auto pt-6 border-t border-sage/20 dark:border-border/40">
        VyaparSetu — Enterprise Data Sovereignty &amp; Protection
      </footer>
    </div>
  );
}
