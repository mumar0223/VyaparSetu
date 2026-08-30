"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Plus, Pencil, Trash2, X, Tractor, Home, 
    GraduationCap, Bike, Wallet, Briefcase, 
    TrendingUp, Target, Activity
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

const CATEGORIES = [
    { value: "farm", label: "Farm Equipment", icon: Tractor, color: "text-orange", bg: "bg-orange/10", border: "border-orange/20" },
    { value: "home", label: "Home Improvement", icon: Home, color: "text-mint", bg: "bg-mint/10", border: "border-mint/20" },
    { value: "education", label: "Education", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { value: "vehicle", label: "Vehicle", icon: Bike, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { value: "emergency", label: "Emergency Fund", icon: Wallet, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    { value: "business", label: "Business Expansion", icon: Briefcase, color: "text-forest", bg: "bg-forest/10", border: "border-forest/20" },
];

const DEFAULT_CATEGORY = CATEGORIES[5]; // Business Expansion

interface Goal {
    id?: string;
    title: string;
    targetAmount: number;
    currentSaved: number;
    targetDate: string;
    category?: string;
}

const CircularProgress = ({ progress, size = 60, strokeWidth = 6 }: { progress: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background track */}
                <circle
                    className="text-sage/20"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress track */}
                <circle
                    className="text-mint transition-all duration-1000 ease-out"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute flex items-center justify-center text-xs font-bold text-forest">
                {Math.round(progress)}%
            </div>
        </div>
    );
};

export default function SavingsPage() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Goal>>({});

    // Fetch goals
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["/savings-goals"],
        queryFn: async () => {
            try {
                return await apiClient.get<Goal[]>("/savings-goals");
            } catch (e) {
                // Mock fallback for rich UI presentation during hackathon demo
                return [
                    { id: "1", title: "New Transport Bike", targetAmount: 50000, currentSaved: 15000, targetDate: "2026-12-15", category: "vehicle" },
                    { id: "2", title: "Warehouse Expansion", targetAmount: 200000, currentSaved: 120000, targetDate: "2027-03-01", category: "business" },
                    { id: "3", title: "Emergency Buffer", targetAmount: 25000, currentSaved: 25000, targetDate: "2025-10-10", category: "emergency" },
                ] as Goal[];
            }
        }
    });

    // Mutations
    const mutation = useMutation({
        mutationFn: async (payload: { id?: string; data: Partial<Goal> }) => {
            if (payload.id) return apiClient.patch(`/savings-goals/${payload.id}`, payload.data);
            return apiClient.post("/savings-goals", payload.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/savings-goals"] });
            closeForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => apiClient.delete(`/savings-goals/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/savings-goals"] })
    });

    // Form handlers
    const openForm = (item?: Goal) => {
        if (item) {
            setEditingId(item.id!);
            setFormData(item);
        } else {
            setEditingId(null);
            setFormData({ category: "business" });
        }
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({ id: editingId || undefined, data: formData });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: ["targetAmount", "currentSaved"].includes(name) ? Number(value) : value 
        }));
    };

    // Calculate Summary Metrics
    const totalSaved = items.reduce((sum, item) => sum + (Number(item.currentSaved) || 0), 0);
    const totalTarget = items.reduce((sum, item) => sum + (Number(item.targetAmount) || 0), 0);
    const avgProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const activeGoals = items.length;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-24 pt-4 px-4 sm:px-6">
            
            {/* Header & Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest tracking-tight mb-2">Savings Goals</h1>
                    <p className="text-ink-muted text-sm md:text-base font-medium max-w-md">
                        Track and manage your financial milestones to grow your business securely.
                    </p>
                </div>
                <button
                    onClick={() => openForm()}
                    className="bg-forest hover:bg-forest/90 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2 shrink-0"
                >
                    <Plus className="size-5" /> Add New Goal
                </button>
            </div>

            {/* Total Savings Portfolio Widget */}
            {items.length > 0 && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-sage/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-mint/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    
                    <div className="space-y-1 relative z-10">
                        <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider">Total Savings Portfolio</h2>
                        <div className="text-4xl md:text-5xl font-serif font-bold text-forest">
                            ₹{totalSaved.toLocaleString('en-IN')}
                        </div>
                        <p className="text-sm font-medium text-forest/70">
                            saved of ₹{totalTarget.toLocaleString('en-IN')} total target
                        </p>
                    </div>

                    <div className="flex items-center gap-8 md:gap-12 relative z-10">
                        <div className="flex flex-col items-start gap-1 border-l-2 border-sage/20 pl-6 md:pl-8">
                            <span className="text-3xl font-bold text-orange flex items-center gap-2">
                                {activeGoals} <Target className="size-6 text-orange/70" />
                            </span>
                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Active Goals</span>
                        </div>
                        <div className="flex flex-col items-start gap-1 border-l-2 border-sage/20 pl-6 md:pl-8">
                            <span className="text-3xl font-bold text-mint flex items-center gap-2">
                                {Math.round(avgProgress)}% <TrendingUp className="size-6 text-mint/70" />
                            </span>
                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Avg Progress</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-64 bg-sage/20 rounded-3xl" />)}
                </div>
            ) : items.length === 0 ? (
                /* Empty State */
                <div className="bg-white border-2 border-dashed border-sage/40 rounded-3xl p-12 flex flex-col items-center text-center max-w-2xl mx-auto shadow-sm">
                    <div className="w-20 h-20 bg-mint-pale rounded-full flex items-center justify-center mb-6 shadow-sm border border-mint/20">
                        <Target className="size-10 text-mint" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-forest mb-3">Start Your First Savings Goal</h3>
                    <p className="text-ink-muted font-medium mb-8 max-w-sm">
                        Save for business expansion, farm equipment, education, or emergencies. Setting a goal is the first step to achieving it.
                    </p>
                    <button
                        onClick={() => openForm()}
                        className="bg-orange hover:bg-orange-hover text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-[0_4px_14px_rgba(217,142,42,0.3)] active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="size-5" /> Create Goal
                    </button>
                </div>
            ) : (
                /* Grid Layout for Goals */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(item => {
                        const target = Number(item.targetAmount) || 1;
                        const saved = Number(item.currentSaved) || 0;
                        const progress = Math.min(100, (saved / target) * 100);
                        const remaining = Math.max(0, target - saved);
                        
                        const catConfig = CATEGORIES.find(c => c.value === item.category) || DEFAULT_CATEGORY;
                        const Icon = catConfig.icon;

                        return (
                            <div key={item.id} className="bg-white rounded-3xl p-6 border border-sage/30 shadow-sm hover:shadow-md hover:border-mint/40 transition-all group flex flex-col relative overflow-hidden">
                                
                                {/* Progress Ring Background Decor */}
                                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                    <Icon className={`size-24 ${catConfig.color} -rotate-12 transform translate-x-4 -translate-y-4`} />
                                </div>

                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center border ${catConfig.bg} ${catConfig.border}`}>
                                            <Icon className={`size-6 ${catConfig.color}`} />
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openForm(item)} className="p-2 text-ink-muted hover:text-forest hover:bg-cream rounded-xl transition-colors">
                                            <Pencil className="size-4" />
                                        </button>
                                        <button onClick={() => deleteMutation.mutate(item.id!)} className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 relative z-10">
                                    <h3 className="text-xl font-bold text-forest mb-1 line-clamp-1" title={item.title}>{item.title}</h3>
                                    <div className="text-sm font-bold text-forest mb-6">
                                        ₹{saved.toLocaleString('en-IN')} <span className="text-ink-muted font-medium">/ ₹{target.toLocaleString('en-IN')}</span>
                                    </div>

                                    <div className="flex items-center gap-4 mb-6">
                                        <CircularProgress progress={progress} size={56} strokeWidth={6} />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-0.5">Remaining</span>
                                            <span className="text-sm font-bold text-orange">₹{remaining.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-sage/20 flex items-center justify-between text-xs font-bold text-ink-muted uppercase tracking-wider relative z-10">
                                    <span>Due: {new Date(item.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                    <span className={`px-2 py-1 rounded-md ${catConfig.bg} ${catConfig.color}`}>{catConfig.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Simple Modal Overlay */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-sage/20 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-sage/20 flex items-center justify-between bg-[#fdfbf7]">
                            <h2 className="text-xl font-serif font-bold text-forest">
                                {editingId ? "Edit Savings Goal" : "Create Savings Goal"}
                            </h2>
                            <button onClick={closeForm} className="p-2 hover:bg-sage/20 text-ink-muted hover:text-forest rounded-full transition-colors">
                                <X className="size-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-ink-muted">Goal Title</label>
                                <input 
                                    name="title" 
                                    value={formData.title || ""} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="e.g., New Tractor" 
                                    className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-ink-muted">Target (₹)</label>
                                    <input 
                                        name="targetAmount" 
                                        type="number" 
                                        value={formData.targetAmount || ""} 
                                        onChange={handleChange} 
                                        required 
                                        min="1"
                                        className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-ink-muted">Saved (₹)</label>
                                    <input 
                                        name="currentSaved" 
                                        type="number" 
                                        value={formData.currentSaved || ""} 
                                        onChange={handleChange} 
                                        required 
                                        min="0"
                                        className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-ink-muted">Target Date</label>
                                    <input 
                                        name="targetDate" 
                                        type="date" 
                                        value={formData.targetDate || ""} 
                                        onChange={handleChange} 
                                        required 
                                        className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-ink-muted">Category</label>
                                    <select 
                                        name="category" 
                                        value={formData.category || "business"} 
                                        onChange={handleChange} 
                                        className="w-full bg-[#fdfbf7] border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint/10 rounded-xl px-4 py-3 text-forest font-bold outline-none transition-all appearance-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="submit" 
                                    disabled={mutation.isPending}
                                    className="flex-1 bg-orange hover:bg-orange-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95"
                                >
                                    {mutation.isPending ? "Saving..." : "Save Goal"}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={closeForm}
                                    className="px-6 bg-cream hover:bg-sage/20 text-forest font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
