"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, MapPin, Mail, Hash, CheckCircle2 } from "lucide-react";
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
            // simulate put
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
        <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-4 px-4 sm:px-6">
            {/* Header Section with Icon */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-mint/20 blur-xl rounded-full" />
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.25rem] bg-gradient-to-br from-[#fdfbf7] to-[#f5f0e6] flex items-center justify-center border border-mint/30 shadow-sm relative z-10">
                            <Store className="w-8 h-8 md:w-10 md:h-10 text-forest" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest tracking-tight mb-2">Business Profile</h1>
                        <p className="text-ink-muted text-sm md:text-base font-medium max-w-sm">
                            Manage your core enterprise details to unlock hyper-local schemes and credit.
                        </p>
                    </div>
                </div>

                {!isEditMode && (
                    <button
                        onClick={() => setIsEditMode(true)}
                        className="bg-white border-2 border-sage/40 hover:border-mint text-forest font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {isSuccess && (
                <div className="bg-mint-pale border border-mint/30 text-forest p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
                    <CheckCircle2 className="size-5 text-mint" />
                    <span className="font-bold">Profile updated successfully!</span>
                </div>
            )}

            {/* Main Form Card */}
            <form onSubmit={handleSubmit} className="relative overflow-hidden bg-white p-6 md:p-10 rounded-[2.5rem] border border-sage/30 shadow-xl shadow-sage/10 transition-all">
                {/* Top decorative gradient bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-mint via-forest to-orange" />

                {/* Trust Badge Section */}
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-sage/20">
                    <div className="flex items-center gap-2 bg-mint-pale/50 px-4 py-2 rounded-full border border-mint/20">
                        <CheckCircle2 className="size-4 text-mint" />
                        <span className="text-sm font-bold text-forest">Verified VyaparSetu Enterprise</span>
                    </div>
                    <span className="text-xs font-semibold text-ink-muted bg-cream px-4 py-2 rounded-full border border-sage/20">
                        ID: VS-84920
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                    
                    {/* Input Field: Business Name */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2 ml-1">
                            <Store className="size-4 text-mint" /> Business Name
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            disabled={!isEditMode}
                            value={formData.name || ""}
                            onChange={handleChange}
                            className="w-full bg-[#fdfbf7] disabled:bg-[#f5f0e6]/50 disabled:text-forest/80 border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-2xl px-5 py-4 text-forest font-bold text-lg outline-none transition-all shadow-sm hover:border-mint/50 disabled:shadow-none"
                        />
                    </div>

                    {/* Input Field: Industry */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2 ml-1">
                            <Store className="size-4 text-mint" /> Industry / Sector
                        </label>
                        <select
                            name="industry"
                            disabled={!isEditMode}
                            value={formData.industry || ""}
                            onChange={handleChange}
                            className="w-full bg-[#fdfbf7] disabled:bg-[#f5f0e6]/50 disabled:text-forest/80 border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-2xl px-5 py-4 text-forest font-bold text-lg outline-none transition-all appearance-none shadow-sm hover:border-mint/50 disabled:shadow-none"
                        >
                            <option value="Agriculture">Agriculture & Allied</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail & Wholesale">Retail & Wholesale</option>
                            <option value="Services">Services</option>
                            <option value="Artisan">Handicraft & Artisan</option>
                        </select>
                    </div>

                    {/* Input Field: Location */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2 ml-1">
                            <MapPin className="size-4 text-orange" /> Primary Location
                        </label>
                        <input
                            name="location"
                            type="text"
                            required
                            disabled={!isEditMode}
                            value={formData.location || ""}
                            onChange={handleChange}
                            className="w-full bg-[#fdfbf7] disabled:bg-[#f5f0e6]/50 disabled:text-forest/80 border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-2xl px-5 py-4 text-forest font-bold text-lg outline-none transition-all shadow-sm hover:border-mint/50 disabled:shadow-none"
                        />
                    </div>

                    {/* Input Field: GSTIN */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2 ml-1">
                            <Hash className="size-4 text-orange" /> GSTIN (Optional)
                        </label>
                        <input
                            name="gstin"
                            type="text"
                            maxLength={15}
                            disabled={!isEditMode}
                            value={formData.gstin || ""}
                            onChange={handleChange}
                            placeholder="e.g. 09AABCU9603R1ZX"
                            className="w-full bg-[#fdfbf7] disabled:bg-[#f5f0e6]/50 disabled:text-forest/80 border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-2xl px-5 py-4 text-forest font-bold text-lg outline-none transition-all uppercase shadow-sm hover:border-mint/50 disabled:shadow-none placeholder:text-sage"
                        />
                    </div>

                    {/* Input Field: Email */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2 ml-1">
                            <Mail className="size-4 text-mint" /> Email Address
                        </label>
                        <input
                            name="email"
                            type="email"
                            disabled={!isEditMode}
                            value={formData.email || ""}
                            onChange={handleChange}
                            className="w-full bg-[#fdfbf7] disabled:bg-[#f5f0e6]/50 disabled:text-forest/80 border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-2xl px-5 py-4 text-forest font-bold text-lg outline-none transition-all shadow-sm hover:border-mint/50 disabled:shadow-none"
                        />
                    </div>

                    {/* Input Field: Year */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2 ml-1">
                            <CheckCircle2 className="size-4 text-mint" /> Year Established
                        </label>
                        <input
                            name="establishedYear"
                            type="number"
                            required
                            disabled={!isEditMode}
                            value={formData.establishedYear || ""}
                            onChange={handleChange}
                            className="w-full bg-[#fdfbf7] disabled:bg-[#f5f0e6]/50 disabled:text-forest/80 border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-2xl px-5 py-4 text-forest font-bold text-lg outline-none transition-all shadow-sm hover:border-mint/50 disabled:shadow-none"
                        />
                    </div>

                </div>

                {isEditMode && (
                    <div className="flex gap-4 pt-10 mt-10 border-t border-sage/20 animate-in fade-in slide-in-from-bottom-2">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-orange hover:bg-orange-hover text-white font-bold py-3.5 px-10 rounded-2xl transition-all shadow-[0_4px_14px_rgba(217,142,42,0.3)] active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {mutation.isPending ? "Saving changes..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFormData(profile || {});
                                setIsEditMode(false);
                            }}
                            disabled={mutation.isPending}
                            className="bg-white border-2 border-sage/40 hover:bg-cream text-ink-muted hover:text-forest font-bold py-3.5 px-8 rounded-2xl transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
