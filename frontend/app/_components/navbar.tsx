"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth-types";

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
        duration: 0.8,
        ease: "easeOut",
        backgroundColor: { duration: 0 },
        borderColor: { duration: 0 },
        color: { duration: 0 },
      }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center w-full px-4 md:px-8 pointer-events-none"
    >
      <div
        className={cn(
          "h-16 flex items-center justify-between px-6 w-full max-w-7xl pointer-events-auto rounded-2xl transition-all duration-500 border border-transparent shadow-none bg-transparent",
          isScrolled &&
            "bg-background/70 dark:bg-white/3 backdrop-blur-xl border-border/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        )}
      >
        <div className="flex items-center select-none">
          <Link
            href="/"
            className="app-font text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/75 dark:from-white dark:to-white/60"
          >
            VyaparSetu
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <button
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            Advisory
          </button>
          <button
            onClick={() =>
              document
                .getElementById("technologies")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            Technology
          </button>
          <button
            onClick={() =>
              document
                .getElementById("pricing")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            Plans
          </button>
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-foreground text-background dark:bg-white dark:text-black text-sm font-bold rounded-xl hover:bg-foreground/90 dark:hover:bg-white/90 transition-all shadow-lg active:scale-95 inline-flex items-center justify-center"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-foreground text-background dark:bg-white dark:text-black text-sm font-bold rounded-xl hover:bg-foreground/90 dark:hover:bg-white/90 transition-all shadow-lg active:scale-95 inline-flex items-center justify-center"
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
