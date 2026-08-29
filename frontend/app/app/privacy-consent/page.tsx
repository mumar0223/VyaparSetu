"use client";

import { ShieldCheck, Lock } from "lucide-react";

export default function PrivacyConsentPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-forest">Privacy & Consent</h1>
                <p className="text-ink-muted">Manage your data permissions and security settings.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-sage/30 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <ShieldCheck className="size-16 text-mint" />
                <h3 className="text-xl font-bold text-forest">Your Data is Secure</h3>
                <p className="text-ink-muted max-w-md">We use government-grade encryption to protect your financial footprint. You control what data is shared for scheme eligibility.</p>
                <button className="bg-cream border border-sage/30 text-ink-muted font-bold py-2.5 px-6 rounded-xl hover:bg-sage/10 transition-colors flex items-center gap-2">
                    <Lock className="size-4" /> Manage API Access
                </button>
            </div>
        </div>
    );
}
