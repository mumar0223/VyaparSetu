"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, TrendingUp, Sparkles, Activity, ShieldCheck, Target, Calculator, HandCoins, Building2, CheckCircle2 } from "lucide-react";
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
        mutationFn: async () => {
            return new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["business-credit"] });
        }
    });

    if (isLoading || !creditData) {
        return (
            <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-10 animate-spin text-mint" />
            </div>
        );
    }

    const score = creditData.score;
    
    // Gauge Math (Semi-circle 0 to 180 degrees)
    // Map score 300-900 to 0-100%
    const scorePercent = Math.max(0, Math.min(100, ((score - 300) / 600) * 100));
    const radius = 80;
    const circumference = Math.PI * radius; // Half circle
    const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2">
                        <Activity className="size-7 text-orange" /> Business Readiness Score
                    </h1>
                    <p className="text-ink-muted mt-1">Your simulated internal credit rating for government scheme eligibility.</p>
                </div>
                <button
                    onClick={() => recalculateMutation.mutate()}
                    disabled={recalculateMutation.isPending}
                    className="bg-white border border-sage/40 hover:border-mint text-forest font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95 shrink-0"
                >
                    {recalculateMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : "Recalculate Score"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* HERO GAUGE (Left, spans 5 cols) */}
                <div className="lg:col-span-5 bg-forest rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[400px]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-mint/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 w-full flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-mint/20 border border-mint/30 rounded-full text-mint text-sm font-bold uppercase tracking-wider mb-8">
                            <ShieldCheck className="size-4" /> Strong Profile
                        </div>

                        {/* SVG Gauge */}
                        <div className="relative w-64 h-32 overflow-hidden mb-6">
                            <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 200 100">
                                {/* Background track */}
                                <path
                                    d="M 20 90 A 80 80 0 0 1 180 90"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    className="text-white/10"
                                />
                                {/* Colored progress */}
                                <path
                                    d="M 20 90 A 80 80 0 0 1 180 90"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    className="text-mint transition-all duration-1000 ease-out"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end h-full">
                                <span className="text-6xl font-bold tracking-tight leading-none text-white">{score}</span>
                            </div>
                        </div>
                        
                        <p className="text-white/70 font-medium mb-8">Out of 900</p>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-full border border-white/20">
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block mb-1">Estimated Borrowing Capacity</span>
                            <span className="text-3xl font-bold text-mint tracking-tight">₹{creditData.maxBorrowingCapacity.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* DETAILS (Right, spans 7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    
                    {/* Score Breakdown */}
                    <div className="bg-white border border-sage/40 rounded-[2rem] p-6 shadow-sm">
                        <h3 className="font-bold text-forest text-lg flex items-center gap-2 mb-6">
                            <Calculator className="size-5 text-mint" /> Score Breakdown
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sage/20 rounded-lg text-forest"><Activity className="size-4" /></div>
                                    <span className="font-bold text-ink">Cash Flow Stability</span>
                                </div>
                                <span className="font-bold text-mint text-lg">+220</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sage/20 rounded-lg text-forest"><CheckCircle2 className="size-4" /></div>
                                    <span className="font-bold text-ink">Payment History</span>
                                </div>
                                <span className="font-bold text-mint text-lg">+200</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sage/20 rounded-lg text-forest"><HandCoins className="size-4" /></div>
                                    <span className="font-bold text-ink">Debt Management</span>
                                </div>
                                <span className="font-bold text-mint text-lg">+180</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sage/20 rounded-lg text-forest"><Building2 className="size-4" /></div>
                                    <span className="font-bold text-ink">Business Longevity</span>
                                </div>
                                <span className="font-bold text-mint text-lg">+120</span>
                            </div>

                            <div className="h-px w-full bg-sage/40 my-2" />

                            <div className="flex items-center justify-between pt-2">
                                <span className="font-bold text-ink-muted uppercase tracking-wider text-sm">Total Score</span>
                                <span className="font-bold text-forest text-2xl">720</span>
                            </div>
                        </div>
                    </div>

                    {/* Credit Timeline Trend */}
                    <div className="bg-[#fdfbf7] border border-sage/40 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-forest text-lg flex items-center gap-2">
                                <TrendingUp className="size-5 text-orange" /> Credit Timeline
                            </h3>
                            <span className="text-xs font-bold text-mint uppercase tracking-wider bg-mint/10 px-3 py-1 rounded-full">+40 Points YoY</span>
                        </div>

                        <div className="flex items-end justify-between h-32 px-2 sm:px-8">
                            {[
                                { month: "Jan", val: 680, height: "65%" },
                                { month: "Feb", val: 690, height: "70%" },
                                { month: "Mar", val: 705, height: "80%" },
                                { month: "Apr", val: 720, height: "95%" },
                            ].map((point, i) => (
                                <div key={point.month} className="flex flex-col items-center gap-3 relative group w-12">
                                    <span className="text-xs font-bold text-forest absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity">{point.val}</span>
                                    <div className="w-full bg-sage/20 rounded-t-lg relative" style={{ height: "100%" }}>
                                        <div 
                                            className={cn("absolute bottom-0 w-full rounded-t-lg transition-all", i === 3 ? "bg-mint" : "bg-sage")} 
                                            style={{ height: point.height }} 
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-ink-muted uppercase">{point.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* AI Improvement Simulator */}
            <div className="bg-white border-2 border-mint/30 rounded-[2rem] p-6 sm:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Target className="size-48 text-mint" />
                </div>
                
                <h3 className="font-bold text-forest text-2xl mb-2 flex items-center gap-3">
                    <Sparkles className="size-6 text-orange" /> Score Improvement Simulator
                </h3>
                <p className="text-ink-muted mb-8 font-medium">What if you took these actions? See how your score would react.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    
                    <div className="bg-cream border border-sage/40 p-5 rounded-2xl flex flex-col justify-between hover:border-mint transition-colors cursor-pointer group">
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Scenario 1</p>
                            <h4 className="font-bold text-forest text-lg leading-tight mb-4">Pay off ₹50,000 existing debt</h4>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-sage/20 shadow-sm">
                            <span className="font-bold text-ink-muted line-through">720</span>
                            <span className="font-bold text-forest">→</span>
                            <span className="font-bold text-mint text-xl">740</span>
                        </div>
                    </div>

                    <div className="bg-cream border border-sage/40 p-5 rounded-2xl flex flex-col justify-between hover:border-mint transition-colors cursor-pointer group">
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Scenario 2</p>
                            <h4 className="font-bold text-forest text-lg leading-tight mb-4">Increase savings by ₹20,000</h4>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-sage/20 shadow-sm">
                            <span className="font-bold text-ink-muted line-through">720</span>
                            <span className="font-bold text-forest">→</span>
                            <span className="font-bold text-mint text-xl">735</span>
                        </div>
                    </div>

                    <div className="bg-cream border border-sage/40 p-5 rounded-2xl flex flex-col justify-between hover:border-mint transition-colors cursor-pointer group">
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Scenario 3</p>
                            <h4 className="font-bold text-forest text-lg leading-tight mb-4">Maintain positive cash flow for 3 months</h4>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-sage/20 shadow-sm">
                            <span className="font-bold text-ink-muted line-through">720</span>
                            <span className="font-bold text-forest">→</span>
                            <span className="font-bold text-mint text-xl">755</span>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
