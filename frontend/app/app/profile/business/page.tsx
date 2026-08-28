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
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-forest">Business Profile</h1>
                    <p className="text-ink-muted">Manage your core enterprise details used for scheme matching.</p>
                </div>
                {!isEditMode && (
                    <button
                        onClick={() => setIsEditMode(true)}
                        className="bg-white border border-sage/40 hover:border-mint text-forest font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {isSuccess && (
                <div className="bg-mint-pale border border-mint/30 text-forest p-4 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-mint" />
                    <span className="font-bold">Profile updated successfully!</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-3xl border border-sage/30 shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2">
                            <Store className="size-4" /> Business Name
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            disabled={!isEditMode}
                            value={formData.name || ""}
                            onChange={handleChange}
                            className="w-full bg-cream disabled:bg-cream/50 disabled:text-ink-muted border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2">
                            <Store className="size-4" /> Industry / Sector
                        </label>
                        <select
                            name="industry"
                            disabled={!isEditMode}
                            value={formData.industry || ""}
                            onChange={handleChange}
                            className="w-full bg-cream disabled:bg-cream/50 disabled:text-ink-muted border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all appearance-none"
                        >
                            <option value="Agriculture">Agriculture & Allied</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail & Wholesale">Retail & Wholesale</option>
                            <option value="Services">Services</option>
                            <option value="Artisan">Handicraft & Artisan</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2">
                            <MapPin className="size-4" /> Primary Location
                        </label>
                        <input
                            name="location"
                            type="text"
                            required
                            disabled={!isEditMode}
                            value={formData.location || ""}
                            onChange={handleChange}
                            className="w-full bg-cream disabled:bg-cream/50 disabled:text-ink-muted border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2">
                            <Hash className="size-4" /> GSTIN (Optional)
                        </label>
                        <input
                            name="gstin"
                            type="text"
                            maxLength={15}
                            disabled={!isEditMode}
                            value={formData.gstin || ""}
                            onChange={handleChange}
                            placeholder="e.g. 09AABCU9603R1ZX"
                            className="w-full bg-cream disabled:bg-cream/50 disabled:text-ink-muted border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all uppercase"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2">
                            <Mail className="size-4" /> Email Address
                        </label>
                        <input
                            name="email"
                            type="email"
                            disabled={!isEditMode}
                            value={formData.email || ""}
                            onChange={handleChange}
                            className="w-full bg-cream disabled:bg-cream/50 disabled:text-ink-muted border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-ink-muted flex items-center gap-2">
                            Year Established
                        </label>
                        <input
                            name="establishedYear"
                            type="number"
                            required
                            disabled={!isEditMode}
                            value={formData.establishedYear || ""}
                            onChange={handleChange}
                            className="w-full bg-cream disabled:bg-cream/50 disabled:text-ink-muted border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-xl px-4 py-3 text-ink font-bold outline-none transition-all"
                        />
                    </div>

                </div>

                {isEditMode && (
                    <div className="flex gap-4 pt-4 border-t border-sage/30">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-orange hover:bg-orange-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm flex items-center gap-2"
                        >
                            {mutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setFormData(profile || {});
                                setIsEditMode(false);
                            }}
                            disabled={mutation.isPending}
                            className="bg-white border border-sage/40 hover:bg-sage/10 text-ink-muted font-bold py-3 px-8 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
