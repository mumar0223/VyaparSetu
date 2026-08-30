"use client";

import {
  CreditCard,
  ShieldCheck,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export interface BusinessCreditProfile {
  businessName: string;
  category?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  annualRevenue?: number | null;
  city?: string | null;
  state?: string | null;
}

export function CreditClient({ profile }: { profile: BusinessCreditProfile }) {
  const creditScore = 742;

  const FACTORS = [
    {
      name: "Digital Inflow & UPI Stability",
      status: "Excellent",
      impact: "+45 pts",
      description: "Consistent daily digital payment transactions without sudden multi-day drop-offs.",
    },
    {
      name: "Supplier Payment Punctuality",
      status: "Good",
      impact: "+32 pts",
      description: "94% of recorded supplier and raw material invoices settled within 14 days.",
    },
    {
      name: "Formal Tax Compliance (GST / Udyam)",
      status: "Verified",
      impact: "+60 pts",
      description: `Active Udyam number (${profile?.registrationNumber || "UDYAM-MH-12-0098765"}) and GST filings.`,
    },
    {
      name: "Debt Service Coverage Ratio (DSCR)",
      status: "Healthy",
      impact: "+28 pts",
      description: "Estimated monthly cash surplus exceeds existing loan commitments by 2.4x.",
    },
  ];

  const handleDownloadDossier = () => {
    toast.success("Bank-Ready Credit Dossier downloaded (PDF)");
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <CreditCard className="size-7 text-mint" /> Alternative Business Credit Profile
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Cash-flow based creditworthiness assessment computed from digital sales and invoice consistency
          </p>
        </div>

        <button
          onClick={handleDownloadDossier}
          className="bg-forest dark:bg-mint text-white dark:text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Download className="size-4" /> Download Credit Dossier
        </button>
      </div>

      {/* Credit Score Gauge Card */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="size-28 sm:size-32 rounded-full border-8 border-mint bg-mint-pale/50 dark:bg-mint/10 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-forest dark:text-mint">{creditScore}</span>
              <span className="text-[10px] font-bold text-forest dark:text-mint uppercase tracking-wider">Prime Tier</span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-full inline-flex mb-1.5">
                <ShieldCheck className="size-3.5" /> Bank Ready Score
              </div>
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground">
                {profile?.businessName || "Your Enterprise"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Your alternative credit rating places you in the top 15% of micro-enterprises in {profile?.state || "Maharashtra"}. Eligible for pre-sanctioned credit up to ₹10,00,000.
              </p>
            </div>
          </div>

          <div className="bg-cream dark:bg-muted/40 rounded-xl p-4 border border-sage/30 dark:border-border space-y-2 text-xs shrink-0 w-full md:w-64">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assessment Tier:</span>
              <span className="font-bold text-foreground">Prime A+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Pre-Approved:</span>
              <span className="font-bold text-foreground">₹10,00,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interest Subvention:</span>
              <span className="font-bold text-mint">Eligible (2%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Factors Breakdown */}
      <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground mb-4">
        Credit Scoring Drivers &amp; Factors
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FACTORS.map((f, i) => (
          <div
            key={i}
            className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-forest dark:text-mint bg-cream dark:bg-muted px-2.5 py-1 rounded-lg border border-sage/30 dark:border-border">
                  {f.status}
                </span>
                <span className="text-xs font-bold text-mint">{f.impact}</span>
              </div>
              <h4 className="font-serif font-bold text-sm sm:text-base text-forest dark:text-foreground mb-1.5">
                {f.name}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
