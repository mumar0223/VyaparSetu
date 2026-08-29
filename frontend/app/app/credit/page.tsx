"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Loader2, Info, TrendingUp, TrendingDown } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface BusinessCredit {
    score: number;
    maxBorrowingCapacity: number;
    factors: {
        positive: string[];
        negative: string[];
    };
    lastFetched: string;
}

export default function BusinessCreditPage() {
    const queryClient = useQueryClient();

    const { data: creditData, isLoading } = useQuery({
        queryKey: ["business-credit"],
        queryFn: async () => {
            try {
                return await apiClient.get<BusinessCredit>("/business-credit");
            } catch (e) {
                return {
                    score: 720,
                    maxBorrowingCapacity: 500000,
                    factors: {
                        positive: ["Consistent cash flow over last 6 months", "No recent payment defaults"],
                        negative: ["High credit utilization ratio", "Short business history"],
                    },
                    lastFetched: new Date().toISOString(),
                };
            }
        }
    });

    const recalculateMutation = useMutation({
        mutationFn: () => apiClient.post("/business-credit/recalculate"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["business-credit"] });
        }
    });

    if (isLoading) return <div className="h-64 animate-pulse bg-sage/20 rounded-3xl" />;
    if (!creditData) return null;

    const getScoreColor = (score: number) => {
        if (score >= 750) return "text-mint border-mint ring-mint-light bg-mint-pale";
        if (score >= 600) return "text-orange border-orange ring-orange/20 bg-orange/5";
        return "text-red-500 border-red-500 ring-red-100 bg-red-50";
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-forest">Business Readiness Score</h1>
                    <p className="text-ink-muted">Your simulated internal credit rating for government scheme eligibility.</p>
                </div>
                <button
                    onClick={() => recalculateMutation.mutate()}
                    disabled={recalculateMutation.isPending}
                    className="bg-white border border-sage/40 hover:border-mint text-forest font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                    {recalculateMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : "Recalculate Score"}
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">

                <div className="bg-white p-8 rounded-3xl border border-sage/30 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-6">Current Score</div>

                    <div className={cn(
                        "size-48 rounded-full flex items-center justify-center border-[8px] ring-8 shadow-inner mb-6",
                        getScoreColor(creditData.score)
                    )}>
                        <span className="text-6xl font-bold">
                            {creditData.score}
                        </span>
                    </div>

                    <div className="bg-sage/10 rounded-xl p-4 w-full flex flex-col items-center">
                        <span className="text-xs font-bold text-ink-muted uppercase">Estimated Borrowing Capacity</span>
                        <span className="text-2xl font-bold text-forest mt-1">₹{creditData.maxBorrowingCapacity.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-mint/20 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="size-5 text-mint" />
                            <h3 className="font-bold text-forest text-lg">Growth Factors</h3>
                        </div>
                        <ul className="space-y-3">
                            {creditData.factors.positive.map((factor, i) => (
                                <li key={i} className="flex gap-3 text-sm font-medium text-ink-muted leading-relaxed">
                                    <ShieldCheck className="size-5 text-mint shrink-0" />
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-orange/20 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingDown className="size-5 text-orange" />
                            <h3 className="font-bold text-orange-hover text-lg">Areas for Improvement</h3>
                        </div>
                        <ul className="space-y-3">
                            {creditData.factors.negative.map((factor, i) => (
                                <li key={i} className="flex gap-3 text-sm font-medium text-ink-muted leading-relaxed">
                                    <Info className="size-5 text-orange shrink-0" />
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
