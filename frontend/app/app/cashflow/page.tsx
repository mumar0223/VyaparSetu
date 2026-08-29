"use client";

import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CashFlowPage() {
    return (
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
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "size-12 rounded-full flex items-center justify-center shrink-0",
                                isOut ? "bg-orange/10" : "bg-mint-pale"
                            )}>
                                {isOut ? (
                                    <ArrowDownRight className="size-6 text-orange" />
                                ) : (
                                    <ArrowUpRight className="size-6 text-mint" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-forest">{item.description || item.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-ink-muted">
                                    <span>{item.date}</span>
                                </div>
                            </div>
                            <div className={cn(
                                "ml-auto text-xl font-bold pr-4",
                                isOut ? "text-ink" : "text-mint"
                            )}>
                                {isOut ? "-" : "+"}₹{Number(item.amount).toLocaleString('en-IN')}
                            </div>
                        </div>
                    );
                }
            }}
        />
    );
}
