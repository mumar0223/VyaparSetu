"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calculator, AlertCircle, Building2, ChevronRight, Download } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { MoneyInputField } from "@/components/ui/money-input-field";
import { EmiScheduleTable, type EmiScheduleRow } from "@/components/ui/emi-schedule-table";
import { SchemePill } from "@/components/ui/scheme-pill";
import { cn } from "@/lib/utils";

interface LoanApplicationResponse {
    scheme: {
        name: string;
        description: string;
        corporation?: string;
        needsVerification: boolean;
        interestRatePercent: number;
        maxTenureMonths: number;
        moratoriumMonths: number;
    };
    schedule: EmiScheduleRow[];
}

export default function BorrowingPage() {
    const [projectCostInr, setProjectCostInr] = useState<number | undefined>();
    const [corporationHint, setCorporationHint] = useState<string>("NSFDC");

    const loanMutation = useMutation({
        mutationFn: async () => {
            if (!projectCostInr) throw new Error("Project cost needed");
            // Simulated request since backend is unavailable
            return new Promise<LoanApplicationResponse>((resolve) => {
                setTimeout(() => {
                    const schedule: EmiScheduleRow[] = [];
                    const principal = projectCostInr;
                    const months = 36;
                    const rate = 6 / 100 / 12; // 6% annual
                    const moratorium = 6;

                    let balance = principal;
                    for (let m = 1; m <= months; m++) {
                        const isMoratorium = m <= moratorium;
                        const interest = balance * rate;
                        // Simplified calculation just for mock UI presentation
                        const emi = isMoratorium ? interest : (principal / (months - moratorium)) + interest;
                        const prinPaid = isMoratorium ? 0 : (emi - interest);
                        balance -= prinPaid;

                        schedule.push({
                            month: m,
                            isMoratorium,
                            principalPaid: Math.round(prinPaid),
                            interestPaid: Math.round(interest),
                            totalEmi: Math.round(emi),
                            remainingBalance: Math.max(0, Math.round(balance)),
                        });
                    }

                    resolve({
                        scheme: {
                            name: "Term Loan Scheme (Micro-Credit)",
                            description: "A subsidized term loan structured for marginalized communities offering extended moratorium.",
                            corporation: corporationHint,
                            needsVerification: true,
                            interestRatePercent: 6.0,
                            maxTenureMonths: 60,
                            moratoriumMonths: 6,
                        },
                        schedule,
                    });
                }, 1200);
            });
        }
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-forest">Financial Planner & Loans</h1>
                <p className="text-ink-muted">Calculate loan feasibility, match with corporation schemes, and view your detailed EMI schedule.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Loan Calculator Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-sage/30 shadow-sm">
                        <h2 className="text-xl font-bold text-forest mb-6 flex items-center gap-2">
                            <Calculator className="size-5 text-mint" />
                            Loan Application
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-ink-muted mb-2">Total Project Cost</label>
                                <MoneyInputField
                                    value={projectCostInr}
                                    onChange={setProjectCostInr}
                                    placeholder="2,50,000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-ink-muted mb-2">Target Corporation (Optional)</label>
                                <select
                                    className="w-full bg-cream border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl px-4 py-4 text-ink font-bold outline-none transition-all appearance-none"
                                    value={corporationHint}
                                    onChange={(e) => setCorporationHint(e.target.value)}
                                >
                                    <option value="NSFDC">NSFDC (Scheduled Castes)</option>
                                    <option value="NBCFDC">NBCFDC (Backward Classes)</option>
                                    <option value="NSTFDC">NSTFDC (Scheduled Tribes)</option>
                                    <option value="NSKFDC">NSKFDC (Safai Karamcharis)</option>
                                    <option value="">No Preference (Auto-match)</option>
                                </select>
                            </div>

                            <button
                                onClick={() => loanMutation.mutate()}
                                disabled={!projectCostInr || loanMutation.isPending}
                                className="w-full bg-orange hover:bg-orange-hover disabled:bg-sage disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loanMutation.isPending ? "Calculating..." : "Generate Schedule"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="lg:col-span-2 space-y-6">
                    {loanMutation.data ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            {/* Scheme Match Card */}
                            <div className="bg-white p-6 rounded-3xl border border-mint/40 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Building2 className="size-32 text-mint" />
                                </div>
                                <div className="relative z-10">
                                    <div className="text-sm font-bold uppercase tracking-widest text-mint mb-3">Best Matched Scheme</div>
                                    <div className="mb-4">
                                        <SchemePill
                                            name={loanMutation.data.scheme.name}
                                            corporation={loanMutation.data.scheme.corporation}
                                            needsVerification={loanMutation.data.scheme.needsVerification}
                                        />
                                    </div>
                                    <p className="text-ink-muted text-sm leading-relaxed mb-6 max-w-xl">
                                        {loanMutation.data.scheme.description}
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="bg-cream rounded-xl px-4 py-3 border border-sage/30 min-w-[120px]">
                                            <div className="text-xs font-bold text-ink-muted uppercase mb-1">Interest Rate</div>
                                            <div className="text-xl font-bold text-forest">{loanMutation.data.scheme.interestRatePercent}% p.a.</div>
                                        </div>
                                        <div className="bg-cream rounded-xl px-4 py-3 border border-sage/30 min-w-[120px]">
                                            <div className="text-xs font-bold text-ink-muted uppercase mb-1">Moratorium</div>
                                            <div className="text-xl font-bold text-forest">{loanMutation.data.scheme.moratoriumMonths} Months</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* EMI Schedule */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-forest">Repayment Schedule</h3>
                                <button className="flex items-center gap-2 text-sm font-bold text-ink-muted hover:text-forest transition-colors">
                                    <Download className="size-4" /> Download PDF
                                </button>
                            </div>
                            <EmiScheduleTable schedule={loanMutation.data.schedule} />
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-sage/50 rounded-3xl bg-white/50 text-ink-muted">
                            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mb-6">
                                <Calculator className="size-10 text-sage" />
                            </div>
                            <h3 className="text-xl font-bold text-forest mb-2">Plan your borrowing</h3>
                            <p className="max-w-md mx-auto">Enter your required project cost on the left to instantly see available government schemes and generate a detailed month-by-month EMI schedule.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
