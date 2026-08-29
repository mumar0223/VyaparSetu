"use client";

import { ShieldAlert, TrendingUp, AlertTriangle, Lightbulb, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwotGridProps {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    dataSourceNote?: string;
    confidenceScore?: number;
}

export function SwotGrid({
    strengths,
    weaknesses,
    opportunities,
    threats,
    dataSourceNote,
    confidenceScore,
}: SwotGridProps) {
    return (
        <div className="space-y-6">
            {/* Data Source & Confidence Warning */}
            {(dataSourceNote || confidenceScore !== undefined) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-orange/10 border border-orange/20 text-orange-hover">
                    <div className="flex items-start sm:items-center gap-3 text-sm font-medium">
                        <Info className="size-5 shrink-0 mt-0.5 sm:mt-0" />
                        <p>
                            <strong className="font-bold">Important:</strong> {dataSourceNote || "These results contain predictive estimates and not authoritative real-time guarantees."}
                        </p>
                    </div>
                    {confidenceScore !== undefined && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-orange/20 shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider">Confidence Level</span>
                            <span className="font-bold text-lg">{confidenceScore}%</span>
                        </div>
                    )}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Strengths */}
                <div className="p-6 rounded-3xl bg-mint-pale border border-mint/30 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap className="size-24 text-forest" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-mint rounded-xl text-forest">
                                <Zap className="size-5" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-forest">Strengths</h3>
                        </div>
                        <ul className="space-y-3">
                            {strengths.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-forest/90 font-medium text-sm leading-relaxed">
                                    <span className="text-mint font-bold mt-0.5">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Weaknesses */}
                <div className="p-6 rounded-3xl bg-orange/5 border border-orange/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <AlertTriangle className="size-24 text-orange" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange/20 rounded-xl text-orange-hover">
                                <AlertTriangle className="size-5" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-orange-hover">Weaknesses</h3>
                        </div>
                        <ul className="space-y-3">
                            {weaknesses.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-orange-hover/90 font-medium text-sm leading-relaxed">
                                    <span className="text-orange font-bold mt-0.5">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Opportunities */}
                <div className="p-6 rounded-3xl bg-sage/10 border border-sage/40 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Lightbulb className="size-24 text-forest" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-sage/30 rounded-xl text-forest">
                                <Lightbulb className="size-5" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-forest">Opportunities</h3>
                        </div>
                        <ul className="space-y-3">
                            {opportunities.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-forest/90 font-medium text-sm leading-relaxed">
                                    <span className="text-sage font-bold mt-0.5">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Threats */}
                <div className="p-6 rounded-3xl bg-red-50 border border-red-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <ShieldAlert className="size-24 text-red-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-100 rounded-xl text-red-700">
                                <ShieldAlert className="size-5" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-red-900">Threats</h3>
                        </div>
                        <ul className="space-y-3">
                            {threats.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-red-800 font-medium text-sm leading-relaxed">
                                    <span className="text-red-400 font-bold mt-0.5">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
