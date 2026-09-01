"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, TrendingUp, User, IndianRupee } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import type { AuthUser } from "@/lib/auth-types";

import { ThemeToggle } from "@/components/theme-toggle";

import { LanguageSwitcher } from "@/components/language-switcher";
import { AppBackground } from "@/components/app-background";

interface AppMobileShellProps {
  currentUser?: AuthUser | null;
  children: React.ReactNode;
}

export function AppMobileShell({ currentUser, children }: AppMobileShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-cream dark:bg-background font-sans antialiased text-foreground">
      {/* ── Fixed Animated Hexagonal Grid Background (Global across all dashboard pages) ── */}
      <AppBackground />

      {/* Desktop Sidebar */}
      <AppSidebar currentUser={currentUser} className="hidden lg:flex z-20" />

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-72 h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col border-r border-sage/30 dark:border-border">
            <div className="flex items-center justify-between p-4 border-b border-sage/30 dark:border-border bg-white dark:bg-zinc-950">
              <span className="font-serif font-bold text-lg text-forest dark:text-foreground">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-ink-muted dark:text-muted-foreground hover:text-forest dark:hover:text-foreground cursor-pointer">
                <X className="size-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AppSidebar currentUser={currentUser} onClose={() => setMobileOpen(false)} className="w-full border-r-0 bg-transparent" />
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden relative z-10">
        {/* ChatGPT Style Floating Mobile Top Bar (< 1024px) */}
        <div className="lg:hidden fixed top-3 left-3 z-30 flex items-center pointer-events-auto select-none">
          <div className="h-10 px-1.5 flex items-center gap-1 bg-white/90 dark:bg-card/90 backdrop-blur-md border border-sage/40 dark:border-border rounded-2xl shadow-xs">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="size-8 rounded-xl flex items-center justify-center text-forest dark:text-foreground hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
            >
              <Menu className="size-4.5" />
            </button>
            <LanguageSwitcher variant="brand" className="h-8 shadow-none border-0 bg-transparent px-1.5 hover:bg-cream dark:hover:bg-muted" />
          </div>
        </div>

        {/* Main Content (Edge to Edge Full Viewport) */}
        <main className="flex-1 h-full overflow-hidden bg-transparent text-foreground relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
