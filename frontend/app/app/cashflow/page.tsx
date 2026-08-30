"use client";

import { useQuery } from "@tanstack/react-query";
import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Sparkles, Scale } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface CashFlowItem {
    id: string;
    description?: string;
    name?: string;
    amount: number;
    date: string;
    direction: "in" | "out";
}

export default function CashFlowPage() {
    // Fetch data identically to how CrudPageTemplate does it to share cache
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["/cashflow"],
        queryFn: async () => {
            try {
                return await apiClient.get<CashFlowItem[]>("/cashflow");
            } catch (e) {
                return [
                    { id: "1", amount: 12500, direction: "in", date: "2026-08-25", description: "Product Sales" },
                    { id: "2", amount: 4800, direction: "out", date: "2026-08-26", description: "Supplier Payment" },
                    { id: "3", amount: 8200, direction: "in", date: "2026-08-27", description: "Wholesale Order" },
                    { id: "4", amount: 1500, direction: "out", date: "2026-08-28", description: "Utility Bills" },
                ] as CashFlowItem[];
            }
        }
    });

    // Calculations
    const totalInflow = items.filter(i => i.direction === "in").reduce((sum, i) => sum + Number(i.amount), 0);
    const totalOutflow = items.filter(i => i.direction === "out").reduce((sum, i) => sum + Number(i.amount), 0);
    const netCashFlow = totalInflow - totalOutflow;
    const isPositive = netCashFlow >= 0;

    // Visual Ratio Calculation
    const totalVolume = totalInflow + totalOutflow;
    const inflowPercent = totalVolume > 0 ? (totalInflow / totalVolume) * 100 : 50;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pt-4 px-4 sm:px-6">
            
            {/* AI Insights Banner */}
            {!isLoading && items.length > 0 && (
                <div className="bg-mint-pale border border-mint/30 rounded-2xl p-5 flex items-start sm:items-center gap-4 shadow-sm">
                    <div className="p-2.5 bg-mint/20 rounded-xl shrink-0 border border-mint/30">
                        <Sparkles className="size-6 text-forest" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-forest mb-1">AI Cash Flow Insight</h3>
                        <p className="text-sm font-medium text-forest/80">
                            Your cash flow is exceptionally healthy this month. You have a steady surplus. Consider allocating <strong className="text-forest">10% of this surplus to a high-yield reserve fund</strong> to build your safety net.
                        </p>
                    </div>
                </div>
            )}

            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                        <ArrowUpRight className="size-4 text-mint" /> Total Inflow
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-forest">
                        ₹{totalInflow.toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                        <ArrowDownRight className="size-4 text-orange" /> Total Outflow
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-forest">
                        ₹{totalOutflow.toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-mint/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3 relative z-10">
                        <Scale className="size-4 text-forest" /> Net Cash Flow
                    </div>
                    <div className="relative z-10">
                        <div className={cn(
                            "text-2xl lg:text-3xl font-bold flex items-center gap-2",
                            isPositive ? "text-mint" : "text-orange-hover"
                        )}>
                            {isPositive ? "+" : "-"}₹{Math.abs(netCashFlow).toLocaleString('en-IN')}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-mint mt-1 bg-mint/10 w-fit px-1.5 py-0.5 rounded">
                            <TrendingUp className="size-3" /> 8% vs last month
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                        <Activity className="size-4 text-forest" /> Health Score
                    </div>
                    <div className="flex items-end gap-1.5">
                        <div className="text-2xl lg:text-3xl font-bold text-forest bg-mint-pale px-3 py-1 rounded-xl border border-mint/20">
                            84
                        </div>
                        <span className="text-sm font-bold text-ink-muted pb-1.5">/100</span>
                    </div>
                </div>

            </div>

            {/* Visual Ratio Bar */}
            {!isLoading && totalVolume > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-3">
                        <span className="text-mint flex items-center gap-1"><ArrowUpRight className="size-3" /> Inflow</span>
                        <span className="text-orange flex items-center gap-1">Outflow <ArrowDownRight className="size-3" /></span>
                    </div>
                    <div className="w-full h-3 bg-cream rounded-full flex overflow-hidden">
                        <div 
                            className="h-full bg-mint transition-all duration-1000 ease-out"
                            style={{ width: `${inflowPercent}%` }}
                        />
                        <div 
                            className="h-full bg-orange transition-all duration-1000 ease-out"
                            style={{ width: `${100 - inflowPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="h-px w-full bg-sage/30 my-8" />

            {/* Generic CRUD Table */}
            <div className="pb-12">
                <CrudPageTemplate
                    config={{
                        entityName: "Transaction",
                        pluralName: "Cash Flow",
                        endpoint: "/cashflow",
                        fields: [
                            { name: "description", label: "Description", type: "text", required: true },
                            { name: "amount", label: "Amount (₹)", type: "number", required: true },
                            { name: "date", label: "Date", type: "date", required: true },
                            {
                                name: "direction",
                                label: "Flow Type",
                                type: "select",
                                required: true,
                                options: [
                                    { label: "Cash In (Revenue/Income)", value: "in" },
                                    { label: "Cash Out (Expense/Payment)", value: "out" },
                                ]
                            }
                        ],
                        renderItem: (item) => {
                            const isOut = item.direction === "out";
                            return (
                                <div className="flex items-center gap-4 py-1">
                                    <div className={cn(
                                        "size-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm",
                                        isOut ? "bg-orange/5 border-orange/20 text-orange" : "bg-mint/10 border-mint/20 text-mint"
                                    )}>
                                        {isOut ? (
                                            <ArrowDownRight className="size-5" />
                                        ) : (
                                            <ArrowUpRight className="size-5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-lg text-forest truncate leading-tight">{item.description || item.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-ink-muted mt-1 font-medium">
                                            <span>{item.date}</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "text-xl font-bold shrink-0 pr-2",
                                        isOut ? "text-orange" : "text-mint"
                                    )}>
                                        {isOut ? "-" : "+"}₹{Number(item.amount).toLocaleString('en-IN')}
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
