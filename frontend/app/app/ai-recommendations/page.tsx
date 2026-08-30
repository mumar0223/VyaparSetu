"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    Sparkles, TrendingUp, Lightbulb, ArrowRight, BrainCircuit,
    CheckCircle2, Flame, Zap, Award, Briefcase
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface AIRecommendation {
    id: string;
    category: "growth" | "efficiency" | "finance" | "schemes";
    priority: "high" | "medium" | "opportunity";
    title: string;
    description: string;
    projectedBenefit: string;
    action: string;
    confidence: number;
    reasoning: string[];
}

const FILTERS = ["All", "Growth", "Finance", "Efficiency", "Govt Schemes"];

const mockRecommendations: AIRecommendation[] = [
    {
        id: "1",
        category: "growth",
        priority: "high",
        title: "Expand to neighboring cluster",
        description: "Based on your logistics expenses, servicing the eastern cluster directly could significantly increase margins.",
        projectedBenefit: "+12% Profit Margin",
        action: "Launch targeted marketing in Eastern cluster over next 30 days.",
        confidence: 89,
        reasoning: ["Logistics expense patterns", "High search volume in target area", "Competitor gap analysis"]
    },
    {
        id: "2",
        category: "finance",
        priority: "medium",
        title: "Optimize Inventory Holding",
        description: "You are holding more inventory than average local demand signals suggest.",
        projectedBenefit: "₹3,200/month savings",
        action: "Reduce spice and perishables inventory by 15% immediately.",
        confidence: 94,
        reasoning: ["Cash flow records", "Local mandi seasonal trends", "Historical demand curve"]
    },
    {
        id: "3",
        category: "efficiency",
        priority: "high",
        title: "Shift to Digital Payments",
        description: "High cash flow handling is causing reconciliation delays and limiting your credit footprint.",
        projectedBenefit: "Credit profile generation",
        action: "Introduce UPI QR at storefront and mandate for transactions > ₹500.",
        confidence: 98,
        reasoning: ["Reconciliation mismatch history", "Customer demographic shift", "Bank API integration ready"]
    },
    {
        id: "4",
        category: "schemes",
        priority: "opportunity",
        title: "PMEGP Subsidy Match",
        description: "Your business profile is fully eligible for the Prime Minister's Employment Generation Programme.",
        projectedBenefit: "Up to 35% subsidy",
        action: "Apply for manufacturing capacity expansion loan.",
        confidence: 100,
        reasoning: ["Business sector: Manufacturing", "Rural location verified", "Aadhaar / GST linked"]
    }
];

export default function RecommendationsPage() {
    const [activeFilter, setActiveFilter] = useState("All");

    const { data: recommendations, isLoading } = useQuery({
        queryKey: ["ai-recommendations"],
        queryFn: async () => {
            try {
                const res = await apiClient.get<AIRecommendation[]>("/ai/recommendations");
                return res.length > 0 ? res : mockRecommendations;
            } catch (e) {
                return mockRecommendations;
            }
        }
    });

    const filteredRecs = recommendations?.filter(rec => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Govt Schemes") return rec.category === "schemes";
        return rec.category.toLowerCase() === activeFilter.toLowerCase();
    }) || [];

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "high":
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200"><Flame className="size-3.5" /> High Priority</span>;
            case "medium":
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-bold border border-orange/20"><Zap className="size-3.5" /> Medium Priority</span>;
            case "opportunity":
                return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/10 text-mint text-xs font-bold border border-mint/20"><Lightbulb className="size-3.5" /> Opportunity</span>;
            default:
                return null;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "growth": return <TrendingUp className="size-5 text-mint" />;
            case "finance": return <Briefcase className="size-5 text-orange" />;
            case "efficiency": return <Sparkles className="size-5 text-purple-500" />;
            case "schemes": return <Award className="size-5 text-blue-500" />;
            default: return <Lightbulb className="size-5 text-forest" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-4 px-4 sm:px-6">
            
            {/* AI Insights Summary Widget */}
            <div className="bg-forest rounded-[2rem] p-8 md:p-10 relative overflow-hidden text-white shadow-lg">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mint/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    <div className="space-y-3">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold flex items-center gap-3">
                            <Sparkles className="size-8 text-mint" /> VyaparSetu AI Insights
                        </h2>
                        <p className="text-white/80 font-medium text-lg max-w-lg leading-relaxed">
                            Proactive financial intelligence and actionable copilot recommendations generated from your business footprint.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-10 gap-y-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl md:text-4xl font-bold text-mint">3</span>
                            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">High Impact Ops</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/10 pl-10">
                            <span className="text-3xl md:text-4xl font-bold text-orange">₹8,500</span>
                            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Monthly Savings</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/10 pl-10">
                            <span className="text-3xl md:text-4xl font-bold text-white">2</span>
                            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Govt Schemes</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-white/10 pl-10">
                            <span className="text-3xl md:text-4xl font-bold text-white">1</span>
                            <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Credit Op</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
                {FILTERS.map(filter => (
                    <button 
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                            activeFilter === filter 
                            ? "bg-forest border-forest text-white shadow-md" 
                            : "bg-white border-sage/30 text-ink hover:border-mint hover:text-forest"
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Recommendations Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="animate-pulse h-80 bg-sage/20 rounded-3xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredRecs.map(rec => (
                        <div key={rec.id} className="bg-white p-7 rounded-[2rem] border border-sage/30 shadow-sm flex flex-col relative group transition-all duration-300 hover:shadow-lg hover:border-mint/30 hover:-translate-y-1">
                            
                            {/* Header: Priority & Category */}
                            <div className="flex justify-between items-start mb-5">
                                {getPriorityBadge(rec.priority)}
                                <div className="p-2.5 rounded-xl bg-cream border border-sage/20">
                                    {getCategoryIcon(rec.category)}
                                </div>
                            </div>

                            {/* Title & Description */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-serif font-bold text-forest mb-2 leading-tight">{rec.title}</h3>
                                <p className="text-sm font-medium text-ink-muted leading-relaxed">{rec.description}</p>
                            </div>

                            {/* Actionable Benefit Box */}
                            <div className="bg-mint-pale/40 rounded-2xl p-5 border border-mint/20 flex flex-col gap-4 mb-6">
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold uppercase tracking-wider text-forest/70">Recommended Action</span>
                                        <span className="text-xs font-bold text-orange bg-orange/10 px-2 py-0.5 rounded-md border border-orange/20">AI Confidence: {rec.confidence}%</span>
                                    </div>
                                    <p className="font-bold text-forest text-sm md:text-base">{rec.action}</p>
                                </div>
                                <div className="pt-3 border-t border-mint/10 flex justify-between items-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-forest/70">Potential Benefit</span>
                                    <span className="font-bold text-mint text-base">{rec.projectedBenefit}</span>
                                </div>
                            </div>

                            {/* AI Reasoning */}
                            <div className="space-y-3 mb-8">
                                <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">Why am I seeing this?</span>
                                <ul className="space-y-2">
                                    {rec.reasoning.map(r => (
                                        <li key={r} className="flex items-start gap-2.5 text-sm font-semibold text-forest/90">
                                            <CheckCircle2 className="size-4 text-mint shrink-0 mt-0.5" />
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Interactive Buttons */}
                            <div className="flex gap-3 pt-5 border-t border-sage/20 mt-auto">
                                <button 
                                    onClick={() => toast.success("AI Execution Plan Generated", { description: "The step-by-step implementation guide has been sent to your inbox." })} 
                                    className="flex-1 bg-forest hover:bg-forest/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95 text-sm flex justify-center items-center gap-2 group/btn"
                                >
                                    View Plan <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => toast("AI Copilot Initialized", { icon: "🧠", description: "I am analyzing this recommendation. How can I help you implement it?" })} 
                                    className="flex-1 bg-cream hover:bg-sage/20 text-forest font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95 text-sm flex justify-center items-center gap-2"
                                >
                                    <BrainCircuit className="size-4" /> Ask AI
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
