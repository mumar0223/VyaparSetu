"use client";

import { useQuery } from "@tanstack/react-query";
import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { PieChart, AlertCircle, ArrowRightLeft, Target, Wallet, ArrowDownRight, CheckCircle2, Zap } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface BudgetItem {
    id: string;
    category: string;
    limitAmount: number;
    spentAmount: number;
}

export default function BudgetPage() {
    const { data: budgets = [], isLoading } = useQuery({
        queryKey: ["/budgets"],
        queryFn: async () => {
            try {
                return await apiClient.get<BudgetItem[]>("/budgets");
            } catch (e) {
                return [
                    { id: "1", category: "Marketing", limitAmount: 30000, spentAmount: 28500 },
                    { id: "2", category: "Operations", limitAmount: 50000, spentAmount: 31000 },
                    { id: "3", category: "Raw Materials", limitAmount: 80000, spentAmount: 25000 },
                ] as BudgetItem[];
            }
        }
    });

    // Calculations
    const totalAllocated = budgets.reduce((sum, item) => sum + Number(item.limitAmount), 0);
    const totalSpent = budgets.reduce((sum, item) => sum + Number(item.spentAmount), 0);
    const totalRemaining = totalAllocated - totalSpent;
    const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    const isOverallHealthy = overallUtilization < 85;

    // SVG Circle Math
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (overallUtilization / 100) * circumference;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pt-4 px-4 sm:px-6">
            
            {/* Top Grid: Hero Health Card & Mini Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Hero Health Card */}
                <div className="lg:col-span-2 bg-forest rounded-[2rem] p-8 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-mint/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-2 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-white/70 uppercase tracking-widest mb-4">
                            <Target className="size-5 text-mint" /> Budget Health
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                            {Math.round(overallUtilization)}% Utilized
                        </h2>
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mt-2",
                            isOverallHealthy ? "bg-mint/20 text-mint" : "bg-orange/20 text-orange"
                        )}>
                            {isOverallHealthy ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                            {isOverallHealthy ? "ON TRACK" : "AT RISK"}
                        </div>
                    </div>

                    {/* Circular Progress Ring */}
                    <div className="relative z-10 shrink-0">
                        <svg className="transform -rotate-90 size-32 drop-shadow-md">
                            <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                            <circle 
                                cx="64" cy="64" r={radius} 
                                stroke="currentColor" strokeWidth="12" fill="transparent" 
                                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                                className={isOverallHealthy ? "text-mint" : "text-orange"}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-white">
                            {Math.round(overallUtilization)}%
                        </div>
                    </div>
                </div>

                {/* Smaller Metrics Column */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-sage/30 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sage/20 rounded-lg"><Wallet className="size-5 text-forest" /></div>
                            <div>
                                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Total Allocated</p>
                                <p className="font-bold text-forest text-lg">₹{totalAllocated.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-sage/30 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange/10 rounded-lg"><ArrowDownRight className="size-5 text-orange" /></div>
                            <div>
                                <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Total Spent</p>
                                <p className="font-bold text-forest text-lg">₹{totalSpent.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-mint-pale p-4 rounded-2xl border border-mint/20 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-mint/20 rounded-lg"><Target className="size-5 text-mint" /></div>
                            <div>
                                <p className="text-[10px] font-bold text-forest uppercase tracking-wider">Remaining</p>
                                <p className="font-bold text-forest text-lg">₹{totalRemaining.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Risk Alerts */}
            {!isLoading && budgets.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-3">Category Risk Alerts</h3>
                    <div className="flex flex-wrap gap-3">
                        {budgets.map(item => {
                            const util = Math.min(100, (Number(item.spentAmount) / Number(item.limitAmount)) * 100);
                            const isDanger = util >= 90;
                            const isWarning = util >= 75 && util < 90;
                            
                            return (
                                <div key={item.id} className={cn(
                                    "px-4 py-2.5 rounded-xl border flex items-center gap-2 shadow-sm bg-white",
                                    isDanger && "border-orange/30",
                                    isWarning && "border-yellow-400/30",
                                    !isDanger && !isWarning && "border-mint/30"
                                )}>
                                    <span className="text-base">
                                        {isDanger ? "⚠️" : isWarning ? "⚡" : "✅"}
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-forest leading-none mb-0.5">{item.category}</p>
                                        <p className="text-[10px] font-bold text-ink-muted uppercase">{Math.round(util)}% utilized</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recommended Reallocation Banner */}
            {!isLoading && budgets.length > 0 && (
                <div className="bg-[#fdfbf7] border border-sage/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange" />
                    <div className="p-2.5 bg-white shadow-sm rounded-xl shrink-0 text-orange border border-sage/20 ml-2">
                        <ArrowRightLeft className="size-6" />
                    </div>
                    <div className="flex-1 ml-1 sm:ml-0">
                        <h3 className="font-bold text-forest text-lg mb-1 flex items-center gap-2">
                            Recommended Reallocation <span className="bg-mint/20 text-mint text-[10px] px-2 py-0.5 rounded-full uppercase">AI Insight</span>
                        </h3>
                        <p className="text-sm font-medium text-ink-muted leading-relaxed">
                            Move <strong className="text-forest">₹5,000</strong> from <strong className="text-forest">Operations</strong> to <strong className="text-forest">Marketing</strong> to avoid a budget overrun next month. Operations currently has a safe surplus.
                        </p>
                    </div>
                    <button className="bg-white border border-sage/40 hover:border-mint hover:bg-mint-pale text-forest font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm shrink-0 active:scale-95 ml-2 sm:ml-0">
                        Apply Fix
                    </button>
                </div>
            )}

            {/* Divider */}
            <div className="h-px w-full bg-sage/30 my-8" />

            {/* Generic CRUD Table */}
            <div className="pb-12">
                <CrudPageTemplate
                    config={{
                        entityName: "Budget Limit",
                        pluralName: "Budgets",
                        endpoint: "/budgets",
                        fields: [
                            { name: "category", label: "Category", type: "text", required: true },
                            { name: "limitAmount", label: "Monthly Limit (₹)", type: "number", required: true },
                            { name: "spentAmount", label: "Currently Spent (₹)", type: "number", required: true },
                        ],
                        renderItem: (item) => {
                            const limit = Number(item.limitAmount) || 1;
                            const spent = Number(item.spentAmount) || 0;
                            const progress = Math.min(100, (spent / limit) * 100);
                            const isExceeded = progress >= 100;
                            const isNearLimit = progress >= 85 && progress < 100;

                            return (
                                <div className="flex flex-col w-full p-2 gap-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2.5 rounded-xl border flex items-center justify-center",
                                                isExceeded ? "bg-red-50 border-red-200 text-red-600" : isNearLimit ? "bg-orange/5 border-orange/20 text-orange" : "bg-mint-pale border-mint/20 text-mint"
                                            )}>
                                                <PieChart className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-forest leading-tight">
                                                    {item.category || item.title}
                                                </h4>
                                                {isExceeded ? (
                                                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded-md mt-1 inline-block">Over Budget</span>
                                                ) : isNearLimit ? (
                                                    <span className="text-[10px] font-bold text-orange uppercase tracking-wider bg-orange/10 px-2 py-0.5 rounded-md mt-1 inline-block">Near Limit</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-mint uppercase tracking-wider bg-mint/10 px-2 py-0.5 rounded-md mt-1 inline-block">On Track</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-forest text-lg">
                                                ₹{spent.toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-xs font-bold text-ink-muted uppercase">
                                                / ₹{limit.toLocaleString('en-IN')} Limit
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Visual Progress Bar */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-sage/20 rounded-full h-3 overflow-hidden border border-sage/30 shadow-inner">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                                    isExceeded ? "bg-red-500" : isNearLimit ? "bg-orange" : "bg-mint"
                                                )}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-forest w-10 text-right">{Math.round(progress)}%</span>
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
