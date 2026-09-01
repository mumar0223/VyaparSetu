"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bot,
  TrendingUp,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Store,
  Compass,
  Factory,
  Wrench,
  Truck,
  Sun,
  Palette,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ALL_INDIAN_STATES_DATA, getDistrictGeo } from "@/lib/api/district-data";

export interface RecProfile {
  id?: string;
  businessName: string;
  category?: string | null;
  industry?: string | null;
  annualRevenue?: number | null;
  monthlyExpenses?: number | null;
  calculatedMonthlyExpenses?: number | null;
  totalSavedLiquidity?: number | null;
  city?: string | null;
  state?: string | null;
}

interface PredictedBusiness {
  id: string;
  rank: number;
  title: string;
  sector: string;
  matchScore: number;
  summary: string;
  capitalRequired: {
    min: number;
    max: number;
    formatted: string;
  };
  monthlyProfit: {
    min: number;
    max: number;
    formatted: string;
    marginPercentage: number;
  };
  paybackPeriodMonths: number;
  whyInThisDistrict: string;
  udyamAlignment?: string;
  matchedSubsidies: {
    name: string;
    percentage: string;
    details: string;
    portalUrl?: string;
  }[];
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  executionSteps: string[];
}

interface Playbook {
  id: string;
  title: string;
  category: "SUBSIDY" | "CASHFLOW" | "CREDIT" | "INVENTORY" | "GROWTH";
  impact: "HIGH" | "MEDIUM";
  roi: string;
  timeline: string;
  description: string;
  steps: string[];
  actionRoute?: string;
}

const SECTOR_OPTIONS = [
  { label: "All Sectors (Highest ROI & Fit)", value: "Any / All Sectors (Highest ROI)", icon: Compass },
  { label: "Manufacturing & Fabrication", value: "Manufacturing & Fabrication", icon: Factory },
  { label: "Packaging & Corrugated Boxes", value: "Packaging & Paper Products", icon: Package },
  { label: "Food Processing & FMCG", value: "Food Processing & FMCG", icon: Store },
  { label: "Retail & Wholesale Trade", value: "Retail & Wholesale Distribution", icon: TrendingUp },
  { label: "Services, Workshop & EV Repair", value: "Services, Workshop & Technical Repair", icon: Wrench },
  { label: "Solar & Clean Energy Systems", value: "Solar Energy & Infrastructure", icon: Sun },
  { label: "Logistics, Fleet & Storage", value: "Logistics, Warehousing & Fleet", icon: Truck },
  { label: "Handicrafts & Artisans (Vishwakarma)", value: "Handicrafts & Artisans (PM Vishwakarma)", icon: Palette },
];

export interface InitialPredictionData {
  district: string;
  state: string;
  budget: number;
  category: string;
  riskLevel: string;
  predictions: PredictedBusiness[];
  districtSummary: string;
  liveMandiInsight: string;
  mandiRecords: any[];
}

export interface InitialPlaybookData {
  playbooks: Playbook[];
  enterpriseSummary: string;
}

export function RecommendationsClient({
  profile,
  initialPredictionData,
  initialPlaybookData,
}: {
  profile: RecProfile | null;
  initialPredictionData?: InitialPredictionData | null;
  initialPlaybookData?: InitialPlaybookData | null;
}) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"predictor" | "playbooks">("predictor");

  // Predictor Parameters
  const initialDistrict = initialPredictionData?.district || profile?.city || "Pune";
  const initialGeo = getDistrictGeo(initialDistrict, initialPredictionData?.state || profile?.state || "Maharashtra");

  const [selectedState, setSelectedState] = useState<string>(initialPredictionData?.state || profile?.state || "Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialGeo.name);
  const [budget, setBudget] = useState<number>(initialPredictionData?.budget || profile?.totalSavedLiquidity || 250000);
  const [categoryPref, setCategoryPref] = useState<string>(initialPredictionData?.category || "Any / All Sectors (Highest ROI)");
  const [riskAppetite, setRiskAppetite] = useState<string>(initialPredictionData?.riskLevel || "Moderate");

  // Stream State
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [districtSummary, setDistrictSummary] = useState<string>(initialPredictionData?.districtSummary || "");
  const [liveMandiInsight, setLiveMandiInsight] = useState<string>(initialPredictionData?.liveMandiInsight || "");
  const [mandiRecords, setMandiRecords] = useState<any[]>(initialPredictionData?.mandiRecords || []);
  const [predictions, setPredictions] = useState<PredictedBusiness[]>(initialPredictionData?.predictions || []);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Playbooks State
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isLoadingPlaybooks, setIsLoadingPlaybooks] = useState<boolean>(false);
  const [playbooks, setPlaybooks] = useState<Playbook[]>(initialPlaybookData?.playbooks || []);
  const [enterpriseSummary, setEnterpriseSummary] = useState<string>(initialPlaybookData?.enterpriseSummary || "");

  const currentDistrictsList =
    ALL_INDIAN_STATES_DATA.find((s) => s.state === selectedState)?.districts || [];

  useEffect(() => {
    if (!initialPredictionData || !initialPredictionData.predictions.length) {
      runStreamingDistrictPrediction();
    }
    if (!initialPlaybookData || !initialPlaybookData.playbooks.length) {
      fetchPlaybooks();
    }
  }, []);

  // Progressive Card Streaming Execution
  const runStreamingDistrictPrediction = async () => {
    setIsPredicting(true);
    setPredictions([]); // Clear existing cards to show incoming stream

    try {
      const response = await fetch("/api/ai/district-business/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: selectedState,
          district: selectedDistrict,
          budget,
          category: categoryPref,
          riskLevel: riskAppetite,
        }),
      });

      if (!response.body) {
        throw new Error("No stream body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "district_pulse") {
              setDistrictSummary(event.districtSummary || "");
              setLiveMandiInsight(event.liveMandiInsight || "");
              setMandiRecords(event.mandiRecords || []);
            } else if (event.type === "card" && event.card) {
              setPredictions((prev) => {
                const exists = prev.some((p) => p.id === event.card.id || p.rank === event.card.rank);
                if (exists) return prev;
                return [...prev, event.card];
              });
            }
          } catch {}
        }
      }

      toast.success(`Market analysis stream complete for ${selectedDistrict}!`);
    } catch {
      toast.error("Error streaming district prediction.");
    } finally {
      setIsPredicting(false);
    }
  };

  const fetchPlaybooks = async () => {
    setIsLoadingPlaybooks(true);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: profile?.businessName,
          category: profile?.category,
          city: profile?.city || selectedDistrict,
          state: profile?.state || selectedState,
          monthlyExpenses: profile?.calculatedMonthlyExpenses || profile?.monthlyExpenses || 65000,
          annualRevenue: profile?.annualRevenue || 1200000,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlaybooks(data.playbooks || []);
        setEnterpriseSummary(data.enterpriseSummary || "");
      }
    } catch {} finally {
      setIsLoadingPlaybooks(false);
    }
  };

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const stateObj = ALL_INDIAN_STATES_DATA.find((s) => s.state === stateName);
    if (stateObj && stateObj.districts.length > 0) {
      setSelectedDistrict(stateObj.districts[0].name);
    }
  };

  const handleToggleStep = (stepKey: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepKey]: !prev[stepKey] };
      if (next[stepKey]) {
        toast.success("Action step completed!");
      }
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPlaybooks =
    selectedCategory === "ALL"
      ? playbooks
      : playbooks.filter((r) => r.category === selectedCategory);

  const budgetPresets = [50000, 100000, 250000, 500000, 1000000, 2500000];

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Compass className="size-7 text-mint" /> District Business Predictor & Playbooks
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time market analytics, live APMC Mandi rates, and UDYAM MSME intelligence tailored to your budget
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/scanner"
            className="px-3.5 py-2 bg-white dark:bg-card border border-sage/40 dark:border-border text-foreground hover:bg-cream dark:hover:bg-muted/40 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <MapPin className="size-3.5 text-mint" />
            <span>SWOT Geospatial Scanner</span>
          </Link>
          <Link
            href="/schemes-for-you"
            className="px-3.5 py-2 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="size-3.5" />
            <span>Govt Subsidies</span>
          </Link>
        </div>
      </div>

      {/* Main Switchable Tabs */}
      <div className="flex items-center gap-3 border-b border-sage/30 dark:border-border pb-3 mb-6 shrink-0">
        <button
          onClick={() => setActiveTab("predictor")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "predictor"
              ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
              : "bg-white dark:bg-card border border-sage/40 dark:border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="size-4" />
          <span>District Best Business Predictor</span>
        </button>

        <button
          onClick={() => setActiveTab("playbooks")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "playbooks"
              ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
              : "bg-white dark:bg-card border border-sage/40 dark:border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="size-4" />
          <span>Strategic Action Playbooks ({playbooks.length})</span>
        </button>
      </div>

      {/* TAB 1: DISTRICT BEST BUSINESS PREDICTOR */}
      {activeTab === "predictor" && (
        <div className="space-y-6">
          {/* Interactive Parameters Panel with Shadcn DropdownMenu */}
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-sage/20 dark:border-border">
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-forest dark:text-foreground flex items-center gap-2">
                  <MapPin className="size-5 text-mint" /> District & Investment Capital Parameters
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select any Indian district and budget to predict high-margin, subsidy-supported business models across all industries.
                </p>
              </div>
              <span className="text-[11px] font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-3 py-1 rounded-full border border-mint/20 self-start sm:self-auto">
                Live Stream Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* State Selector (Shadcn DropdownMenu) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  State
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream/70 dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-mint cursor-pointer text-left">
                    <span className="truncate">{selectedState}</span>
                    <ChevronDown className="size-4 opacity-60 shrink-0 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-72 overflow-y-auto w-64 p-2">
                    <DropdownMenuLabel>Select State</DropdownMenuLabel>
                    {ALL_INDIAN_STATES_DATA.map((s) => (
                      <DropdownMenuItem
                        key={s.state}
                        onClick={() => handleStateChange(s.state)}
                        className={`cursor-pointer px-3 py-2 rounded-xl transition-all ${
                          selectedState === s.state
                            ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint font-bold border border-mint/30"
                            : "hover:bg-cream dark:hover:bg-muted/50"
                        }`}
                      >
                        {s.state}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* District Selector (Shadcn DropdownMenu - All Real Districts) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  District ({currentDistrictsList.length} Districts)
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream/70 dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-mint cursor-pointer text-left">
                    <span className="truncate">{selectedDistrict}</span>
                    <ChevronDown className="size-4 opacity-60 shrink-0 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-80 overflow-y-auto w-84 p-2">
                    <DropdownMenuLabel>Districts in {selectedState}</DropdownMenuLabel>
                    {currentDistrictsList.map((d) => (
                      <DropdownMenuItem
                        key={d.name}
                        onClick={() => setSelectedDistrict(d.name)}
                        className={`cursor-pointer flex flex-col items-start px-3 py-2 rounded-xl transition-all ${
                          selectedDistrict === d.name
                            ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint font-bold border border-mint/30"
                            : "hover:bg-cream dark:hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-xs font-bold text-foreground">{d.name}</span>
                        {d.odop && (
                          <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                            ODOP: {d.odop.split("(")[0].trim()}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sector Preference (Shadcn DropdownMenu) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Industry / Sector
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream/70 dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-mint cursor-pointer text-left">
                    <span className="truncate">
                      {SECTOR_OPTIONS.find((s) => s.value === categoryPref)?.label || categoryPref}
                    </span>
                    <ChevronDown className="size-4 opacity-60 shrink-0 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-80 overflow-y-auto w-80 p-2">
                    <DropdownMenuLabel>Target Industry Sector</DropdownMenuLabel>
                    {SECTOR_OPTIONS.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={() => setCategoryPref(s.value)}
                        className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                          categoryPref === s.value
                            ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint font-bold border border-mint/30"
                            : "hover:bg-cream dark:hover:bg-muted/50"
                        }`}
                      >
                        <s.icon className="size-3.5 text-mint shrink-0" />
                        <span className="text-xs">{s.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Risk Appetite (Shadcn DropdownMenu) */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Risk Level
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full flex items-center justify-between px-3.5 py-2.5 bg-cream/70 dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-mint cursor-pointer text-left">
                    <span className="truncate">{riskAppetite}</span>
                    <ChevronDown className="size-4 opacity-60 shrink-0 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60 p-2">
                    <DropdownMenuLabel>Risk & Horizon</DropdownMenuLabel>
                    {[
                      { label: "Low Risk (Fast Payback)", value: "Low Risk" },
                      { label: "Moderate (Balanced Margins)", value: "Moderate" },
                      { label: "High Growth (Asset Heavy)", value: "High Growth" },
                    ].map((r) => (
                      <DropdownMenuItem
                        key={r.value}
                        onClick={() => setRiskAppetite(r.value)}
                        className={`cursor-pointer px-3 py-2 rounded-xl transition-all ${
                          riskAppetite === r.value
                            ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint font-bold border border-mint/30"
                            : "hover:bg-cream dark:hover:bg-muted/50"
                        }`}
                      >
                        {r.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Investment Capital Slider & Presets */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-foreground">
                  Available Capital Budget (₹):
                </span>
                <span className="font-serif font-bold text-lg text-forest dark:text-mint">
                  ₹{budget.toLocaleString("en-IN")}
                </span>
              </div>

              <input
                type="range"
                min={25000}
                max={2500000}
                step={25000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-forest dark:accent-mint cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                <span className="text-[10px] text-muted-foreground font-bold shrink-0">Quick Presets:</span>
                {budgetPresets.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBudget(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      budget === amt
                        ? "bg-forest dark:bg-mint text-white dark:text-black"
                        : "bg-cream dark:bg-muted/50 text-muted-foreground hover:text-foreground border border-sage/30 dark:border-border"
                    }`}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>

            {/* Predict Button */}
            <button
              onClick={runStreamingDistrictPrediction}
              disabled={isPredicting}
              className="w-full py-3.5 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPredicting ? (
                <>
                  <Spinner className="size-4 text-white dark:text-black" />
                  <span>Streaming real-time district venture predictions...</span>
                </>
              ) : (
                <>
                  <Compass className="size-4" />
                  <span>Predict Best Businesses for {selectedDistrict} (₹{budget.toLocaleString("en-IN")})</span>
                </>
              )}
            </button>
          </div>

          {/* District Summary Callout */}
          {districtSummary && (
            <div className="bg-mint-pale/40 dark:bg-mint/10 border border-mint/30 rounded-2xl p-5 animate-in fade-in-50 duration-300">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-forest dark:bg-mint text-white dark:text-black flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="size-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-base text-forest dark:text-mint">
                    {selectedDistrict}, {selectedState} Market Feasibility Pulse
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">{districtSummary}</p>
                  {liveMandiInsight && (
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-mint/20 mt-2">
                      <strong className="text-forest dark:text-mint">Trade Dynamics:</strong> {liveMandiInsight}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Live APMC Mandi Rates from data.gov.in */}
          {mandiRecords.length > 0 && (
            <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Store className="size-3.5 text-mint" /> Live APMC Mandi Wholesale Rates ({selectedDistrict})
                </span>
                <span className="text-[10px] text-muted-foreground">Updated Daily</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {mandiRecords.slice(0, 6).map((rec, i) => (
                  <div
                    key={i}
                    className="bg-cream/60 dark:bg-muted/30 border border-sage/30 dark:border-border rounded-xl p-2.5 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-bold text-foreground truncate">{rec.commodity}</span>
                    <div className="mt-1">
                      <span className="text-xs font-bold text-forest dark:text-mint">
                        ₹{rec.modalPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[9px] text-muted-foreground block">/ quintal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progressive Streaming Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {predictions.map((pred) => {
              const isExpanded = expandedCards[pred.id];
              return (
                <div
                  key={pred.id}
                  className="bg-white dark:bg-card rounded-2xl border-2 border-sage/40 dark:border-border hover:border-mint/50 transition-all p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-in fade-in slide-in-from-bottom-3 duration-400"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-full bg-forest dark:bg-mint text-white dark:text-black font-bold text-xs flex items-center justify-center shrink-0">
                          #{pred.rank}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-md">
                          {pred.matchScore}% Match
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          pred.riskLevel === "LOW"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : pred.riskLevel === "MODERATE"
                            ? "bg-orange/10 text-orange"
                            : "bg-red-500/10 text-destructive"
                        }`}
                      >
                        {pred.riskLevel} RISK
                      </span>
                    </div>

                    {/* Title & Sector */}
                    <h3 className="font-serif font-bold text-base sm:text-lg text-forest dark:text-foreground mb-1 leading-snug">
                      {pred.title}
                    </h3>
                    <span className="text-[11px] font-medium text-muted-foreground block mb-3">
                      Sector: <strong className="text-foreground">{pred.sector}</strong>
                    </span>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {pred.summary}
                    </p>

                    {/* Financial Projection Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-cream/80 dark:bg-muted/40 rounded-xl p-3 border border-sage/30 dark:border-border mb-4 text-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                          Required Capital
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {pred.capitalRequired?.formatted || `₹${budget.toLocaleString("en-IN")}`}
                        </span>
                      </div>
                      <div className="border-x border-sage/30 dark:border-border">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                          Monthly Profit
                        </span>
                        <span className="text-xs font-bold text-forest dark:text-mint">
                          {pred.monthlyProfit?.formatted || "₹35,000/mo"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                          Payback Period
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          {pred.paybackPeriodMonths || 6} Months
                        </span>
                      </div>
                    </div>

                    {/* Why in this District Rationale */}
                    <div className="bg-sage/10 dark:bg-card/40 rounded-xl p-3 border border-sage/20 dark:border-border mb-4 text-xs">
                      <span className="text-[10px] uppercase font-bold text-forest dark:text-mint block mb-1">
                        📍 Why this works in {selectedDistrict}:
                      </span>
                      <p className="text-[11px] text-foreground/90 leading-relaxed">
                        {pred.whyInThisDistrict}
                      </p>
                    </div>

                    {/* Subsidies Badges */}
                    {pred.matchedSubsidies && pred.matchedSubsidies.length > 0 && (
                      <div className="space-y-1.5 mb-4">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Matched Government Subsidies:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {pred.matchedSubsidies.map((sub, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-orange/10 text-orange border border-orange/20 px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <Award className="size-3" />
                              <span>{sub.name} ({sub.percentage})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expandable Execution Steps */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-sage/20 dark:border-border space-y-2 mb-4">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Launch Execution Steps:
                        </span>
                        {pred.executionSteps?.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-foreground">
                            <CheckCircle2 className="size-3.5 text-mint shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-sage/20 dark:border-border">
                    <button
                      onClick={() => toggleExpand(pred.id)}
                      className="flex-1 py-2 bg-cream/80 dark:bg-muted/40 hover:bg-cream dark:hover:bg-muted border border-sage/30 dark:border-border text-foreground font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <span>Hide Roadmap</span> <ChevronUp className="size-3.5" />
                        </>
                      ) : (
                        <>
                          <span>View Launch Steps</span> <ChevronDown className="size-3.5" />
                        </>
                      )}
                    </button>

                    <Link
                      href="/schemes-for-you"
                      className="py-2 px-3.5 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Apply Subsidy</span> <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* If streaming is active and fewer than 4 cards, show pending skeleton */}
            {isPredicting && predictions.length < 4 && (
              <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-mint/40 dark:border-border p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
                <Spinner className="size-8 text-mint" />
                <span className="text-xs font-bold text-muted-foreground">
                  Synthesizing Card #{predictions.length + 1} for {selectedDistrict}...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STRATEGIC AI ACTION PLAYBOOKS */}
      {activeTab === "playbooks" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
              {["ALL", "SUBSIDY", "CASHFLOW", "CREDIT", "INVENTORY", "GROWTH"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
                      : "bg-white dark:bg-card border border-sage/40 dark:border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={fetchPlaybooks}
              disabled={isLoadingPlaybooks}
              className="px-4 py-2 bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted text-foreground font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              {isLoadingPlaybooks ? <Spinner className="size-3.5 text-mint" /> : <RefreshCw className="size-3.5 text-mint" />}
              <span>Regenerate Playbooks</span>
            </button>
          </div>

          {/* Enterprise Context Summary */}
          {enterpriseSummary && (
            <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-4 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-forest dark:bg-mint text-white dark:text-black flex items-center justify-center shrink-0">
                  <Bot className="size-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Strategic Enterprise Focus ({profile?.businessName || "My Enterprise"} in {profile?.city || "Pune"})
                  </span>
                  <p className="text-xs font-medium text-foreground">{enterpriseSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingPlaybooks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Skeleton className="h-64 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
              <Skeleton className="h-64 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
              <Skeleton className="h-64 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
              <Skeleton className="h-64 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
            </div>
          )}

          {/* Playbooks Grid */}
          {!isLoadingPlaybooks && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPlaybooks.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white/40 dark:bg-card/40 rounded-2xl border border-sage/20 dark:border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Badges Bar */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            rec.impact === "HIGH"
                              ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint"
                              : "bg-orange/10 dark:bg-orange/20 text-orange"
                          }`}
                        >
                          {rec.impact} IMPACT
                        </span>
                        <span className="text-[10px] font-bold bg-cream dark:bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md">
                          {rec.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {rec.timeline}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base sm:text-lg text-forest dark:text-foreground mb-2">
                      {rec.title}
                    </h3>

                    <div className="bg-cream dark:bg-muted/40 rounded-xl p-3 mb-3 border border-sage/30 dark:border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Estimated Financial Impact:</span>
                      <span className="font-bold text-forest dark:text-mint">{rec.roi}</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{rec.description}</p>

                    {/* Action Checklist */}
                    <div className="space-y-2 mb-4 border-t border-sage/20 dark:border-border pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Implementation Steps:
                      </span>
                      {rec.steps?.map((step, idx) => {
                        const key = `${rec.id}-${idx}`;
                        const isDone = completedSteps[key];
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleStep(key)}
                            className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none"
                          >
                            <div
                              className={`size-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                isDone
                                  ? "bg-forest dark:bg-mint border-forest dark:border-mint text-white dark:text-black"
                                  : "border-sage/50 dark:border-border bg-white dark:bg-card"
                              }`}
                            >
                              {isDone && <CheckCircle2 className="size-3" />}
                            </div>
                            <span className={isDone ? "line-through text-muted-foreground" : "font-medium"}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Link
                    href={rec.actionRoute || "/schemes-for-you"}
                    className="w-full py-2.5 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Execute Playbook</span> <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
