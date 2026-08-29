"use client";

import { CrudPageTemplate } from "@/components/ui/crud-page-template";
import { Target, TrendingUp } from "lucide-react";

export default function SavingsPage() {
    return (
        <CrudPageTemplate
            config={{
                entityName: "Goal",
                pluralName: "Savings Goals",
                endpoint: "/savings-goals",
                fields: [
                    { name: "title", label: "Goal Title", type: "text", required: true },
                    { name: "targetAmount", label: "Target Amount (₹)", type: "number", required: true },
                    { name: "currentSaved", label: "Current Saved (₹)", type: "number", required: true },
                    { name: "targetDate", label: "Target Date", type: "date", required: true },
                ],
                renderItem: (item) => {
                    const target = Number(item.targetAmount) || 1;
                    const saved = Number(item.currentSaved) || 0;
                    const progress = Math.min(100, (saved / target) * 100);

                    return (
                        <div className="flex flex-col w-full px-2 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 bg-mint-pale rounded-full flex items-center justify-center shrink-0">
                                    <Target className="size-6 text-mint" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-forest flex items-center justify-between">
                                        {item.title || item.name}
                                        <span className="text-sm font-medium text-ink-muted">
                                            Target: {item.targetDate}
                                        </span>
                                    </h4>
                                    <div className="flex justify-between items-end mt-1 text-sm font-bold text-ink">
                                        <span>₹{saved.toLocaleString('en-IN')} saved</span>
                                        <span className="text-ink-muted">of ₹{target.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full bg-sage/20 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-mint h-full rounded-full transition-all duration-1000"
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
