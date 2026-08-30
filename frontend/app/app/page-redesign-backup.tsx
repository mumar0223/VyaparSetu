"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, FileText, AlertCircle, Plus, Minus, Target, BrainCircuit, Activity, CheckCircle2, Sparkles, Wallet } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface DashboardData {
    user: { name: string };
    metrics: {
        revenue: number;
        expenses: number;
        balance: number;
        transactionsCount: number;
        topExpenseCategory: string;
    };
    alerts: Array<{
        id: string;
        type: "warning" | "info" | "success" | "destructive";
        title: string;
        message: string;
    }>;
}

export default function DashboardPage() {
    const { data, isLoading, isError } = useQuery<DashboardData>({
        queryKey: ["dashboard"],
        queryFn: async () => {
            try {
                return await apiClient.get<DashboardData>("/dashboard");
            } catch (err) {
                return {
                    user: { name: "Ramesh" },
                    metrics: {
                        revenue: 42000,
                        expenses: 27500,
                        balance: 14500,
                        transactionsCount: 18,
                        topExpenseCategory: "Raw Materials",
                    },
                    alerts: [
                        {
                            id: "1",
                            type: "warning",
                            title: "Your expenses are ₹3,200 higher than last month.",
                            message: "Most of the extra money went to Raw Materials.",
                        },
                        {
                            id: "2",
                            type: "info",
                            title: "Your loan payment of ₹4,500 is due in 5 days.",
                            message: "SBI Term Loan monthly installment.",
                        }
                    ]
                };
            }
        }
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl space-y-8 animate-pulse pt-4 px-4 sm:px-6">
                <div className="h-32 bg-sage/20 rounded-[2rem] w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-sage/20 rounded-[2rem]" />
                    <div className="h-64 bg-sage/20 rounded-[2rem]" />
                </div>
            </div>
        );
    }

    if (isError || !data) return <div className="text-red-500">Failed to load dashboard data.</div>;

    const { user, metrics, alerts } = data;

    return (
        <div className="mx-auto max-w-6xl space-y-8 pb-20 pt-4 px-4 sm:px-6">
            
            {/* Hero Welcome Banner */}
            <div className="bg-white p-8 rounded-[2rem] border border-sage/30 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-mint via-forest to-orange" />
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-forest tracking-tight mb-2">Welcome Back, {user?.name}</h2>
                    <p className="text-ink-muted font-medium flex items-center gap-2">
                        <Sparkles className="size-5 text-mint" />
                        <span className="text-forest font-bold">Your business is performing better than 72% of similar enterprises this month.</span>
                    </p>
                </div>
                <div className="relative z-10 shrink-0">
                    <div className="p-3 bg-mint-pale rounded-2xl border border-mint/20">
                        <Activity className="size-8 text-mint" />
                    </div>
                </div>
            </div>

            {/* Top Grid: Balance Hero & Health Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Hero Balance Card */}
                <div className="bg-forest p-8 rounded-[2rem] text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-mint/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 mb-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-white/70 uppercase tracking-widest mb-2">
                            <Wallet className="size-5 text-mint" /> Current Balance
                        </div>
                        <div className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                            ₹{metrics.balance.toLocaleString('en-IN')}
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-row gap-6 pt-6 border-t border-white/20">
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
                                <ArrowUpRight className="size-4 text-mint" /> Earned
                            </div>
                            <div className="text-xl md:text-2xl font-bold text-mint">
                                ₹{metrics.revenue.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div className="w-px bg-white/20" />
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
                                <ArrowDownRight className="size-4 text-orange" /> Spent
                            </div>
                            <div className="text-xl md:text-2xl font-bold text-orange">
                                ₹{metrics.expenses.toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Health Widget */}
                <div className="bg-white p-8 rounded-[2rem] border border-sage/30 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-sage/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-mint/10 rounded-xl border border-mint/20">
                                <Activity className="size-6 text-mint" />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-forest text-xl">Business Health</h3>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">AI Generated Score</p>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-forest bg-[#fdfbf7] px-4 py-2 rounded-xl border border-sage/40 shadow-sm">
                            86 <span className="text-lg text-ink-muted">/100</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Cash Flow</span>
                            <span className="font-bold text-mint flex items-center gap-1.5"><CheckCircle2 className="size-4" /> Healthy</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Credit Readiness</span>
                            <span className="font-bold text-forest flex items-center gap-1.5"><CheckCircle2 className="size-4 text-mint" /> Good</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Profile Completion</span>
                            <span className="font-bold text-forest flex items-center gap-1.5"><CheckCircle2 className="size-4 text-mint" /> 100%</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">AI Opportunities</span>
                            <span className="font-bold text-orange flex items-center gap-1.5"><Sparkles className="size-4" /> 3 Identified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions (4 Pills) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-white border border-sage/40 hover:border-mint hover:bg-mint-pale hover:-translate-y-1 text-forest font-bold py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 group">
                    <Plus className="size-5 text-mint group-hover:scale-110 transition-transform" /> Add Sale
                </button>
                <button className="bg-white border border-sage/40 hover:border-orange hover:bg-orange/5 hover:-translate-y-1 text-forest font-bold py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 group">
                    <Minus className="size-5 text-orange group-hover:scale-110 transition-transform" /> Log Expense
                </button>
                <button className="bg-white border border-sage/40 hover:border-mint hover:bg-mint-pale hover:-translate-y-1 text-forest font-bold py-4 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 group">
                    <Target className="size-5 text-purple-500 group-hover:scale-110 transition-transform" /> New Goal
                </button>
                <button className="bg-forest hover:bg-forest/90 hover:-translate-y-1 text-white font-bold py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group">
                    <BrainCircuit className="size-5 text-mint group-hover:scale-110 transition-transform" /> AI Advisor
                </button>
            </div>

            {/* Today's Snapshot & Alerts */}
            <div className="bg-[#fdfbf7] p-6 md:p-8 rounded-[2rem] border border-sage/30 shadow-sm space-y-8">
                
                {/* Snapshot Row */}
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-4">Today's Snapshot</h3>
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-white px-4 py-2.5 rounded-xl border border-sage/30 shadow-sm flex items-center gap-2">
                            <span className="text-xs font-bold text-ink-muted uppercase">Rev</span>
                            <span className="font-bold text-forest">₹42k</span>
                        </div>
                        <div className="bg-white px-4 py-2.5 rounded-xl border border-sage/30 shadow-sm flex items-center gap-2">
                            <span className="text-xs font-bold text-ink-muted uppercase">Exp</span>
                            <span className="font-bold text-forest">₹27.5k</span>
                        </div>
                        <div className="bg-mint-pale px-4 py-2.5 rounded-xl border border-mint/20 shadow-sm flex items-center gap-2">
                            <span className="text-xs font-bold text-forest uppercase">Net</span>
                            <span className="font-bold text-mint">₹14.5k</span>
                        </div>
                        <div className="bg-orange/10 px-4 py-2.5 rounded-xl border border-orange/20 shadow-sm flex items-center gap-2">
                            <span className="text-xs font-bold text-orange-hover uppercase">AI Insights</span>
                            <span className="font-bold text-orange-hover">3</span>
                        </div>
                        <div className="bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200 shadow-sm flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-700 uppercase">Schemes</span>
                            <span className="font-bold text-blue-700">4</span>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted mb-4">Smart Alerts</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "flex items-start gap-4 rounded-2xl border p-5 transition-all hover:shadow-md bg-white",
                                        alert.type === 'warning' && "border-orange/30 hover:border-orange",
                                        alert.type === 'info' && "border-mint/30 hover:border-mint",
                                        alert.type === 'destructive' && "border-red-200 hover:border-red-400",
                                    )}
                                >
                                    <div className={cn(
                                        "rounded-xl p-2.5 shrink-0",
                                        alert.type === 'warning' && "bg-orange/10 text-orange border border-orange/20",
                                        alert.type === 'info' && "bg-mint/10 text-mint border border-mint/20",
                                        alert.type === 'destructive' && "bg-red-100 text-red-600 border border-red-200",
                                    )}>
                                        {alert.type === 'info' ? <FileText className="size-5" /> : <AlertCircle className="size-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-forest leading-tight mb-1">
                                            {alert.title}
                                        </h4>
                                        <p className="text-sm font-medium text-ink-muted leading-relaxed">
                                            {alert.message}
                                        </p>
                                        <button className={cn(
                                            "mt-3 text-sm font-bold hover:underline",
                                            alert.type === 'warning' && "text-orange",
                                            alert.type === 'info' && "text-mint",
                                            alert.type === 'destructive' && "text-red-600",
                                        )}>
                                            See details &rarr;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
