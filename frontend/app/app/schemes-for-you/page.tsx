"use client";

import { Search, Filter, ChevronDown, Check, X } from "lucide-react";
import { useState } from "react";
const FILTERS = ["All", "Loan", "Grant", "Women-focused", "Agriculture", "Startup", "Manufacturing"];

const SCHEMES = [
    {
        id: "pmegp",
        title: "PMEGP",
        subtitle: "Prime Minister's Employment Generation Programme",
        tags: ["Grant", "Rural", "Manufacturing", "Services"],
        match: 95,
    },
    {
        id: "mudra",
        title: "MUDRA (Kishor)",
        subtitle: "Pradhan Mantri MUDRA Yojana",
        tags: ["Loan", "All Categories", "Micro-enterprise"],
        match: 88,
    },
    {
        id: "standup",
        title: "Stand-Up India",
        subtitle: "Stand-Up India Scheme for Financing SC/ST and/or Women Entrepreneurs",
        tags: ["Loan", "Women-focused", "SC/ST", "Large Ticket"],
        match: 72,
    },
    {
        id: "aif",
        title: "AIF",
        subtitle: "Agriculture Infrastructure Fund",
        tags: ["Loan", "Agriculture", "Infrastructure"],
        match: 65,
    }
];

export default function SchemesPage() {
    const [activeFilter, setActiveFilter] = useState("All");

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6">
            
            {/* Eligible Schemes Summary Card */}
            <div className="bg-white rounded-3xl overflow-hidden border border-sage/30 shadow-sm">
                <div className="bg-mint-pale px-6 py-5 border-b border-mint/20">
                    <h2 className="text-xl font-serif font-bold text-forest mb-1">Eligible Schemes for You</h2>
                    <p className="text-sm font-medium text-forest/70">Based on your Profile Hub details (Budget: ₹50,000, Sector: N/A)</p>
                </div>
                
                <div className="p-6 md:p-8 flex flex-wrap gap-4">
                    {/* Eligible */}
                    <div className="flex items-center gap-3 bg-white border-2 border-mint/30 rounded-2xl px-5 py-3 shadow-sm flex-1 min-w-[200px] justify-between">
                        <span className="font-bold text-forest">PMEGP</span>
                        <div className="w-6 h-6 bg-mint rounded-md flex items-center justify-center">
                            <Check className="size-4 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white border-2 border-mint/30 rounded-2xl px-5 py-3 shadow-sm flex-1 min-w-[200px] justify-between">
                        <span className="font-bold text-forest">MUDRA Yojana</span>
                        <div className="w-6 h-6 bg-mint rounded-md flex items-center justify-center">
                            <Check className="size-4 text-white" />
                        </div>
                    </div>

                    {/* Ineligible */}
                    <div className="flex items-center gap-3 bg-cream/50 border border-sage/20 rounded-2xl px-5 py-3 opacity-60 flex-1 min-w-[200px] justify-between">
                        <span className="font-bold text-ink-muted">PMFME</span>
                        <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                            <X className="size-4 text-red-500" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-cream/50 border border-sage/20 rounded-2xl px-5 py-3 opacity-60 flex-1 min-w-[200px] justify-between">
                        <span className="font-bold text-ink-muted">Stand-Up India</span>
                        <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
                            <X className="size-4 text-red-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-5">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-ink-muted" />
                    <input 
                        type="text" 
                        placeholder="Search schemes..." 
                        className="w-full bg-white border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl pl-11 pr-4 py-3 text-ink font-medium outline-none transition-all shadow-sm"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Filter className="size-5 text-forest mr-1 shrink-0" />
                    {FILTERS.map(filter => (
                        <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                activeFilter === filter 
                                ? "bg-forest border-forest text-white shadow-md" 
                                : "bg-white border-sage/30 text-ink hover:border-mint hover:text-forest"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Schemes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SCHEMES.map(scheme => (
                    <div key={scheme.id} className="bg-white p-6 rounded-[2rem] border border-sage/30 shadow-sm hover:shadow-md hover:border-mint/50 transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-forest mb-1">{scheme.title}</h3>
                                <p className="text-sm text-ink-muted font-medium">{scheme.subtitle}</p>
                            </div>
                            <div className="flex flex-col items-end gap-3 shrink-0">
                                <span className="font-bold text-orange text-xs bg-orange/10 px-2.5 py-1 rounded-full border border-orange/20 inline-flex items-center shadow-sm">
                                    {scheme.match}% Match
                                </span>
                                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center group-hover:bg-mint-pale transition-colors shrink-0">
                                    <ChevronDown className="size-5 text-forest" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-6">
                            {scheme.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-mint-pale text-forest text-xs font-bold rounded-md border border-mint/20">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
