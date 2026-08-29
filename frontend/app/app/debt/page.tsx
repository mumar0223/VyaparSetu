"use client";

import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { HandCoins } from "lucide-react";

export default function DebtPage() {
    return (
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
                    return (
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-orange/10 rounded-full flex items-center justify-center shrink-0">
                                <HandCoins className="size-6 text-orange-hover" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-forest">{item.lender || item.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-ink-muted">
                                    <span>Next EMI: <strong className="text-orange-hover">{item.dueDate}</strong></span>
                                </div>
                            </div>
                            <div className="text-right pr-4">
                                <div className="text-xl font-bold text-forest">₹{Number(item.remainingAmount || 0).toLocaleString('en-IN')}</div>
                                <div className="text-xs text-ink-muted">left of ₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}</div>
                            </div>
                        </div>
                    );
                }
            }}
        />
    );
}
