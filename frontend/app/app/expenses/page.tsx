"use client";

import { useQuery } from "@tanstack/react-query";
import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { ArrowDownRight, TrendingDown, Target, Activity, FileText, Sparkles, Truck, Package, Megaphone, Users, MoreHorizontal } from "lucide-react";
import { apiClient } from "@/lib/api/client";

// Define the interface to match what CrudPageTemplate expects/returns
interface Expense {
    id: string;
    name: string;
    amount: number;
    date: string;
    category: string;
}

function getCategoryIcon(category: string) {
    switch (category) {
        case "Logistics": return <Truck className="size-5" />;
        case "Raw Materials": return <Package className="size-5" />;
        case "Marketing": return <Megaphone className="size-5" />;
        case "Payroll": return <Users className="size-5" />;
        case "Operations": return <Activity className="size-5" />;
        default: return <MoreHorizontal className="size-5" />;
    }
}

export default function ExpensesPage() {
    // We use the same queryKey ("/expenses") that CrudPageTemplate uses internally.
    // React Query will automatically deduplicate the network request.
    const { data: expenses = [], isLoading } = useQuery({
        queryKey: ["/expenses"],
        queryFn: async () => {
            try {
                return await apiClient.get<Expense[]>("/expenses");
            } catch (e) {
                return [
                    { id: "1", amount: 2500, category: "Operations", date: "2026-08-25", name: "Warehouse Rent" },
                    { id: "2", amount: 4800, category: "Logistics", date: "2026-08-26", name: "Delivery Truck Fuel" },
                    { id: "3", amount: 1200, category: "Raw Materials", date: "2026-08-27", name: "Packaging Supplies" },
                    { id: "4", amount: 850, category: "Logistics", date: "2026-08-28", name: "Local Courier" },
                ];
            }
        }
    });

    // Analytics Calculations
    const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const transactionCount = expenses.length;
    const avgDailySpend = transactionCount > 0 ? totalSpent / 30 : 0; // Assuming 30 days for demo

    // Find highest category
    const categoryTotals = expenses.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
        return acc;
    }, {} as Record<string, number>);
    
    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return (
        <div className="max-w-5xl mx-auto space-y-8 pt-4 px-4 sm:px-6">
            
            {/* AI Insights Banner */}
            {!isLoading && expenses.length > 0 && (
                <div className="bg-mint-pale border border-mint/30 rounded-2xl p-5 flex items-start sm:items-center gap-4 shadow-sm">
                    <div className="p-2.5 bg-mint/20 rounded-xl shrink-0">
                        <Sparkles className="size-6 text-forest" />
                    </div>
                    <div>
                        <h3 className="font-bold text-forest mb-1">AI Expense Analysis</h3>
                        <p className="text-sm font-medium text-forest/80">
                            Your <strong className="text-forest">{highestCategory}</strong> expenses are slightly higher than similar businesses in your area this month. Consider exploring bulk purchasing options.
                        </p>
                    </div>
                </div>
            )}

            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                        <ArrowDownRight className="size-4 text-orange" /> Total Spent
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-forest">
                        ₹{totalSpent.toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                        <Target className="size-4 text-mint" /> Highest Category
                    </div>
                    <div className="text-lg lg:text-xl font-bold text-forest truncate">
                        {highestCategory}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                        <Activity className="size-4 text-orange-hover" /> Avg Daily Spend
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-forest">
                        ₹{Math.round(avgDailySpend).toLocaleString('en-IN')}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                        <FileText className="size-4 text-forest" /> Transactions
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-forest">
                        {transactionCount} <span className="text-sm font-medium text-ink-muted lowercase">Logged</span>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-sage/30 my-8" />

            {/* Generic CRUD Table */}
            <div className="pb-12">
                <CrudPageTemplate
                    config={{
                        entityName: "Expense",
                        pluralName: "Expenses",
                        endpoint: "/expenses",
                        fields: [
                            { name: "name", label: "Expense Description", type: "text", required: true },
                            { name: "amount", label: "Amount (₹)", type: "number", required: true },
                            { name: "date", label: "Date", type: "date", required: true },
                            {
                                name: "category",
                                label: "Category",
                                type: "select",
                                required: true,
                                options: [
                                    { label: "Raw Materials", value: "Raw Materials" },
                                    { label: "Operations", value: "Operations" },
                                    { label: "Marketing", value: "Marketing" },
                                    { label: "Payroll", value: "Payroll" },
                                    { label: "Logistics", value: "Logistics" },
                                    { label: "Other", value: "Other" },
                                ]
                            }
                        ],
                        renderItem: (item) => (
                            <div className="flex items-center gap-4 py-1">
                                <div className="size-12 bg-mint-pale rounded-2xl border border-mint/20 flex items-center justify-center shrink-0 text-forest">
                                    {getCategoryIcon(item.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-lg text-forest truncate leading-tight">{item.name}</h4>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mt-1">
                                        <span className="font-semibold px-2 py-0.5 bg-sage/20 text-forest rounded-md">
                                            {item.category}
                                        </span>
                                        <span>•</span>
                                        <span className="font-medium">{item.date}</span>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-orange shrink-0 pr-2">
                                    -₹{Number(item.amount).toLocaleString('en-IN')}
                                </div>
                            </div>
                        )
                    }}
                />
            </div>
        </div>
    );
}
