"use client";

import { User, ShieldCheck, Mail, Phone, Globe, Building2, ExternalLink, Settings2, CheckCircle2, FileText, Fingerprint, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Mock save delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        setIsEditModalOpen(false);
        toast.success("Profile updated successfully!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6 relative">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2">
                        <User className="size-7 text-orange" /> User Profile
                    </h1>
                    <p className="text-ink-muted mt-1">Manage your personal identity and KYC details.</p>
                </div>
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-white border border-sage/40 hover:border-mint text-forest font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95 shrink-0"
                >
                    <Settings2 className="size-4" /> Manage Profile
                </button>
            </div>

            <div className="space-y-8">
                
                {/* Hero / Identity Card */}
                <div className="bg-forest rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-mint/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 shrink-0">
                        <div className="size-32 rounded-[2rem] bg-gradient-to-br from-mint to-mint-dark text-forest flex items-center justify-center font-bold text-5xl shadow-lg border-4 border-white/10">
                            RP
                        </div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 pt-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-mint/20 border border-mint/30 rounded-full text-mint text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="size-3.5" /> Identity Verified
                        </div>
                        
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight text-white">Ramesh Patil</h2>
                            <p className="text-mint font-medium mt-1">Platform ID: VS-8892-4410</p>
                        </div>
                        
                        <p className="text-white/70 text-sm max-w-md pt-2">
                            Member since August 2024. Your account has full access to the government scheme matchmaking engine.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Personal KYC */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted ml-2">Personal KYC</h3>
                        <div className="bg-white rounded-[2rem] border border-sage/30 overflow-hidden shadow-sm p-6 space-y-6">
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-sage/20 rounded-xl text-forest border border-sage/40">
                                        <Fingerprint className="size-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-forest text-lg leading-none mb-1.5">Aadhaar</h4>
                                        <p className="text-sm font-bold text-ink-muted">XXXX-XXXX-8812</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <CheckCircle2 className="size-5 text-mint" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-mint">Verified</span>
                                </div>
                            </div>

                            <div className="h-px w-full bg-sage/30" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-sage/20 rounded-xl text-forest border border-sage/40">
                                        <FileText className="size-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-forest text-lg leading-none mb-1.5">PAN Card</h4>
                                        <p className="text-sm font-bold text-ink-muted">ABCDE1234F</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <CheckCircle2 className="size-5 text-mint" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-mint">Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 flex flex-col">
                        
                        {/* Contact Details */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted ml-2">Contact Details</h3>
                            <div className="bg-white rounded-[2rem] border border-sage/30 overflow-hidden shadow-sm p-6 space-y-5">
                                
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-sage/10 rounded-lg text-ink-muted">
                                        <Phone className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-0.5">Primary Phone</p>
                                        <p className="font-bold text-forest">+91 98765 43210</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-sage/10 rounded-lg text-ink-muted">
                                        <Mail className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-0.5">Email Address</p>
                                        <p className="font-bold text-forest">ramesh.patil@example.com</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-sage/10 rounded-lg text-ink-muted">
                                        <Globe className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-0.5">Platform Language</p>
                                        <p className="font-bold text-forest">English</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Linked Business */}
                        <div className="space-y-3 mt-auto">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted ml-2">Linked Business</h3>
                            <Link href="/app/profile/business" className="block">
                                <div className="bg-mint-pale border border-mint/30 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-mint/20 rounded-xl text-forest border border-mint/30">
                                            <Building2 className="size-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-forest text-lg leading-none mb-1">Patil Agrotech</h4>
                                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider">Primary Owner</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="size-5 text-mint group-hover:text-forest transition-colors" />
                                </div>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/80 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-sage/30 flex items-center justify-between bg-cream/30">
                            <h2 className="text-xl font-bold text-forest flex items-center gap-2">
                                <Settings2 className="size-5 text-mint" /> Manage Profile
                            </h2>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 text-ink-muted hover:bg-sage/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="edit-profile-form" onSubmit={handleSave} className="space-y-6">
                                
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted border-b border-sage/30 pb-2">Contact Information</h3>
                                    
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-forest">Phone Number</label>
                                        <input 
                                            type="text" 
                                            defaultValue="+91 98765 43210" 
                                            className="w-full px-4 py-2.5 rounded-xl border border-sage/40 focus:border-mint focus:ring-2 focus:ring-mint-light outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-forest">Email Address</label>
                                        <input 
                                            type="email" 
                                            defaultValue="ramesh.patil@example.com" 
                                            className="w-full px-4 py-2.5 rounded-xl border border-sage/40 focus:border-mint focus:ring-2 focus:ring-mint-light outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-forest">Platform Language</label>
                                        <select className="w-full px-4 py-2.5 rounded-xl border border-sage/40 focus:border-mint focus:ring-2 focus:ring-mint-light outline-none transition-all font-medium bg-white">
                                            <option>English</option>
                                            <option>Hindi (हिंदी)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted border-b border-sage/30 pb-2">KYC Details</h3>
                                    
                                    <div className="p-4 bg-orange/5 border border-orange/20 rounded-xl flex gap-3">
                                        <ShieldCheck className="size-5 text-orange shrink-0" />
                                        <p className="text-xs font-medium text-orange-hover">
                                            KYC details cannot be edited directly once verified. Please contact support to initiate a re-verification process.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5 opacity-60 pointer-events-none">
                                        <label className="text-sm font-bold text-forest flex justify-between">
                                            Aadhaar Number
                                            <span className="text-mint text-xs">Verified</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            defaultValue="XXXX-XXXX-8812" 
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-xl border border-sage/40 bg-sage/10 font-medium text-ink-muted"
                                        />
                                    </div>
                                    <div className="space-y-1.5 opacity-60 pointer-events-none">
                                        <label className="text-sm font-bold text-forest flex justify-between">
                                            PAN Card Number
                                            <span className="text-mint text-xs">Verified</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            defaultValue="ABCDE1234F" 
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-xl border border-sage/40 bg-sage/10 font-medium text-ink-muted"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-sage/30 bg-cream/30 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-6 py-2.5 font-bold text-ink-muted hover:text-forest transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                form="edit-profile-form"
                                disabled={isSaving}
                                className="bg-forest hover:bg-forest/90 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 min-w-[120px] justify-center"
                            >
                                {isSaving ? <Loader2 className="size-5 animate-spin" /> : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
