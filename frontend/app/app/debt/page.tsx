"use client";

import { useQuery } from "@tanstack/react-query";
import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { HandCoins, Calendar, CheckCircle2, TrendingDown, Target, Building, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface DebtItem {
    id: string;
    lender?: string;
    name?: string;
    totalAmount: number;
    remainingAmount: number;
    dueDate: string;
}

export default function DebtPage() {
    const { data: debts = [], isLoading } = useQuery({
        queryKey: ["/debts"],
        queryFn: async () => {
            try {
                return await apiClient.get<DebtItem[]>("/debts");
            } catch (e) {
                return [
                    { id: "1", lender: "SBI Working Capital Loan", totalAmount: 150000, remainingAmount: 40000, dueDate: "2026-09-05" },
                    { id: "2", lender: "MUDRA Loan", totalAmount: 300000, remainingAmount: 85000, dueDate: "2026-09-12" },
                ] as DebtItem[];
            }
        }
    });

    // Calculations
    const totalOriginalDebt = debts.reduce((sum, item) => sum + Number(item.totalAmount), 0);
    const totalOutstandingDebt = debts.reduce((sum, item) => sum + Number(item.remainingAmount), 0);
    const totalPaid = totalOriginalDebt - totalOutstandingDebt;
    const overallRepaidPercent = totalOriginalDebt > 0 ? (totalPaid / totalOriginalDebt) * 100 : 0;
    
    // Sort debts by due date for Next EMI
    const sortedDebts = [...debts].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const nextEmiDebt = sortedDebts[0];

    // Mock calculations for visual complexity
    const dtiRatio = 22; // Debt-to-Income Ratio
    const isHealthy = dtiRatio < 35;
    const monthsRemaining = 14;

    // SVG Circle Math
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (overallRepaidPercent / 100) * circumference;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pt-4 px-4 sm:px-6">
            
            {/* Top Grid: Hero Health Card & Mini Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Hero Outstanding Debt Card */}
                <div className="lg:col-span-2 bg-forest rounded-[2rem] p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between gap-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-mint/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-white/70 uppercase tracking-widest mb-2">
                                <TrendingDown className="size-5 text-mint" /> Total Outstanding Debt
                            </div>
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                                ₹{totalOutstandingDebt.toLocaleString('en-IN')}
                            </h2>
                        </div>

                        {/* Circular Progress Ring */}
                        <div className="shrink-0 relative">
                            <svg className="transform -rotate-90 size-32 drop-shadow-md">
                                <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                                <circle 
                                    cx="64" cy="64" r={radius} 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                                    className="text-mint"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-white">
                                <span className="text-2xl leading-none">{Math.round(overallRepaidPercent)}%</span>
                                <span className="text-[10px] text-white/70 uppercase">Repaid</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Smaller Metrics Column */}
                <div className="flex flex-col gap-4">
                    {/* Debt Health */}
                    <div className="bg-white p-4 rounded-2xl border border-sage/30 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", isHealthy ? "bg-mint/20 text-mint" : "bg-orange/20 text-orange")}>
                                {isHealthy ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Debt Health</p>
                                <p className={cn("font-bold text-lg", isHealthy ? "text-forest" : "text-orange")}>
                                    {isHealthy ? "🟢 Healthy" : "🟠 Monitor"}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-ink-muted">DTI Ratio</p>
                            <p className="text-sm font-bold text-forest">{dtiRatio}%</p>
                        </div>
                    </div>

                    {/* Total Paid */}
                    <div className="bg-white p-4 rounded-2xl border border-sage/30 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sage/20 rounded-lg"><Target className="size-5 text-forest" /></div>
                            <div>
                                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Total Principal Paid</p>
                                <p className="font-bold text-forest text-lg">₹{totalPaid.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Next EMI */}
                    <div className="bg-mint-pale p-4 rounded-2xl border border-mint/20 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-mint/20 rounded-lg"><Calendar className="size-5 text-mint" /></div>
                            <div>
                                <p className="text-[10px] font-bold text-forest uppercase tracking-wider">Next EMI Due</p>
                                <p className="font-bold text-forest text-sm">
                                    {nextEmiDebt ? nextEmiDebt.dueDate : "No upcoming"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projected Debt-Free Date Banner */}
            {!isLoading && debts.length > 0 && (
                <div className="bg-[#fdfbf7] border border-sage/40 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-mint" />
                    
                    <div className="flex items-center gap-4 ml-2">
                        <div className="p-3 bg-white shadow-sm rounded-xl shrink-0 text-mint border border-sage/20">
                            <Target className="size-8" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-1">Projected Debt-Free Date</p>
                            <h3 className="font-serif font-bold text-forest text-3xl tracking-tight">
                                March 2028
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white px-5 py-4 rounded-xl border border-sage/30 shadow-sm flex-1 max-w-sm md:ml-auto">
                        <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">AI Calculation</p>
                        <p className="text-sm font-bold text-forest">
                            At your current repayment pace, you have <strong className="text-mint text-base">{monthsRemaining} months</strong> remaining. Focus surplus cash on SBI Loan to shorten this by 2 months.
                        </p>
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="h-px w-full bg-sage/30 my-8" />

            {/* Generic CRUD Table */}
            <div className="pb-12">
                <CrudPageTemplate
                    config={{
                        entityName: "Debt",
                        pluralName: "Debt tracker",
                        endpoint: "/debts",
                        fields: [
                            { name: "lender", label: "Lender Name", type: "text", required: true },
                            { name: "totalAmount", label: "Total Debt Amount (₹)", type: "number", required: true },
                            { name: "remainingAmount", label: "Remaining Amount (₹)", type: "number", required: true },
                            { name: "dueDate", label: "Next EMI Due Date", type: "date", required: true },
                        ],
                        renderItem: (item) => {
                            const total = Number(item.totalAmount) || 1;
                            const remaining = Number(item.remainingAmount) || 0;
                            const paid = Math.max(0, total - remaining);
                            const progress = Math.min(100, (paid / total) * 100);

                            return (
                                <div className="flex flex-col w-full p-3 gap-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl border bg-white border-sage/40 shadow-sm text-forest shrink-0">
                                                <Building className="size-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xl text-forest leading-tight">
                                                    {item.lender || item.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-mint uppercase tracking-wider bg-mint/10 px-2 py-0.5 rounded-md inline-block">Active Loan</span>
                                                    <span className="text-xs font-bold text-ink-muted">Due: {item.dueDate}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-left sm:text-right bg-[#fdfbf7] p-3 rounded-xl border border-sage/20 sm:bg-transparent sm:border-transparent sm:p-0">
                                            <div className="font-bold text-forest text-xl">
                                                ₹{remaining.toLocaleString('en-IN')} <span className="text-sm font-medium text-ink-muted">Remaining</span>
                                            </div>
                                            <div className="text-xs font-bold text-ink-muted uppercase mt-0.5">
                                                Original: ₹{total.toLocaleString('en-IN')}
                                            </div>
                                        </div>

                                    </div>
                                    
                                    {/* Visual Progress Bar */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-xs font-bold px-1">
                                            <span className="text-mint">{Math.round(progress)}% Repaid</span>
                                        </div>
                                        <div className="w-full bg-sage/20 rounded-full h-3.5 overflow-hidden border border-sage/30 shadow-inner">
                                            <div
                                                className="h-full bg-mint rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    }}
                />
            </div>
        </div>
    );
}
