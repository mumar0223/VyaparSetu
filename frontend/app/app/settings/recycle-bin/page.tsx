"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function RecycleBinPage() {
    const [items, setItems] = useState([
        { id: 1, type: "Expense", name: "Travel - Auto", amount: "₹150", deletedOn: "Today, 10:45 AM" },
        { id: 2, type: "Transaction", name: "Client Payment", amount: "₹4,200", deletedOn: "Yesterday, 2:00 PM" },
    ]);

    const handleRestore = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    return (
        <div className="mx-auto max-w-2xl space-y-8 pb-20 md:pb-0">

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/settings" className="text-sm font-semibold text-blue-600 hover:underline">Settings</Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-sm text-slate-500">Recycle Bin</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recycle Bin</h2>
                <p className="text-sm text-slate-500">Restore or permanently delete removed items</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-slate-100 p-4 text-slate-400 mb-4">
                            <Trash2 className="size-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Bin is empty</h3>
                        <p className="text-sm text-slate-500 mt-1">No recently deleted items.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                            {item.type}
                                        </span>
                                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                        <span className="font-semibold text-slate-700">{item.amount}</span>
                                        <span>•</span>
                                        <span>Deleted {item.deletedOn}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRestore(item.id)}
                                    className="flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <RotateCcw className="size-4" /> Restore
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
