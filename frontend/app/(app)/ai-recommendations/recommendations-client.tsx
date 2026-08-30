"use client";

import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export interface RecProfile {
  businessName: string;
  category?: string | null;
  annualRevenue?: number | null;
  monthlyExpenses?: number | null;
  city?: string | null;
}

export function RecommendationsClient({ profile }: { profile: RecProfile | null }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const recommendations = [
    {
      id: "rec-1",
      title: `Apply for PMEGP Capital Subsidy (Up to 35%)`,
      category: "SUBSIDY",
      impact: "HIGH",
      roi: "₹3,50,000 Direct Subsidy",
      timeline: "2-3 weeks",
      description: `Your enterprise in ${profile?.city || "Maharashtra"} qualifies for government capital subsidy for equipment and store modernization.`,
      steps: [
        "Download Udyam Registration Certificate from profile",
        "Prepare 3-year projected cash flow statement",
        "Submit online application via KVIC PMEGP Portal with bank branch selection",
      ],
    },
    {
      id: "rec-2",
      title: "Consolidate Supplier Invoicing for 3.5% Cash Discount",
      category: "CASHFLOW",
      impact: "HIGH",
      roi: "₹18,000/month saved",
      timeline: "Immediate",
      description: `Based on your monthly expenses of ₹${(profile?.monthlyExpenses || 65000).toLocaleString("en-IN")}, switching to early 7-day payment cycles unlocks wholesale tier discounts.`,
      steps: [
        "Identify top 3 suppliers by monthly volume",
        "Propose weekly automated settlement in exchange for early payment rebate",
        "Track saved margins in Expense ledger",
      ],
    },
    {
      id: "rec-3",
      title: "Build Digital Ledger for Collateral-Free Mudra Loan",
      category: "CREDIT",
      impact: "MEDIUM",
      roi: "₹10,00,000 Credit Line",
      timeline: "30 days",
      description: "Recording daily sales through digital UPI QR codes creates verified bankable statements for Mudra Tarun sanction.",
      steps: [
        "Keep daily cash deposits below 15% of total inflow",
        "Maintain zero cheque or EMI bounces for 90 days",
        "Generate one-click bank dossier from Business Credit tab",
      ],
    },
    {
      id: "rec-4",
      title: "Introduce High-Margin Fast-Moving Regional SKUs",
      category: "INVENTORY",
      impact: "MEDIUM",
      roi: "+14% Net Profit",
      timeline: "15 days",
      description: "Local Mandi demand indices indicate rising consumer preference for packaged organic staples and regional pulses.",
      steps: [
        "Procure sample inventory batch from nearest agricultural cooperative",
        "Set up dedicated counter display with local pricing",
        "Collect customer feedback over 14-day trial",
      ],
    },
  ];

  const handleToggleStep = (stepKey: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepKey]: !prev[stepKey] };
      if (next[stepKey]) {
        toast.success("Action step completed!");
      }
      return next;
    });
  };

  const filtered =
    selectedCategory === "ALL"
      ? recommendations
      : recommendations.filter((r) => r.category === selectedCategory);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Sparkles className="size-7 text-mint" /> Strategic AI Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Data-backed action playbooks prioritized by profit impact and execution velocity
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 shrink-0">
        {["ALL", "SUBSIDY", "CASHFLOW", "CREDIT", "INVENTORY"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
                : "bg-white dark:bg-card border border-sage/40 dark:border-border text-ink-muted dark:text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
        {filtered.map((rec) => (
          <div
            key={rec.id}
            className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Badges Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    rec.impact === "HIGH"
                      ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint"
                      : "bg-orange/10 dark:bg-orange/20 text-orange"
                  }`}
                >
                  {rec.impact} IMPACT
                </span>
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
                {rec.steps.map((step, idx) => {
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

            <button
              onClick={() => toast.info(`Action plan opened for: ${rec.title}`)}
              className="w-full py-2.5 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              Execute Playbook <ArrowRight className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
