"use client";

import { useState } from "react";
import {
  Award,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building,
  Landmark,
  ArrowRight,
  BadgeCheck,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  HelpCircle,
  TrendingUp,
  MapPin,
  IndianRupee,
  Sparkle,
} from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export interface SchemesBusinessProfile {
  id?: string;
  businessName: string;
  category?: string | null;
  industry?: string | null;
  annualRevenue?: number | null;
  monthlyExpenses?: number | null;
  totalSavedLiquidity?: number | null;
  city?: string | null;
  state?: string | null;
}

export interface MatchedSchemeItem {
  id: string;
  name: string;
  ministry: string;
  matchScore: number;
  subsidy: string;
  subsidyAmount?: string;
  maxLoan: string;
  capitalStructure?: {
    grant?: string;
    bankLoan?: string;
    ownerMargin?: string;
  };
  eligibleCategories: string[];
  description: string;
  whyEligible?: string;
  bankTips?: string;
  documents?: string[];
  applicationUrl: string;
  portalName?: string;
}

export interface InitialMatchData {
  schemes: MatchedSchemeItem[];
  summary: string;
  totalSubsidies: string;
  district: string;
  state: string;
  lastEvaluatedAt: string;
}

export function SchemesClient({
  profile,
  initialMatchData,
}: {
  profile: SchemesBusinessProfile | null;
  initialMatchData: InitialMatchData | null;
}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isReevaluating, setIsReevaluating] = useState<boolean>(false);
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});

  const [matchData, setMatchData] = useState<InitialMatchData | null>(initialMatchData);

  const handleReevaluateSchemes = async () => {
    setIsReevaluating(true);
    try {
      const res = await fetch("/api/ai/schemes/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: profile?.businessName,
          category: profile?.category,
          city: profile?.city || matchData?.district || "Pune",
          state: profile?.state || matchData?.state || "Maharashtra",
          annualRevenue: profile?.annualRevenue || 1200000,
          monthlyExpenses: profile?.monthlyExpenses || 65000,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMatchData(data.data);
        toast.success("Live government scheme eligibility re-evaluated & saved!");
      } else {
        toast.error("Failed to re-evaluate schemes.");
      }
    } catch {
      toast.error("Connection error running scheme evaluation.");
    } finally {
      setIsReevaluating(false);
    }
  };

  const toggleDocs = (id: string) => {
    setExpandedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const schemesList = matchData?.schemes || [];

  const filteredSchemes = schemesList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ministry.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "CAPITAL" && s.subsidy.toLowerCase().includes("subsidy")) return true;
    if (selectedCategory === "CREDIT" && (s.maxLoan.toLowerCase().includes("lakh") || s.id === "mudra" || s.id === "cgtmse")) return true;
    if (selectedCategory === "SOLAR" && s.id.includes("solar") || s.id.includes("surya")) return true;
    if (selectedCategory === "FOOD" && (s.id.includes("fme") || s.eligibleCategories.includes("Food Processing"))) return true;
    return true;
  });

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Award className="size-7 text-mint" /> Government Schemes & Capital Grants
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Credit-linked capital subsidies, collateral-free loans, and grant underwriting personalized to your enterprise
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/ai-recommendations"
            className="px-3.5 py-2.5 bg-white dark:bg-card border border-sage/40 dark:border-border text-foreground hover:bg-cream dark:hover:bg-muted/40 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="size-3.5 text-mint" />
            <span>District Matchmaker</span>
          </Link>
          <button
            onClick={handleReevaluateSchemes}
            disabled={isReevaluating}
            className="px-4 py-2.5 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isReevaluating ? <Spinner className="size-3.5 text-white dark:text-black" /> : <RefreshCw className="size-3.5" />}
            <span>{isReevaluating ? "Evaluating Live..." : "Re-evaluate Live Schemes"}</span>
          </button>
        </div>
      </div>

      {/* Pre-Qualification Banner with Saved Timestamp */}
      {matchData && (
        <div className="bg-mint-pale/50 dark:bg-mint/10 border border-mint/30 rounded-2xl p-5 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-forest dark:bg-mint text-white dark:text-black flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-forest dark:text-mint tracking-wider block">
                Pre-Qualified Status • {matchData.district}, {matchData.state}
              </span>
              <h3 className="font-serif font-bold text-base text-foreground mt-0.5">
                {matchData.totalSubsidies}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {matchData.summary}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1 shrink-0 border-t md:border-t-0 md:border-l border-mint/20 pt-3 md:pt-0 md:pl-5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> Last Evaluated: {new Date(matchData.lastEvaluatedAt).toLocaleDateString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-forest dark:text-mint bg-white dark:bg-card px-2.5 py-1 rounded-lg border border-mint/30">
              Saved in Database (Instant Load)
            </span>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { label: "All Schemes", value: "ALL" },
            { label: "Capital Subsidies (PMEGP/PMFME)", value: "CAPITAL" },
            { label: "Collateral-Free Credit (Mudra/CGTMSE)", value: "CREDIT" },
            { label: "Solar Rooftop Grants", value: "SOLAR" },
            { label: "Food Processing", value: "FOOD" },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
                  : "bg-white dark:bg-card border border-sage/40 dark:border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search schemes, subsidies, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border rounded-xl text-xs font-medium focus:outline-none focus:border-mint"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isReevaluating && (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
          <Skeleton className="h-64 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
          <Skeleton className="h-64 rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border" />
        </div>
      )}

      {/* Schemes Grid */}
      {!isReevaluating && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSchemes.map((scheme) => {
            const isDocsExpanded = expandedDocs[scheme.id];
            return (
              <div
                key={scheme.id}
                className="bg-white/40 dark:bg-card/40 rounded-2xl border-2 border-sage/20 dark:border-border hover:border-mint/50 transition-all p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Ministry and Match Score */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                      <Landmark className="size-3.5 text-mint shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{scheme.ministry}</span>
                    </span>

                    <span className="text-[10px] uppercase font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-md shrink-0 border border-mint/20">
                      {scheme.matchScore}% Match
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-bold text-base sm:text-lg text-forest dark:text-foreground mb-2 leading-snug">
                    {scheme.name}
                  </h3>

                  {/* Subsidy Highlight Badge */}
                  <div className="grid grid-cols-2 gap-2 bg-cream/70 dark:bg-muted/40 rounded-xl p-3 border border-sage/30 dark:border-border mb-4 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        Direct Subsidy / Grant
                      </span>
                      <span className="font-bold text-forest dark:text-mint text-xs sm:text-sm">
                        {scheme.subsidyAmount || scheme.subsidy}
                      </span>
                    </div>
                    <div className="border-l border-sage/30 dark:border-border pl-3">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        Max Credit Limit
                      </span>
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        {scheme.maxLoan}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {scheme.description}
                  </p>

                  {/* Why Eligible Callout */}
                  {scheme.whyEligible && (
                    <div className="bg-sage/10 dark:bg-card/40 rounded-xl p-3 border border-sage/20 dark:border-border mb-3 text-xs">
                      <span className="text-[10px] uppercase font-bold text-forest dark:text-mint block mb-0.5">
                        📍 Why your enterprise qualifies:
                      </span>
                      <p className="text-[11px] text-foreground/90 leading-relaxed">
                        {scheme.whyEligible}
                      </p>
                    </div>
                  )}

                  {/* Bank Officer Approval Tip */}
                  {scheme.bankTips && (
                    <div className="bg-orange/5 dark:bg-orange/10 rounded-xl p-3 border border-orange/20 mb-3 text-xs">
                      <span className="text-[10px] uppercase font-bold text-orange block mb-0.5">
                        💡 Bank Manager Approval Insight:
                      </span>
                      <p className="text-[11px] text-foreground/90 leading-relaxed">
                        {scheme.bankTips}
                      </p>
                    </div>
                  )}

                  {/* Documents Checklist (Expandable) */}
                  {scheme.documents && scheme.documents.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleDocs(scheme.id)}
                        className="text-[11px] font-bold text-forest dark:text-mint hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="size-3.5" />
                        <span>
                          {isDocsExpanded ? "Hide Required Documents" : `View Required Documents (${scheme.documents.length})`}
                        </span>
                      </button>

                      {isDocsExpanded && (
                        <div className="mt-2 p-3 bg-cream/50 dark:bg-muted/30 rounded-xl border border-sage/30 dark:border-border space-y-1.5">
                          {scheme.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-foreground">
                              <CheckCircle2 className="size-3.5 text-mint shrink-0 mt-0.5" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="pt-4 border-t border-sage/20 dark:border-border">
                  <a
                    href={scheme.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Apply on {scheme.portalName || "Official Government Portal"}</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
