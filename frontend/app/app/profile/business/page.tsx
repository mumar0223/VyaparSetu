"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, MapPin, Mail, Hash, CheckCircle2, ShieldCheck, Award, Briefcase, Calendar, Star, Edit3, X, Save } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface BusinessProfile {
    id?: string;
    name: string;
    industry: string;
    location: string;
    gstin?: string;
    email?: string;
    establishedYear: number;
}

export default function BusinessProfilePage() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<BusinessProfile>>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ["businessProfile"],
        queryFn: async () => {
            try {
                const res = await apiClient.get<BusinessProfile>("/business-profile");
                setFormData(res);
                return res;
            } catch (err) {
                const mock: BusinessProfile = {
                    name: "Saraswati Enterprises",
                    industry: "Retail & Wholesale",
                    location: "Rampur, UP",
                    gstin: "09AABCU9603R1ZX",
                    email: "contact@saraswati.in",
                    establishedYear: 2018,
                };
                setFormData(mock);
                return mock;
            }
        },
        staleTime: 0,
    });

    const mutation = useMutation({
        mutationFn: async (data: Partial<BusinessProfile>) => {
            return new Promise((resolve) => setTimeout(resolve, 800));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["businessProfile"] });
            setIsEditMode(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (isLoading) return <div className="animate-pulse flex h-64 bg-sage/20 rounded-3xl" />;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest tracking-tight mb-2">Digital Business Passport</h1>
                    <p className="text-ink-muted text-sm md:text-base font-medium max-w-md">
                        Your verified VyaparSetu identity. Keep this updated to unlock exclusive schemes and credit.
                    </p>
                </div>

                {!isEditMode && (
                    <button
                        onClick={() => setIsEditMode(true)}
                        className="bg-white border-2 border-sage/40 hover:border-mint text-forest font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0 flex items-center gap-2"
                    >
                        <Edit3 className="size-4 text-mint" /> Edit Profile
                    </button>
                )}
            </div>

            {/* Profile Completion Meter */}
            <div className="bg-forest rounded-2xl p-6 relative overflow-hidden text-white shadow-md flex flex-col md:flex-row items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-mint/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="p-3 bg-mint/20 rounded-xl border border-mint/30 relative z-10 shrink-0">
                    <Star className="size-8 text-mint fill-mint" />
                </div>
                <div className="flex-1 relative z-10 w-full text-center md:text-left">
                    <h3 className="font-bold text-lg flex items-center justify-center md:justify-start gap-2">
                        Profile 100% Complete <CheckCircle2 className="size-5 text-mint" />
                    </h3>
                    <p className="text-sm font-medium text-white/80 mt-1">Tier-1 Government Schemes & Priority Credit Unlocked</p>
                </div>
            </div>

            {/* Business Snapshot Row */}
            {!isEditMode && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5"><Calendar className="size-3.5 text-orange" /> Established</span>
                        <span className="text-lg font-bold text-forest">{formData.establishedYear}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5"><Briefcase className="size-3.5 text-purple-500" /> Industry</span>
                        <span className="text-lg font-bold text-forest truncate">{formData.industry}</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-sage/30 shadow-sm flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5"><MapPin className="size-3.5 text-mint" /> Location</span>
                        <span className="text-lg font-bold text-forest truncate">{formData.location}</span>
                    </div>
                    <div className="bg-mint-pale p-5 rounded-2xl border border-mint/30 shadow-sm flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-forest/70 flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-mint" /> Verification</span>
                        <span className="text-lg font-bold text-forest flex items-center gap-1">Verified <CheckCircle2 className="size-4 text-mint" /></span>
                    </div>
                </div>
            )}

            {isSuccess && (
                <div className="bg-mint-pale border border-mint/30 text-forest p-4 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="size-5 text-mint" />
                    <span className="font-bold">Passport updated successfully!</span>
                </div>
            )}

            {/* Main Form Layout */}
            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
                
                {/* Left Column: Core Data */}
                <div className="flex-1 bg-white p-8 rounded-[2rem] border border-sage/30 shadow-sm space-y-10">
                    
                    {/* Core Identity */}
                    <div>
                        <h2 className="text-xl font-serif font-bold text-forest border-b border-sage/30 pb-4 mb-6">Core Identity</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <Store className="size-3.5 text-mint" /> Business Name
                                </label>
                                {isEditMode ? (
                                    <input name="name" type="text" required value={formData.name || ""} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all" />
                                ) : (
                                    <p className="text-lg font-bold text-forest">{formData.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <Briefcase className="size-3.5 text-purple-500" /> Industry / Sector
                                </label>
                                {isEditMode ? (
                                    <select name="industry" value={formData.industry || ""} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all appearance-none">
                                        <option value="Agriculture">Agriculture & Allied</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Retail & Wholesale">Retail & Wholesale</option>
                                        <option value="Services">Services</option>
                                        <option value="Artisan">Handicraft & Artisan</option>
                                    </select>
                                ) : (
                                    <p className="text-lg font-bold text-forest">{formData.industry}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-orange" /> Year Established
                                </label>
                                {isEditMode ? (
                                    <input name="establishedYear" type="number" required value={formData.establishedYear || ""} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all" />
                                ) : (
                                    <p className="text-lg font-bold text-forest">{formData.establishedYear}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact & Registration */}
                    <div>
                        <h2 className="text-xl font-serif font-bold text-forest border-b border-sage/30 pb-4 mb-6">Contact & Registration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <MapPin className="size-3.5 text-mint" /> Primary Location
                                </label>
                                {isEditMode ? (
                                    <input name="location" type="text" required value={formData.location || ""} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all" />
                                ) : (
                                    <p className="text-lg font-bold text-forest">{formData.location}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <Mail className="size-3.5 text-orange" /> Email Address
                                </label>
                                {isEditMode ? (
                                    <input name="email" type="email" value={formData.email || ""} onChange={handleChange} className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all" />
                                ) : (
                                    <p className="text-lg font-bold text-forest">{formData.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                                    <Hash className="size-3.5 text-mint" /> GSTIN (Optional)
                                </label>
                                {isEditMode ? (
                                    <input name="gstin" type="text" maxLength={15} value={formData.gstin || ""} onChange={handleChange} placeholder="e.g. 09AABCU9603R1ZX" className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all uppercase placeholder:text-sage" />
                                ) : (
                                    <p className="text-lg font-bold text-forest uppercase">{formData.gstin || "Not Registered"}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Edit Mode Action Buttons */}
                    {isEditMode && (
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-sage/20 animate-in fade-in slide-in-from-bottom-2">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="flex-1 bg-forest hover:bg-forest/90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {mutation.isPending ? "Saving..." : <><Save className="size-5" /> Save Changes</>}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(profile || {});
                                    setIsEditMode(false);
                                }}
                                disabled={mutation.isPending}
                                className="flex-1 bg-[#fdfbf7] border-2 border-sage/40 hover:bg-cream text-ink-muted hover:text-forest font-bold py-4 px-8 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <X className="size-5" /> Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Badges & Eligibility */}
                <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                    
                    {/* Official Seal / ID Box */}
                    <div className="bg-gradient-to-b from-[#fdfbf7] to-white p-6 rounded-[2rem] border border-sage/30 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-mint via-forest to-orange" />
                        
                        <div className="w-20 h-20 bg-mint-pale rounded-full flex items-center justify-center border border-mint/30 mb-4 shadow-sm relative">
                            <ShieldCheck className="size-10 text-mint" />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                <CheckCircle2 className="size-5 text-forest" />
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-forest mb-1">VyaparSetu Business ID</h3>
                        <p className="font-mono font-bold text-ink-muted text-sm tracking-widest bg-sage/10 px-3 py-1 rounded-lg border border-sage/20 mb-4">
                            VS-84920
                        </p>
                        <span className="text-xs font-bold text-mint uppercase tracking-wider">Verified Enterprise</span>
                    </div>

                    {/* Eligibility Badges */}
                    <div className="bg-white p-6 rounded-[2rem] border border-sage/30 shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-5">
                            <Award className="size-5 text-orange" />
                            <h3 className="font-bold text-forest">Eligible For</h3>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="size-5 text-mint shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-forest">MSME Registration</p>
                                    <p className="text-xs font-medium text-ink-muted">Udyam Ready</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="size-5 text-mint shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-forest">Mudra Loan</p>
                                    <p className="text-xs font-medium text-ink-muted">Up to ₹10 Lakhs</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="size-5 text-mint shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-forest">PMEGP Subsidy</p>
                                    <p className="text-xs font-medium text-ink-muted">35% Rural Margin</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="size-5 text-mint shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-forest">State Retail Schemes</p>
                                    <p className="text-xs font-medium text-ink-muted">UP Govt Initiative</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>
            </form>
        </div>
    );
}
