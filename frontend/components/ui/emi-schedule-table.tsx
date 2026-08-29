"use client";

import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export interface EmiScheduleRow {
    month: number;
    isMoratorium: boolean;
    principalPaid: number;
    interestPaid: number;
    totalEmi: number;
    remainingBalance: number;
}

interface EmiScheduleTableProps {
    schedule: EmiScheduleRow[];
}

export function EmiScheduleTable({ schedule }: EmiScheduleTableProps) {
    return (
        <div className="w-full bg-white rounded-2xl border border-sage/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-cream border-b border-sage/30">
                            <th className="py-4 px-6 text-xs font-bold text-forest uppercase tracking-wider">Month</th>
                            <th className="py-4 px-6 text-xs font-bold text-forest uppercase tracking-wider">Principal</th>
                            <th className="py-4 px-6 text-xs font-bold text-forest uppercase tracking-wider">Interest</th>
                            <th className="py-4 px-6 text-xs font-bold text-forest uppercase tracking-wider">EMI</th>
                            <th className="py-4 px-6 text-xs font-bold text-forest uppercase tracking-wider">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/20 text-sm md:text-base">
                        {schedule.map((row) => (
                            <tr
                                key={row.month}
                                className={cn(
                                    "transition-colors",
                                    row.isMoratorium ? "bg-cream/50 text-ink-muted" : "bg-white text-ink hover:bg-sage/5"
                                )}
                            >
                                <td className="py-4 px-6 font-medium">
                                    <div className="flex items-center gap-3">
                                        <span>{row.month}</span>
                                        {row.isMoratorium && (
                                            <span className="inline-flex items-center gap-1 bg-orange/10 text-orange-hover text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-orange/20">
                                                <Info className="size-3" />
                                                Moratorium
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 px-6">₹{row.principalPaid.toLocaleString('en-IN')}</td>
                                <td className="py-4 px-6">₹{row.interestPaid.toLocaleString('en-IN')}</td>
                                <td className={cn("py-4 px-6 font-bold", !row.isMoratorium && "text-forest")}>
                                    ₹{row.totalEmi.toLocaleString('en-IN')}
                                </td>
                                <td className="py-4 px-6 text-ink-muted">₹{row.remainingBalance.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
