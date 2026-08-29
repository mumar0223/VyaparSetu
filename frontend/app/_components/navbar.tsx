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
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-4 md:px-8 bg-white border-b border-[#e7e5e4] transition-all duration-500",
        isScrolled ? "shadow-sm" : ""
      )}
    >
      <div className="h-16 flex items-center justify-between w-full max-w-7xl">
        <div className="flex items-center select-none">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-colors"
          >
            <div className="size-7 rounded-full bg-[#d1fae5] flex items-center justify-center transition-colors group-hover:bg-[#a7f3d0]">
              <div className="size-2.5 rounded-full bg-[#059669]"></div>
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#064e3b] group-hover:text-[#047857]">
              VyaparSetu
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#475569]">
          <button
            onClick={() => document.getElementById("audience")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:text-[#10b981] transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            Audience
          </button>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:text-[#10b981] transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            Features
          </button>
          <button
            onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:text-[#10b981] transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            How it Works
          </button>
          <button
            onClick={() => document.getElementById("technologies")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:text-[#10b981] transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            Technology
          </button>
          <button
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:text-[#10b981] transition-colors bg-transparent border-none p-0 cursor-pointer font-medium"
          >
            Plans
          </button>
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-[#10b981] text-white text-sm font-bold rounded-xl hover:bg-[#059669] transition-all shadow-lg active:scale-95 inline-flex items-center justify-center"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-white border border-[#e7e5e4] text-sm font-semibold text-[#475569] rounded-xl hover:text-[#10b981] hover:border-[#10b981]/50 transition-all shadow-sm active:scale-95 inline-flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-[#10b981] text-white text-sm font-bold rounded-xl hover:bg-[#059669] transition-all shadow-lg active:scale-95 inline-flex items-center justify-center"
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
