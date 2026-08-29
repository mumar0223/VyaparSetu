"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Plus, Calendar } from "lucide-react";

export default function TransactionsPage() {
    const [isAdding, setIsAdding] = useState(false);
    const [flowType, setFlowType] = useState<"in" | "out">("out");

    // In a real app we'd load this from Backend
    const transactions = [
        { id: 1, type: "out", amount: 150, category: "Travel", desc: "Auto", date: "Today" },
        { id: 2, type: "out", amount: 4200, category: "Stock", desc: "Inventory from supplier", date: "Yesterday" },
        { id: 3, type: "in", amount: 5500, category: "Sales", desc: "Cash sales", date: "Yesterday" },
    ];

    if (isAdding) {
        return (
            <div className="mx-auto max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Add transaction</h2>
                    <button onClick={() => setIsAdding(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                </div>

                <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-900">What happened?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFlowType("in")}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-colors ${flowType === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                            >
                                <ArrowUpRight className="size-6" />
                                <span className="font-semibold">Money came in</span>
                            </button>
                            <button
                                onClick={() => setFlowType("out")}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-colors ${flowType === "out" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                            >
                                <ArrowDownRight className="size-6" />
                                <span className="font-semibold">Money went out</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-900">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-slate-400">₹</span>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-lg font-semibold text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-900">Category</label>
                        <select className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                            <option value="">Select category...</option>
                            {flowType === "out" ? (
                                <>
                                    <option>Food</option>
                                    <option>Rent</option>
                                    <option>Stock</option>
                                    <option>Travel</option>
                                    <option>Salary</option>
                                    <option>Bills</option>
                                    <option>Other</option>
                                </>
                            ) : (
                                <>
                                    <option>Sales</option>
                                    <option>Service</option>
                                    <option>Other</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <select className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                                    <option>Today</option>
                                    <option>Yesterday</option>
                                    <option>Custom date</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-900">Description (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Milk"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700">
                            Save transaction
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-8 pb-20 md:pb-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transactions</h2>
                    <p className="text-sm text-slate-500">Your recent financial activity</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    <Plus className="size-4" /> Add
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <select className="bg-transparent text-sm font-semibold text-slate-700 outline-none">
                        <option>All transactions</option>
                        <option>Money in</option>
                        <option>Money out</option>
                    </select>
                    <select className="bg-transparent text-sm font-semibold text-slate-700 outline-none">
                        <option>This month</option>
                        <option>Last month</option>
                    </select>
                </div>

                <div className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`flex size-10 flex-shrink-0 items-center justify-center rounded-full ${t.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {t.type === 'in' ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">{t.category}</div>
                                    <div className="text-xs text-slate-500">{t.date} • {t.desc}</div>
                                </div>
                            </div>
                            <div className={`font-bold ${t.type === 'in' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {t.type === 'in' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
