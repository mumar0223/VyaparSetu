"use client";

import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { ArrowDownRight } from "lucide-react";

export default function ExpensesPage() {
    return (
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
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-orange/10 rounded-full flex items-center justify-center shrink-0">
                            <ArrowDownRight className="size-6 text-orange" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-forest">{item.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-ink-muted">
                                <span>{item.date}</span>
                                <span>•</span>
                                <span className="font-medium px-2 py-0.5 bg-sage/20 rounded-full text-xs">
                                    {item.category}
                                </span>
                            </div>
                        </div>
                        <div className="ml-auto text-xl font-bold text-forest pr-4">
                            ₹{Number(item.amount).toLocaleString('en-IN')}
                        </div>
                    </div>
                )
            }}
        />
    );
}
