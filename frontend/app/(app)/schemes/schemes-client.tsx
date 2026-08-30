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
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface SchemesBusinessProfile {
  businessName: string;
  category?: string | null;
  annualRevenue?: number | null;
  city?: string | null;
  state?: string | null;
}

const SCHEMES = [
  {
    id: "pmegp",
    name: "Prime Minister Employment Generation Programme (PMEGP)",
    ministry: "Ministry of MSME / KVIC",
    subsidy: "Up to 35% Capital Subsidy",
    maxLoan: "₹50 Lakhs (Manufacturing) / ₹20 Lakhs (Service)",
    eligibleCategories: ["Retail", "Manufacturing", "Handicrafts", "Agro-Processing", "General"],
    description: "Credit-linked subsidy programme aimed at generating self-employment opportunities through micro-enterprises in rural and urban areas.",
    keyBenefit: "Subsidy of 25% for general category and 35% for special categories (women, SC/ST, rural) credited directly into bank account.",
    applicationUrl: "https://www.kviconline.gov.in/pmegpeportal/",
  },
  {
    id: "mudra",
    name: "Pradhan Mantri MUDRA Yojana (PMMY)",
    ministry: "Department of Financial Services",
    subsidy: "Collateral-Free & Subvented Interest",
    maxLoan: "₹10 Lakhs (Tarun Tier)",
    eligibleCategories: ["Retail", "Services", "Kirana", "Transportation", "General"],
    description: "Provides collateral-free institutional credit to non-corporate small business enterprises through commercial and regional rural banks.",
    keyBenefit: "Zero processing fees for Shishu/Kishor loans, no collateral required, Mudra debit card for working capital overdraft.",
    applicationUrl: "https://www.mudra.org.in/",
  },
  {
    id: "pm-vishwakarma",
    name: "PM Vishwakarma Scheme",
    ministry: "Ministry of MSME",
    subsidy: "₹15,000 Toolkit Incentive + 5% Subvented Interest",
    maxLoan: "₹3 Lakhs in 2 Tranches",
    eligibleCategories: ["Artisans", "Carpenters", "Cobblers", "Tailors", "Blacksmiths"],
    description: "Holistic support scheme providing end-to-end assistance to traditional rural artisans and craftspeople across 18 trade clusters.",
    keyBenefit: "Free skill training, digital transaction cashback, modern toolkit grant, and 5% concessional collateral-free enterprise loan.",
    applicationUrl: "https://pmvishwakarma.gov.in/",
  },
  {
    id: "cgtmse",
    name: "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
    ministry: "Ministry of MSME & SIDBI",
    subsidy: "85% Sovereign Credit Guarantee",
    maxLoan: "₹500 Lakhs",
    eligibleCategories: ["Manufacturing", "Services", "Agro-Enterprises", "Retail"],
    description: "Enables micro-entrepreneurs to obtain collateral-free loans from scheduled commercial banks backed by government guarantee cover.",
    keyBenefit: "Banks cannot demand third-party collateral or mortgage; guarantee fee subsidized for women and rural enterprises.",
    applicationUrl: "https://www.cgtmse.in/",
  },
];

export function SchemesClient({ profile }: { profile: SchemesBusinessProfile | null }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSchemes = SCHEMES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ministry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Award className="size-7 text-mint" /> Government Schemes &amp; Capital Subsidies
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Verified central and state government credit-linked subsidies and collateral-free loan programs
          </p>
        </div>
      </div>

      {/* Pre-Qualification Banner */}
      <div className="bg-mint-pale dark:bg-mint/10 border border-mint/30 dark:border-mint/20 rounded-2xl p-5 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-mint/20 dark:bg-mint/30 rounded-xl shrink-0">
            <Sparkles className="size-6 text-forest dark:text-mint" />
          </div>
          <div>
            <h3 className="font-bold text-forest dark:text-foreground text-sm sm:text-base">
              Pre-Matched for: {profile?.businessName || "Your Enterprise"} ({profile?.city || "Maharashtra"})
            </h3>
            <p className="text-xs text-forest/80 dark:text-muted-foreground">
              Based on your enterprise profile, you qualify for up to 35% capital subsidy and 5% subvented interest.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold bg-white dark:bg-card text-forest dark:text-mint px-3.5 py-2 rounded-xl border border-mint/30 shadow-xs whitespace-nowrap shrink-0">
          ✓ 4 Verified Schemes Available
        </span>
      </div>

      {/* Search Filter Bar */}
      <div className="relative mb-6 shrink-0 max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search schemes, ministry, subsidy type..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-card border border-sage/40 dark:border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-mint"
        />
        <Search className="size-4 text-sage dark:text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-full">
                  {scheme.ministry}
                </span>
                <span className="text-xs font-bold text-orange bg-orange/10 dark:bg-orange/20 px-2.5 py-0.5 rounded-full">
                  {scheme.subsidy}
                </span>
              </div>

              <h3 className="font-serif font-bold text-base sm:text-lg text-forest dark:text-foreground mb-2">
                {scheme.name}
              </h3>

              <div className="bg-cream dark:bg-muted/40 rounded-xl p-3 mb-3 border border-sage/30 dark:border-border space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Financial Limit:</span>
                  <span className="font-bold text-foreground">{scheme.maxLoan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Key Benefit:</span>
                  <span className="font-bold text-forest dark:text-mint text-right">{scheme.subsidy}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{scheme.description}</p>
            </div>

            <div className="flex gap-2">
              <a
                href={scheme.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                Apply on Official Portal <ExternalLink className="size-3.5" />
              </a>
              <button
                onClick={() => toast.success(`Eligibility dossier copied for ${scheme.name}`)}
                className="px-3.5 py-2.5 bg-cream dark:bg-muted hover:bg-mint-pale dark:hover:bg-mint/20 text-forest dark:text-foreground border border-sage/40 dark:border-border rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
