"use client";

import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { PieChart, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BudgetPage() {
    return (
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
                    const isOver = progress >= 90;
                    const isExceeded = progress >= 100;

                    return (
                        <div className="flex flex-col w-full px-2 gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "size-12 rounded-full flex items-center justify-center shrink-0",
                                    isExceeded ? "bg-red-100" : isOver ? "bg-orange/20" : "bg-sage/30"
                                )}>
                                    {isExceeded || isOver ? (
                                        <AlertCircle className={cn("size-6", isExceeded ? "text-red-600" : "text-orange-hover")} />
                                    ) : (
                                        <PieChart className="size-6 text-forest" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-forest">
                                        {item.category || item.title}
                                    </h4>
                                    <div className="flex justify-between items-end mt-1 text-sm font-bold text-ink">
                                        <span className={cn(isExceeded && "text-red-600")}>
                                            ₹{spent.toLocaleString('en-IN')} spent
                                        </span>
                                        <span className="text-ink-muted">limit ₹{limit.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full bg-sage/20 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        isExceeded ? "bg-red-500" : isOver ? "bg-orange" : "bg-mint"
                                    )}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    );
                }
            }}
        />
    );
}
