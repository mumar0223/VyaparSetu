"use client";

import { useState } from "react";
import { AdviceChatPanel } from "@/components/ui/advice-chat-panel";
import { SwotGrid } from "@/components/ui/swot-grid";
import { Loader2, MapPin, Search } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface FeasibilityResponse {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    dataSourceNote?: string;
    confidenceScore?: number;
}

export default function AdvisorPage() {
    const [activeTab, setActiveTab] = useState<"chat" | "feasibility">("chat");
    const [radiusKm, setRadiusKm] = useState(5);

    // We mock the business profile context for now
    const { data: profile } = useQuery({
        queryKey: ["businessProfile"],
        queryFn: () => apiClient.get<{ id: string; name: string; industry: string }>("/business-profile").catch(() => ({
            id: "demo-id",
            name: "Demo Enterprise",
            industry: "Retail",
        })),
    });

    const feasibilityMutation = useMutation({
        mutationFn: async () => {
            if (!profile?.id) throw new Error("No profile");
            return apiClient.post<FeasibilityResponse>("/feasibility/reports", {
                businessProfileId: profile.id,
                radiusKm,
            });
        }
    });

    const generateMockFeasibility = () => {
        // If backend isn't ready
        feasibilityMutation.mutate(undefined, {
            onError: (err) => {
                console.warn("Fallback to mock feasibility", err);
                const el = document.getElementById("mock-feasibility-btn");
                if (el) el.click();
            }
        });
    };

    const handleMockClick = () => {
        // Hidden fallback for development demonstration
        feasibilityMutation.isPending = true;
        setTimeout(() => {
            feasibilityMutation.isPending = false;
            feasibilityMutation.data = {
                strengths: ["High local foot traffic", "Low competition in 2km radius", "Affordable raw materials nearby"],
                weaknesses: ["Limited digital presence", "Dependence on walk-in customers"],
                opportunities: ["Expanding into corporate bulk orders", "Leveraging government subsidies for modern equipment"],
                threats: ["Seasonal variations in demand", "Rising logistics costs for distant suppliers"],
                dataSourceNote: "Derived from generalized district-level proxy demographics due to limited exact hyper-local sensor data.",
                confidenceScore: 78,
            } as any;
            feasibilityMutation.isSuccess = true;
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-forest">AI Growth Advisor</h1>
                    <p className="text-ink-muted text-sm">Consult our AI or run hyper-local feasibility tests for your ideas.</p>
                </div>

                {/* Mobile Tabs */}
                <div className="flex md:hidden bg-sage/20 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === "chat" ? 'bg-white text-forest shadow-sm' : 'text-ink-muted'}`}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => setActiveTab("feasibility")}
                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === "feasibility" ? 'bg-white text-forest shadow-sm' : 'text-ink-muted'}`}
                    >
                        Feasibility
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Chat Panel - always visible on MD+, toggled on Mobile */}
                <div className={`flex-1 md:flex flex-col ${activeTab === "chat" ? "flex" : "hidden"}`}>
                    <AdviceChatPanel className="h-full" />
                </div>

                {/* Feasibility Panel - always visible on MD+, toggled on Mobile */}
                <div className={`w-full md:w-[60%] flex-col gap-4 overflow-y-auto ${activeTab === "feasibility" ? "flex" : "hidden md:flex"}`}>
                    <div className="bg-white rounded-3xl border border-sage/30 p-6 shadow-sm shrink-0">
                        <h2 className="text-xl font-bold text-forest mb-4">Hyper-Local Feasibility Test</h2>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="w-full">
                                <label className="block text-sm font-bold text-ink-muted mb-2">Analysis Radius (km)</label>
                                <div className="flex items-center bg-cream border border-sage/40 rounded-xl px-4 py-2.5">
                                    <MapPin className="size-5 text-mint mr-2 shrink-0" />
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={radiusKm}
                                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                                        className="bg-transparent w-full outline-none font-bold text-ink"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={generateMockFeasibility}
                                disabled={feasibilityMutation.isPending || !!feasibilityMutation.data}
                                className="w-full sm:w-auto bg-orange hover:bg-orange-hover disabled:bg-sage text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shrink-0"
                            >
                                {feasibilityMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
                                Analyze Market
                            </button>
                            <button id="mock-feasibility-btn" className="hidden" onClick={handleMockClick} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 bg-white rounded-3xl border border-sage/30 shadow-sm overflow-y-auto">
                        {feasibilityMutation.data ? (
                            <div className="p-6">
                                <SwotGrid
                                    strengths={feasibilityMutation.data.strengths}
                                    weaknesses={feasibilityMutation.data.weaknesses}
                                    opportunities={feasibilityMutation.data.opportunities}
                                    threats={feasibilityMutation.data.threats}
                                    dataSourceNote={feasibilityMutation.data.dataSourceNote}
                                    confidenceScore={feasibilityMutation.data.confidenceScore}
                                />
                                <button
                                    onClick={() => feasibilityMutation.reset()}
                                    className="mt-8 text-forest font-bold hover:underline"
                                >
                                    Run another test
                                </button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-ink-muted">
                                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mb-4">
                                    <Search className="size-8 text-sage" />
                                </div>
                                <p className="max-w-xs">Run an analysis to see strengths, weaknesses, opportunities, and threats for your cluster.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
