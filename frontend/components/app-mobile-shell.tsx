"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, TrendingUp, User, IndianRupee } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import type { AuthUser } from "@/lib/auth-types";

import { ThemeToggle } from "@/components/theme-toggle";

interface AppMobileShellProps {
  currentUser?: AuthUser | null;
  children: React.ReactNode;
}

export function AppMobileShell({ currentUser, children }: AppMobileShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-cream font-sans antialiased text-ink">
      {/* Desktop Sidebar */}
      <AppSidebar currentUser={currentUser} className="hidden lg:flex" />

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-forest/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-72 h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-sage/30">
              <span className="font-serif font-bold text-lg text-forest">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-ink-muted hover:text-forest">
                <X className="size-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AppSidebar currentUser={currentUser} onClose={() => setMobileOpen(false)} className="w-full border-r-0" />
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden relative">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex h-14 items-center justify-between border-b border-sage/30 bg-white px-4 shrink-0 z-20">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="size-3 bg-mint rounded-full shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
            <span className="font-serif font-bold text-lg text-forest">VyaparSetu</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-forest hover:bg-cream cursor-pointer"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-hidden bg-cream">
          {children}
        </main>
      </div>
    </div>
  );
}
