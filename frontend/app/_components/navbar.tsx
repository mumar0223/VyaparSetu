"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth-types";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  currentUser?: AuthUser | null;
}

export function Navbar({ currentUser }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{
        duration: 0.6,
        ease: "easeOut",
      }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center w-full px-4 md:px-8 pointer-events-none"
    >
      <div
        className={cn(
          "h-16 flex items-center justify-between px-6 w-full max-w-7xl pointer-events-auto rounded-2xl transition-all duration-300 border border-transparent shadow-none bg-transparent",
          isScrolled &&
            "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-sage/30 dark:border-border shadow-lg"
        )}
      >
        <div className="flex items-center select-none">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-3.5 bg-mint rounded-full shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
            <span className="font-serif font-bold text-xl text-forest dark:text-mint tracking-tight">
              VyaparSetu
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-semibold text-ink-muted dark:text-muted-foreground">
          <button
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-forest dark:hover:text-mint transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold"
          >
            Advisory
          </button>
          <button
            onClick={() =>
              document
                .getElementById("technologies")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-forest dark:hover:text-mint transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold"
          >
            Technology
          </button>
          <button
            onClick={() =>
              document
                .getElementById("pricing")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-forest dark:hover:text-mint transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold"
          >
            Plans
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {currentUser ? (
            <Link
              href="/ai-saathi"
              className="px-5 py-2.5 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs active:scale-95 inline-flex items-center justify-center"
            >
              Go to AI Saathi
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-ink-muted dark:text-muted-foreground hover:text-forest dark:hover:text-mint transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4.5 py-2.5 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs active:scale-95 inline-flex items-center justify-center"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
