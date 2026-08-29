"use client";

import { Download, Trash2, Key, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PrivacyPage() {
    const [dataSharing, setDataSharing] = useState(false);

    return (
        <div className="mx-auto max-w-2xl space-y-8 pb-20 md:pb-0">

            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/settings" className="text-sm font-semibold text-blue-600 hover:underline">Settings</Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-sm text-slate-500">Privacy</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Privacy & Security</h2>
                <p className="text-sm text-slate-500">Control your financial information</p>
            </div>

            <div className="space-y-6">

                {/* Simple Explanation */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Info className="size-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-slate-900">Your financial information</h3>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                        VyaparSetu records the expenses and income you enter to help you build a budget and track your cash flow. We <b>never</b> share your personal financial records with external marketing agencies.
                    </p>
                </div>

                {/* Consent settings */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Consent Settings</h3>

                    <div className="flex items-start justify-between">
                        <div className="pr-8">
                            <h4 className="font-semibold text-slate-900">Analytics Sharing</h4>
                            <p className="text-sm text-slate-500 mt-1">Allow us to anonymously use your business type (e.g. "Retail") to improve recommendations.</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input type="checkbox" checked={dataSharing} onChange={() => setDataSharing(!dataSharing)} className="peer sr-only" />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none focus:ring-4 focus:ring-blue-300"></div>
                        </label>
                    </div>
                </div>

                {/* Data Tools */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Data Tools</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-900">Export my data</h4>
                            <p className="text-sm text-slate-500">Download a complete spreadsheet of your records.</p>
                        </div>
                        <button className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 transition">
                            <Download className="size-4" /> Export
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                            <h4 className="font-semibold text-red-600">Delete my account</h4>
                            <p className="text-sm text-slate-500">Permanently erase all your data. This cannot be undone.</p>
                        </div>
                        <button className="flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 px-4 py-2 font-semibold border border-red-200 hover:bg-red-100 transition">
                            <Trash2 className="size-4" /> Delete
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
}
