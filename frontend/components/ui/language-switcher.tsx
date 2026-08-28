"use client";

import { useAppStore } from "@/lib/store";
import { Globe, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "mr", label: "मराठी" },
    { code: "te", label: "తెలుగు" },
];

interface LanguageSwitcherProps {
    className?: string;
    variant?: "outline" | "solid";
}

export function LanguageSwitcher({ className, variant = "outline" }: LanguageSwitcherProps) {
    const { activeLanguage, setLanguage } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const activeLabel = LANGUAGES.find(l => l.code === activeLanguage)?.label || "English";

    return (
        <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1.5 font-medium transition-colors py-2 px-3 rounded-md",
                    variant === "outline" ? "text-ink-muted hover:text-forest hover:bg-sage/20 border border-transparent" : "text-white border border-white/20 hover:bg-white/10"
                )}
            >
                <Globe className="size-4" />
                <span className="text-sm">{activeLabel}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white border border-sage/30 shadow-lg ring-1 ring-black/5 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "flex items-center justify-between w-full px-4 py-2 text-sm text-left font-medium transition-colors",
                                    activeLanguage === lang.code ? "bg-mint-pale text-forest" : "text-ink hover:bg-sage/10 hover:text-forest"
                                )}
                            >
                                {lang.label}
                                {activeLanguage === lang.code && <Check className="size-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
