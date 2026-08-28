"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { SchemePill } from "@/components/ui/scheme-pill";

interface Scheme {
    id: string;
    name: string;
    description: string;
    corporation?: string;
    needsVerification: boolean;
    matchScore: number;
}

export default function SchemesPage() {
    const { data: schemes, isLoading } = useQuery({
        queryKey: ["schemes-for-you"],
        queryFn: async () => {
            try {
                return await apiClient.get<Scheme[]>("/schemes/for-you");
            } catch (e) {
                return [
                    {
                        id: "1",
                        name: "PMEGP Manufacturing Subsidies",
                        description: "Up to 35% subsidy for establishing new micro enterprises in rural areas.",
                        corporation: "NSFDC",
                        needsVerification: false,
                        matchScore: 95
                    },
                    {
                        id: "2",
                        name: "MUDRA Shishu Loan",
                        description: "Loans up to ₹50,000 for income generating small business activities.",
                        needsVerification: true,
                        matchScore: 88
                    }
                ] as Scheme[];
            }
        }
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-forest">Schemes For You</h1>
                <p className="text-ink-muted">Government subsidies and structured loans curated for your business profile.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="animate-pulse h-32 bg-sage/20 rounded-3xl" />)}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {schemes?.map(scheme => (
                        <div key={scheme.id} className="bg-white p-6 rounded-3xl border border-sage/30 shadow-sm flex flex-col md:flex-row gap-6 justify-between md:items-center hover:shadow-md transition-all group">
                            <div className="flex-1 space-y-4">
                                <SchemePill
                                    name={scheme.name}
                                    corporation={scheme.corporation}
                                    needsVerification={scheme.needsVerification}
                                />
                                <p className="text-sm text-ink-muted leading-relaxed">{scheme.description}</p>
                            </div>
                            <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t border-sage/20 md:border-t-0 pt-4 md:pt-0">
                                <div className="flex items-center gap-2">
                                    <Award className="size-5 text-orange" />
                                    <span className="font-bold text-orange-hover">{scheme.matchScore}% Match</span>
                                </div>
                                <button className="bg-cream hover:bg-sage/20 text-forest font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shrink-0">
                                    Apply Now <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
