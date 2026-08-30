"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import type { AuthUser } from "@/lib/auth-types";

import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

interface AppTopbarProps {
  currentUser?: AuthUser | null;
}

export function AppTopbar({ currentUser }: AppTopbarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-60 p-0 border-0 bg-sidebar">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AppSidebar
              currentUser={currentUser}
              onClose={() => setIsSidebarOpen(false)}
              className="flex w-full h-full border-r-0"
            />
          </SheetContent>
        </Sheet>

        {/* Quick Search */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground w-64 max-w-full">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">Search workspace...</span>
          <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher variant="header" />
        <ThemeToggle />
      </div>
    </header>
  );
}
