"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, TrendingUp, Award, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STORIES = [
    {
        id: "1",
        category: "Woman Entrepreneur",
        name: "Sunita Devi",
        title: "Dairy Entrepreneur, Bihar",
        image: "/images/stories/sunita_devi_dairy.jpg",
        quote: "\"VyaparSetu helped me secure a MUDRA loan. I expanded from 2 cows to a micro milk-collection center in just 6 months.\"",
        schemeUsed: "MUDRA",
        aiRecommendation: "Expand to nearby cluster",
        outcomes: [
            { label: "Revenue", value: "+212%" },
            { label: "New Jobs Created", value: "4" }
        ]
    },
    {
        id: "2",
        category: "Farmer",
        name: "Ramesh Patil",
        title: "Turmeric Farmer, Maharashtra",
        image: "/images/stories/ramesh_patil_turmeric.jpg",
        quote: "\"I didn't know about the PMFME scheme for food processing. Now I process and package my own turmeric instead of selling raw.\"",
        schemeUsed: "PMFME",
        aiRecommendation: "Shift to value-added processing",
        outcomes: [
            { label: "Profit Margin", value: "+42%" },
            { label: "Market Reach", value: "3 States" }
        ]
    },
    {
        id: "3",
        category: "Artisan",
        name: "Kavita & Women's SHG",
        title: "Handicrafts, Odisha",
        image: "/images/stories/kavita_shg_handicrafts.jpg",
        quote: "\"The AI advisor matched our self-help group with a local bulk buyer. We bypassed middlemen completely.\"",
        schemeUsed: "PMEGP",
        aiRecommendation: "Shift to digital B2B sales",
        outcomes: [
            { label: "Group Revenue", value: "3x Growth" },
            { label: "Members Benefited", value: "15" }
        ]
    }
];

const FILTERS = ["All", "Farmer", "Woman Entrepreneur", "Artisan", "Shop Owner"];

export default function SuccessStoriesPage() {
    const [activeFilter, setActiveFilter] = useState("All");

    const filteredStories = STORIES.filter(story => 
        activeFilter === "All" || story.category === activeFilter
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 pt-4 px-4 sm:px-6">
            
            {/* Top Impact Banner */}
            <div className="bg-forest rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-mint/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2 bg-mint/20 rounded-xl border border-mint/30">
                        <TrendingUp className="size-6 text-mint" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Real Impact Generated</h2>
                        <p className="text-white/80 text-sm font-medium">Over <span className="text-mint font-bold">23 rural businesses</span> have scaled using VyaparSetu guidance this month.</p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-forest tracking-tight">
                    Rural Success Stories
                </h1>
                <p className="text-ink-muted text-base md:text-lg font-medium">
                    Get inspired by real entrepreneurs who transformed their local communities by applying AI insights and government schemes.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {FILTERS.map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border",
                            activeFilter === filter 
                                ? "bg-forest text-white border-forest shadow-md"
                                : "bg-white text-ink-muted border-sage/40 hover:border-mint hover:text-forest"
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStories.map(story => (
                    <div key={story.id} className="bg-white rounded-[2rem] border border-sage/30 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                        
                        {/* Image Header with Overlay */}
                        <div className="relative h-60 w-full overflow-hidden">
                            <Image
                                src={story.image}
                                alt={story.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/40 to-transparent" />
                            
                            <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                                <h3 className="font-serif font-bold text-2xl tracking-tight leading-tight">{story.name}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="size-1.5 bg-mint rounded-full" />
                                    <p className="text-sm font-medium text-white/80">{story.title}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col gap-6">
                            {/* Quote */}
                            <p className="text-forest font-medium italic leading-relaxed text-[15px]">
                                {story.quote}
                            </p>

                            {/* Features Used */}
                            <div className="space-y-3 pt-4 border-t border-sage/20">
                                <div className="flex items-start gap-2.5">
                                    <Award className="size-4 text-orange shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Scheme Used</p>
                                        <p className="text-sm font-bold text-forest">{story.schemeUsed}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <Sparkles className="size-4 text-mint shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">AI Recommendation Applied</p>
                                        <p className="text-sm font-bold text-forest">{story.aiRecommendation}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Outcomes Box */}
                            <div className="mt-auto bg-mint-pale border border-mint/20 rounded-2xl p-4">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <CheckCircle2 className="size-4 text-mint" />
                                    <h4 className="text-xs font-bold text-forest uppercase tracking-wider">Impact Outcome</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {story.outcomes.map((outcome, idx) => (
                                        <div key={idx}>
                                            <p className="text-[10px] font-bold text-forest/60 uppercase">{outcome.label}</p>
                                            <p className="text-lg font-bold text-mint">{outcome.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {filteredStories.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-sage/30">
                    <Users className="size-12 text-sage mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-forest">No stories found</h3>
                    <p className="text-ink-muted mt-2">Check back soon for more success stories in this category.</p>
                </div>
            )}

        </div>
    );
}
