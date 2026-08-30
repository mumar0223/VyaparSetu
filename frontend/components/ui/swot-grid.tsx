"use client";

import { ShieldAlert, TrendingUp, AlertTriangle, Lightbulb, Info } from "lucide-react";

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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-orange/5 border border-orange/20 text-orange-hover">
                    <div className="flex items-start sm:items-center gap-3 text-sm font-medium">
                        <Info className="size-5 shrink-0 mt-0.5 sm:mt-0" />
                        <p>
                            <strong className="font-bold">Important:</strong> {dataSourceNote || "These results contain predictive estimates and not authoritative real-time guarantees."}
                        </p>
                    </div>
                    {confidenceScore !== undefined && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-orange/20 shrink-0 shadow-sm">
                            <span className="text-xs font-bold uppercase tracking-wider">Confidence Level</span>
                            <span className="font-bold text-lg">{confidenceScore}%</span>
                        </div>
                    )}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                {/* 🟢 Strengths */}
                <div className="p-6 rounded-3xl bg-white border border-sage/30 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-mint/40 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <TrendingUp className="size-24 text-forest" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-mint/10 rounded-xl text-forest border border-mint/20">
                                <TrendingUp className="size-5 text-mint" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-forest">Strengths</h3>
                        </div>
                        <ul className="space-y-3">
                            {strengths.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-ink font-medium text-sm leading-relaxed">
                                    <span className="text-mint font-bold mt-0.5">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 🟡 Opportunities */}
                <div className="p-6 rounded-3xl bg-white border border-sage/30 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-yellow-400/40 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <Lightbulb className="size-24 text-yellow-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-yellow-50 rounded-xl border border-yellow-200">
                                <Lightbulb className="size-5 text-yellow-600" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-yellow-700">Opportunities</h3>
                        </div>
                        <ul className="space-y-3">
                            {opportunities.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-ink font-medium text-sm leading-relaxed">
                                    <span className="text-yellow-500 font-bold mt-0.5">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 🟠 Weaknesses */}
                <div className="p-6 rounded-3xl bg-white border border-sage/30 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-orange/40 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <AlertTriangle className="size-24 text-orange" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-orange/10 rounded-xl border border-orange/20">
                                <AlertTriangle className="size-5 text-orange" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-orange-hover">Weaknesses</h3>
                        </div>
                        <ul className="space-y-3">
                            {weaknesses.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-ink font-medium text-sm leading-relaxed">
                                    <span className="text-orange font-bold mt-0.5">•</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 🔴 Threats */}
                <div className="p-6 rounded-3xl bg-white border border-sage/30 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-red-300 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <ShieldAlert className="size-24 text-red-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                                <ShieldAlert className="size-5 text-red-600" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-red-700">Threats</h3>
                        </div>
                        <ul className="space-y-3">
                            {threats.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-ink font-medium text-sm leading-relaxed">
                                    <span className="text-red-500 font-bold mt-0.5">•</span>
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
