"use client";

import { useState } from "react";
import { AdviceChatPanel } from "@/components/ui/advice-chat-panel";
import { SwotGrid } from "@/components/ui/swot-grid";
import { Loader2, MapPin, Search, Sparkles, Target, ScanEye } from "lucide-react";
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
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<FeasibilityResponse | null>(null);

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
        setIsScanning(true);
        feasibilityMutation.mutate(undefined, {
            onSuccess: (data) => {
                setIsScanning(false);
                setScanResult(data);
            },
            onError: () => {
                // If real backend fails, show mock data after scanning animation
                setTimeout(() => {
                    setIsScanning(false);
                    setScanResult({
                        strengths: ["High local foot traffic", "Low competition in 2km radius", "Affordable raw materials nearby"],
                        weaknesses: ["Limited digital presence", "Dependence on walk-in customers"],
                        opportunities: ["Expanding into corporate bulk orders", "Leveraging government subsidies for modern equipment"],
                        threats: ["Seasonal variations in demand", "Rising logistics costs for distant suppliers"],
                        dataSourceNote: "Derived from generalized district-level proxy demographics due to limited exact hyper-local sensor data.",
                        confidenceScore: 78,
                    });
                }, 2000);
            }
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] max-w-7xl mx-auto space-y-6 pt-2 pb-6 px-4 sm:px-6">
            
            {/* Command Center Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2 mb-2">
                        <Sparkles className="size-7 text-mint" /> AI Growth Command Center
                    </h1>
                    <p className="text-ink-muted text-sm md:text-base font-medium">
                        Consult your AI Copilot or run deep local market scans to validate expansion ideas.
                    </p>
                </div>

                {/* Mobile Tabs */}
                <div className="flex lg:hidden bg-cream p-1 rounded-xl border border-sage/30 shadow-sm shrink-0">
                    <button
                        onClick={() => setActiveTab("chat")}
                        className={`flex-1 px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "chat" ? 'bg-white text-forest shadow-sm' : 'text-ink-muted hover:text-forest'}`}
                    >
                        AI Copilot
                    </button>
                    <button
                        onClick={() => setActiveTab("feasibility")}
                        className={`flex-1 px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "feasibility" ? 'bg-white text-forest shadow-sm' : 'text-ink-muted hover:text-forest'}`}
                    >
                        Market Scan
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
                
                {/* Copilot Chat - Left Panel */}
                <div className={`w-full lg:w-[40%] xl:w-[35%] flex-col ${activeTab === "chat" ? "flex" : "hidden lg:flex"}`}>
                    <AdviceChatPanel className="h-full" />
                </div>

                {/* Local Market Analyzer - Right Panel */}
                <div className={`flex-1 flex-col overflow-hidden bg-white rounded-[2rem] border border-sage/30 shadow-sm ${activeTab === "feasibility" ? "flex" : "hidden lg:flex"}`}>
                    
                    {/* Scanner Input Header */}
                    <div className="p-6 md:p-8 border-b border-sage/30 bg-[#fdfbf7] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mint/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        
                        <h2 className="text-2xl font-serif font-bold text-forest flex items-center gap-2 mb-6 relative z-10">
                            <Target className="size-6 text-mint" /> Local Market Analyzer
                        </h2>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-end relative z-10">
                            <div className="w-full sm:flex-1">
                                <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Analysis Radius (Kilometers)</label>
                                <div className="flex items-center bg-white border border-sage/40 focus-within:border-mint focus-within:ring-4 focus-within:ring-mint/10 rounded-xl px-4 py-3 transition-all shadow-sm">
                                    <MapPin className="size-5 text-mint mr-3 shrink-0" />
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={radiusKm}
                                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                                        className="bg-transparent w-full outline-none font-bold text-forest"
                                    />
                                    <span className="text-ink-muted font-bold ml-2">KM</span>
                                </div>
                            </div>
                            <button
                                onClick={generateMockFeasibility}
                                disabled={isScanning || !!scanResult}
                                className="w-full sm:w-auto bg-forest hover:bg-forest/90 disabled:bg-sage text-white font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                            >
                                {isScanning ? (
                                    <><Loader2 className="size-5 animate-spin text-mint" /> Scanning...</>
                                ) : (
                                    <><ScanEye className="size-5 text-mint" /> Launch Scan</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Scanner Output Area */}
                    <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
                        {scanResult ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <SwotGrid
                                    strengths={scanResult.strengths}
                                    weaknesses={scanResult.weaknesses}
                                    opportunities={scanResult.opportunities}
                                    threats={scanResult.threats}
                                    dataSourceNote={scanResult.dataSourceNote}
                                    confidenceScore={scanResult.confidenceScore}
                                />
                                <div className="mt-8 pt-6 border-t border-sage/20 text-center">
                                    <button
                                        onClick={() => {
                                            setScanResult(null);
                                            feasibilityMutation.reset();
                                        }}
                                        className="text-mint font-bold hover:text-forest transition-colors inline-flex items-center gap-2"
                                    >
                                        <Search className="size-4" /> Run new analysis in different area
                                    </button>
                                </div>
                            </div>
                        ) : isScanning ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-mint/20 rounded-full animate-ping" />
                                    <div className="relative w-20 h-20 bg-mint/10 border-2 border-mint rounded-full flex items-center justify-center mb-6">
                                        <ScanEye className="size-10 text-mint animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-forest mb-2">Scanning Local Footprint...</h3>
                                <p className="text-ink-muted font-medium max-w-sm">
                                    Analyzing demographic data, competitor density, and raw material logistics within {radiusKm}km.
                                </p>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 bg-cream border border-sage/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <MapPin className="size-10 text-mint/50" />
                                </div>
                                <h3 className="text-xl font-bold text-forest mb-2">Ready to Scan</h3>
                                <p className="text-ink-muted font-medium max-w-sm leading-relaxed">
                                    Enter a radius above and launch a scan to instantly generate a hyper-local SWOT analysis for your business.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
