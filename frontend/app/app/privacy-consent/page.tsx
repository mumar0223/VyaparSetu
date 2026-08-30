"use client";

import { ShieldCheck, Lock, Database, Activity, Key, Building2, CheckCircle2, AlertCircle, EyeOff, ShieldAlert, History } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PrivacyConsentPage() {
    // Mock state for interactive revoke buttons
    const [revoked, setRevoked] = useState<Record<string, boolean>>({});

    const handleRevoke = (id: string) => {
        setRevoked(prev => ({ ...prev, [id]: true }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2">
                        <ShieldCheck className="size-7 text-mint" /> Data Governance & Consent
                    </h1>
                    <p className="text-ink-muted mt-1">Manage your Account Aggregator (AA) settings and DPDP Act compliance.</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-mint/10 border border-mint/20 rounded-xl text-forest text-sm font-bold shadow-sm">
                    <Lock className="size-4 text-mint" /> End-to-End Encrypted
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Consents & Integrations */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Active Consents (Account Aggregator) */}
                    <div className="bg-white border border-sage/40 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-forest flex items-center gap-2">
                                <Key className="size-5 text-orange" /> Active Data Consents
                            </h2>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted bg-sage/20 px-3 py-1 rounded-full">
                                Account Aggregator Framework
                            </span>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { id: "sbi", name: "State Bank of India", purpose: "Loan Eligibility Check", expiry: "12 days", data: ["Cash Flow", "Credit History"] },
                                { id: "ai", name: "VyaparSetu AI Matchmaker", purpose: "Scheme Recommendations", expiry: "Active Session", data: ["Business Profile", "Revenue"] },
                                { id: "nsfdc", name: "NSFDC Portal", purpose: "Application Pre-fill", expiry: "2 months", data: ["KYC", "GST Details"] },
                            ].map((consent) => (
                                <div key={consent.id} className={cn(
                                    "p-5 rounded-2xl border transition-all duration-500",
                                    revoked[consent.id] ? "bg-cream/50 border-sage/20 opacity-60" : "bg-white border-sage/30 shadow-sm hover:border-mint/40"
                                )}>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-sage/10 rounded-xl border border-sage/20">
                                                <Building2 className="size-5 text-forest" />
                                            </div>
                                            <div>
                                                <h3 className={cn("font-bold text-lg", revoked[consent.id] ? "text-ink-muted line-through" : "text-forest")}>
                                                    {consent.name}
                                                </h3>
                                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mt-1">
                                                    Purpose: {consent.purpose}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            {revoked[consent.id] ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange/10 text-orange-hover text-xs font-bold rounded-lg border border-orange/20">
                                                    <EyeOff className="size-3.5" /> Access Revoked
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleRevoke(consent.id)}
                                                    className="px-4 py-2 bg-white hover:bg-orange/5 text-orange-hover text-sm font-bold rounded-xl border border-sage/40 hover:border-orange/30 transition-colors flex items-center gap-2"
                                                >
                                                    <ShieldAlert className="size-4" /> Revoke Access
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm pt-3 border-t border-sage/20">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-ink-muted">Data Shared:</span>
                                            <div className="flex gap-2">
                                                {consent.data.map(d => (
                                                    <span key={d} className="text-xs font-bold text-forest bg-sage/20 px-2 py-0.5 rounded">
                                                        {d}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {!revoked[consent.id] && (
                                            <div className="flex items-center gap-1.5 ml-auto text-xs font-bold text-orange">
                                                <AlertCircle className="size-3.5" /> Expires in {consent.expiry}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Connected Data Sources */}
                    <div className="bg-white border border-sage/40 rounded-[2rem] p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-forest flex items-center gap-2 mb-6">
                            <Database className="size-5 text-mint" /> Connected Data Sources
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-cream border border-sage/30 p-5 rounded-2xl flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-bold text-forest">GSTN Portal</div>
                                    <CheckCircle2 className="size-5 text-mint" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-sm font-bold text-mint">Active • Synced 2 hrs ago</div>
                                </div>
                            </div>

                            <div className="bg-cream border border-sage/30 p-5 rounded-2xl flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-bold text-forest">Udyam Registration</div>
                                    <CheckCircle2 className="size-5 text-mint" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-sm font-bold text-mint">Active • Verified</div>
                                </div>
                            </div>

                            <div className="bg-cream border border-sage/30 p-5 rounded-2xl flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-bold text-forest">Bank Statements (AA)</div>
                                    <CheckCircle2 className="size-5 text-mint" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-sm font-bold text-mint">Active • Synced 1 hr ago</div>
                                </div>
                            </div>

                            <div className="bg-white border-2 border-dashed border-sage/40 p-5 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-sage/5 transition-colors">
                                <div className="p-2 bg-mint/10 rounded-full mb-2">
                                    <Database className="size-4 text-mint" />
                                </div>
                                <span className="font-bold text-forest text-sm">Connect New Source</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Audit Log */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-forest rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <ShieldCheck className="size-40" />
                        </div>
                        
                        <div className="relative z-10 flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Activity className="size-5 text-mint" /> Audit Log
                            </h3>
                            <button className="text-xs font-bold uppercase tracking-wider text-mint hover:text-white transition-colors">
                                Download PDF
                            </button>
                        </div>

                        <div className="relative z-10 flex-1 space-y-6">
                            {[
                                { action: "Data Access", actor: "AI Matchmaker", detail: "Read Cash Flow History", time: "Today, 10:45 AM" },
                                { action: "Consent Verified", actor: "System", detail: "SBI Loan Eligibility", time: "Yesterday, 2:30 PM" },
                                { action: "Data Sync", actor: "GSTN Portal", detail: "Monthly returns updated", time: "Aug 28, 9:00 AM" },
                                { action: "Login", actor: "Admin User", detail: "New device detected", time: "Aug 25, 11:20 AM" },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="size-2 bg-mint rounded-full shrink-0 mt-1.5" />
                                        {i !== 3 && <div className="w-px h-full bg-white/10 my-1" />}
                                    </div>
                                    <div className="pb-4">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <h4 className="font-bold text-sm text-white leading-none">{log.action}</h4>
                                            <span className="text-[10px] font-bold text-white/50 uppercase">{log.time}</span>
                                        </div>
                                        <p className="text-xs text-white/70">
                                            <span className="font-semibold text-mint">{log.actor}</span>: {log.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10 mt-auto pt-6 border-t border-white/10 flex items-center gap-3">
                            <History className="size-5 text-white/50" />
                            <p className="text-xs font-medium text-white/50 leading-tight">
                                Logs are immutably stored for 7 years in accordance with regulatory requirements.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
