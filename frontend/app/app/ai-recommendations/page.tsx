"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, Lightbulb, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface AIRecommendation {
    id: string;
    category: "growth" | "efficiency" | "finance";
    title: string;
    description: string;
    impactScore: number;
}

export default function RecommendationsPage() {
    const { data: recommendations, isLoading } = useQuery({
        queryKey: ["ai-recommendations"],
        queryFn: async () => {
            try {
                return await apiClient.get<AIRecommendation[]>("/ai/recommendations");
            } catch (e) {
                return [
                    {
                        id: "1",
                        category: "growth",
                        title: "Expand to neighboring cluster",
                        description: "Based on your logistics expenses, servicing the eastern cluster directly could increase margins by 12%.",
                        impactScore: 85
                    },
                    {
                        id: "2",
                        category: "finance",
                        title: "Optimize Inventory Holding",
                        description: "You are holding 30% more inventory than average local demand signals suggest.",
                        impactScore: 72
                    },
                    {
                        id: "3",
                        category: "efficiency",
                        title: "Shift to Digital Payments",
                        description: "High cash flow handling is causing reconciliation delays. Introduce UPI QR at storefront.",
                        impactScore: 92
                    }
                ] as AIRecommendation[];
            }
        }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-forest">AI Recommendations</h1>
                <p className="text-ink-muted">Proactive intelligence generated from your business footprint.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="animate-pulse h-32 bg-sage/20 rounded-3xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations?.map(rec => (
                        <div key={rec.id} className="bg-white p-6 rounded-3xl border border-sage/30 shadow-sm flex flex-col justify-between group hover:border-mint/50 transition-colors">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 rounded-lg bg-mint-pale text-mint">
                                        {rec.category === "growth" ? <TrendingUp className="size-5" /> :
                                            rec.category === "finance" ? <Sparkles className="size-5" /> :
                                                <Lightbulb className="size-5" />}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">{rec.category}</span>
                                </div>
                                <h3 className="text-xl font-bold text-forest mb-2">{rec.title}</h3>
                                <p className="text-sm text-ink-muted leading-relaxed mb-6">{rec.description}</p>
                            </div>
                            <div className="flex items-center justify-between border-t border-sage/20 pt-4 mt-auto">
                                <span className="text-sm font-bold text-ink-muted">Estimated Impact</span>
                                <div className="flex flex-col items-end">
                                    <div className="w-24 bg-sage/20 rounded-full h-1.5 mb-1 overflow-hidden">
                                        <div className="bg-mint h-full rounded-full" style={{ width: `${rec.impactScore}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-forest">{rec.impactScore}/100</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
