"use client";

import { Search, Filter, Briefcase, MapPin, Building2, CheckCircle, FileText } from "lucide-react";

export default function SchemesPage() {
    const schemes = [
        {
            id: "1",
            name: "Pradhan Mantri MUDRA Yojana (PMMY)",
            category: "Loans & Credit",
            stateOrRegion: "All India",
            benefits: "Loans up to ₹10 Lakhs for micro-enterprises. No collateral required.",
            eligibility: "Non-corporate, non-farm small/micro enterprises with funding needs up to ₹10 lakh.",
            requiredDocuments: ["Aadhaar", "PAN", "Business Proof", "Bank Statement"],
        },
        {
            id: "2",
            name: "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
            category: "Guarantee",
            stateOrRegion: "All India",
            benefits: "Collateral-free credit facility (up to ₹2 crore) from eligible institutions.",
            eligibility: "New and existing Micro and Small Enterprises (MSEs) engaged in manufacturing or service activity.",
            requiredDocuments: ["Udyam Registration", "Project Report", "Financials"],
        }
    ];

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-20 md:pb-0">

            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Government Schemes</h2>
                <p className="text-sm text-slate-500">Discover support and funding for your business.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search schemes..."
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Filter className="size-4" /> Filters
                </button>
            </div>

            <div className="space-y-4">
                {schemes.map((scheme) => (
                    <div key={scheme.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden text-sm">
                        <div className="bg-slate-50 px-6 py-4 flex flex-col gap-2 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-lg font-bold text-slate-900">{scheme.name}</h3>
                            <span className="inline-flex w-fit items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {scheme.category}
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                        <Briefcase className="size-4" /> What it gives
                                    </div>
                                    <p className="font-medium text-slate-900">{scheme.benefits}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                        <CheckCircle className="size-4" /> Who can apply
                                    </div>
                                    <p className="text-slate-700">{scheme.eligibility}</p>
                                </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 border-t border-slate-100 pt-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                        <FileText className="size-4" /> Required documents
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {scheme.requiredDocuments.map((doc, idx) => (
                                            <span key={idx} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                                {doc}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                                        <MapPin className="size-4" /> Region
                                    </div>
                                    <p className="text-slate-700">{scheme.stateOrRegion}</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50">
                                    View details & apply
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
