"use client";

import { AlertCircle, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchemePillProps {
    name: string;
    corporation?: "NSFDC" | "NBCFDC" | "NSTFDC" | "NSKFDC" | "Other" | string;
    needsVerification?: boolean;
}

export function SchemePill({ name, corporation, needsVerification }: SchemePillProps) {
    return (
        <div className="inline-flex items-center gap-3 bg-white border border-sage/40 rounded-full py-1.5 pl-4 pr-1.5 shadow-sm max-w-full">
            <span className="font-bold text-forest truncate">{name}</span>

            <div className="flex items-center gap-1.5 shrink-0">
                {corporation && (
                    <span className="inline-flex items-center gap-1 bg-sage/20 text-forest text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        <Building2 className="size-3" />
                        {corporation}
                    </span>
                )}

                {needsVerification && (
                    <span className="inline-flex items-center gap-1 bg-orange/10 border border-orange/20 text-orange-hover text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                        <AlertCircle className="size-3 text-orange" />
                        Figures Pending Verification
                    </span>
                )}
            </div>
        </div>
    );
}
