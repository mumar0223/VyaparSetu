"use client";

import { useState, useMemo } from "react";
import {
  Building,
  Calculator,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Download,
  Percent,
  Calendar,
  IndianRupee,
  Layers,
  HelpCircle,
  X,
  FileCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BorrowingClientProps {
  profile: {
    id: string;
    businessName: string;
    category?: string | null;
    registrationNumber?: string | null;
    taxNumber?: string | null;
    city?: string | null;
    state?: string | null;
  };
  debts?: any[];
  monthlyRevenue?: number;
  monthlyExpenses?: number;
}

interface SchemePreset {
  id: string;
  name: string;
  bank: string;
  badge: string;
  interestRate: number;
  interestRange: string;
  defaultAmount: number;
  maxAmount: number;
  maxAmountLabel: string;
  defaultTenureYears: number;
  maxTenureYears: number;
  subsidyNote: string;
  features: string;
  category: "GOVT_SUBSIDIZED" | "PUBLIC_BANK" | "COLLATERAL_FREE";
}

const SCHEME_PRESETS: SchemePreset[] = [
  {
    id: "mudra-tarun",
    name: "PMMY Mudra (Tarun)",
    bank: "State Bank of India (SBI)",
    badge: "0% Collateral • Govt Backed",
    interestRate: 8.75,
    interestRange: "8.50% - 9.85%",
    defaultAmount: 800000,
    maxAmount: 1000000,
    maxAmountLabel: "Up to ₹10 Lakhs",
    defaultTenureYears: 5,
    maxTenureYears: 5,
    subsidyNote: "Mudra RuPay card with 10% flexible overdraft facility.",
    features: "No collateral required. 100% digital sanction for Udyam-registered shops.",
    category: "GOVT_SUBSIDIZED",
  },
  {
    id: "cgtmse-credit",
    name: "CGTMSE Collateral-Free Credit",
    bank: "Union Bank / PNB",
    badge: "85% Govt Guarantee Cover",
    interestRate: 9.25,
    interestRange: "9.00% - 10.50%",
    defaultAmount: 2500000,
    maxAmount: 20000000,
    maxAmountLabel: "Up to ₹2 Crores",
    defaultTenureYears: 5,
    maxTenureYears: 7,
    subsidyNote: "Credit guarantee fee subsidized under MSME scheme.",
    features: "For enterprise expansion and machinery purchase without pledging property.",
    category: "COLLATERAL_FREE",
  },
  {
    id: "pmegp-subsidy",
    name: "PMEGP Prime Minister Employment",
    bank: "Khadi & Village Board / Banks",
    badge: "15% - 35% Margin Subsidy",
    interestRate: 8.0,
    interestRange: "7.75% - 9.00%",
    defaultAmount: 1500000,
    maxAmount: 5000000,
    maxAmountLabel: "Up to ₹50 Lakhs",
    defaultTenureYears: 5,
    maxTenureYears: 7,
    subsidyNote: "Capital subsidy directly credited to loan account as margin money.",
    features: "Highest capital subsidy for micro-manufacturing and service units in India.",
    category: "GOVT_SUBSIDIZED",
  },
  {
    id: "standup-india",
    name: "Stand-Up India MSME Facility",
    bank: "Bank of Baroda / SIDBI",
    badge: "Women & SC/ST Priority",
    interestRate: 8.9,
    interestRange: "8.75% - 10.25%",
    defaultAmount: 3500000,
    maxAmount: 10000000,
    maxAmountLabel: "Up to ₹1 Crore",
    defaultTenureYears: 6,
    maxTenureYears: 7,
    subsidyNote: "Composite loan covering both Capex machinery & working capital.",
    features: "Greenfield enterprise funding with repayment holiday/moratorium up to 18 months.",
    category: "PUBLIC_BANK",
  },
  {
    id: "bob-sanjeevani",
    name: "Baroda MSME Sanjeevani",
    bank: "Bank of Baroda",
    badge: "72-Hour Fast-Track",
    interestRate: 9.4,
    interestRange: "9.15% - 10.50%",
    defaultAmount: 1500000,
    maxAmount: 2500000,
    maxAmountLabel: "Up to ₹25 Lakhs",
    defaultTenureYears: 4,
    maxTenureYears: 5,
    subsidyNote: "Interest subvention rebate of 2% applicable for GST taxpayers.",
    features: "Working capital against digital Mandi / UPI sales turnover statements.",
    category: "PUBLIC_BANK",
  },
];

export function BorrowingClient({
  profile,
  debts = [],
  monthlyRevenue = 145000,
  monthlyExpenses = 55000,
}: BorrowingClientProps) {
  const router = useRouter();

  const [selectedScheme, setSelectedScheme] = useState<SchemePreset | null>(
    SCHEME_PRESETS[0],
  );
  const [loanAmount, setLoanAmount] = useState(SCHEME_PRESETS[0].defaultAmount);
  const [interestRate, setInterestRate] = useState(
    SCHEME_PRESETS[0].interestRate,
  );
  const [tenureYears, setTenureYears] = useState(
    SCHEME_PRESETS[0].defaultTenureYears,
  );
  const [showAmortization, setShowAmortization] = useState(false);
  const [showPreQualModal, setShowPreQualModal] = useState(false);
  const [isSavingDebt, setIsSavingDebt] = useState(false);

  // EMI Math: E = P * r * (1+r)^n / ((1+r)^n - 1)
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  const emi = useMemo(() => {
    if (monthlyRate <= 0) return Math.round(loanAmount / totalMonths);
    const compound = Math.pow(1 + monthlyRate, totalMonths);
    return Math.round((loanAmount * monthlyRate * compound) / (compound - 1));
  }, [loanAmount, monthlyRate, totalMonths]);

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;
  const principalPct = Math.round((loanAmount / totalPayment) * 100);
  const interestPct = 100 - principalPct;

  // Real Cash Flow DSCR & Affordability Simulation
  const netMonthlySurplus = Math.max(0, monthlyRevenue - monthlyExpenses);
  const existingDebtEmi = debts.reduce(
    (acc, d) => acc + (d.emiAmount || 0),
    0,
  );
  const totalFutureDebtCommitment = existingDebtEmi + emi;
  const dscr =
    totalFutureDebtCommitment > 0
      ? Math.round((netMonthlySurplus / totalFutureDebtCommitment) * 10) / 10
      : 3.5;
  const surplusAfterEmi = netMonthlySurplus - emi;

  // Year by Year Amortization Schedule
  const amortizationSchedule = useMemo(() => {
    let balance = loanAmount;
    const schedule: Array<{
      year: number;
      startBalance: number;
      principalPaid: number;
      interestPaid: number;
      totalPaid: number;
      endBalance: number;
    }> = [];

    for (let yr = 1; yr <= tenureYears; yr++) {
      let yrPrincipal = 0;
      let yrInterest = 0;
      const startBalance = balance;

      for (let m = 1; m <= 12; m++) {
        if (balance <= 0) break;
        const interestForMonth = balance * monthlyRate;
        const principalForMonth = Math.min(balance, emi - interestForMonth);
        yrInterest += interestForMonth;
        yrPrincipal += principalForMonth;
        balance -= principalForMonth;
      }

      schedule.push({
        year: yr,
        startBalance: Math.round(startBalance),
        principalPaid: Math.round(yrPrincipal),
        interestPaid: Math.round(yrInterest),
        totalPaid: Math.round(yrPrincipal + yrInterest),
        endBalance: Math.max(0, Math.round(balance)),
      });
    }
    return schedule;
  }, [loanAmount, tenureYears, emi, monthlyRate]);

  // Handle Preset Scheme selection
  const handleSelectScheme = (scheme: SchemePreset) => {
    setSelectedScheme(scheme);
    setLoanAmount(scheme.defaultAmount);
    setInterestRate(scheme.interestRate);
    setTenureYears(scheme.defaultTenureYears);
    toast.info(`Configured for ${scheme.name}`);
  };

  // Direct save to debt ledger
  const handleSaveToDebts = async () => {
    setIsSavingDebt(true);
    try {
      const res = await fetch("/api/debt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TERM_LOAN",
          lender: selectedScheme?.bank || "Public Sector Bank",
          totalAmount: loanAmount,
          amountOutStanding: loanAmount,
          interestRate: interestRate,
          emiAmount: emi,
          status: "PLANNED",
        }),
      });

      if (res.ok) {
        toast.success(
          "Simulated loan successfully added to your Business Debt Ledger!",
        );
      } else {
        toast.error("Could not save debt. Please try again.");
      }
    } catch (err) {
      toast.error("Failed to connect to debt ledger");
    } finally {
      setIsSavingDebt(false);
    }
  };

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Building className="size-7 text-mint" /> Bank Loan Structuring &amp; EMI Calculator
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Simulate monthly loan repayments, compare verified MSME credit schemes, and test real cash flow affordability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowPreQualModal(true)}
            className="bg-forest dark:bg-mint text-white dark:text-black font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileCheck className="size-4" /> Apply Pre-Qualification
          </button>
        </div>
      </div>

      {/* Official Government & Bank Scheme Selector Tabs */}
      <div className="mb-6">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2.5">
          Select Verified MSME Scheme Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SCHEME_PRESETS.map((scheme) => {
            const isSelected = selectedScheme?.id === scheme.id;
            return (
              <button
                key={scheme.id}
                onClick={() => handleSelectScheme(scheme)}
                className={cn(
                  "text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative",
                  isSelected
                    ? "bg-mint-pale/80 dark:bg-mint/15 border-mint shadow-xs ring-1 ring-mint"
                    : "bg-white dark:bg-card border-sage/30 dark:border-border hover:bg-cream dark:hover:bg-muted/40",
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-forest dark:text-mint bg-white dark:bg-card px-2 py-0.5 rounded-md border border-sage/30 dark:border-border">
                      {scheme.interestRange}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="size-4 text-forest dark:text-mint shrink-0" />
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-xs text-foreground line-clamp-1">
                    {scheme.name}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {scheme.bank}
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-forest/80 dark:text-mint/90">
                  {scheme.maxAmountLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive EMI Simulator & Live Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Interactive Sliders & Parameter Controls */}
        <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-sage/20 dark:border-border">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                <Calculator className="size-5 text-mint" /> Loan Parameter Controls
              </h3>
              {selectedScheme && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint">
                  {selectedScheme.badge}
                </span>
              )}
            </div>

            <div className="space-y-6">
              {/* Loan Amount Slider + Quick Chips */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-forest dark:text-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="size-4 text-mint" /> Principal Loan Amount:
                  </span>
                  <span className="text-base font-serif font-bold text-forest dark:text-mint">
                    ₹{loanAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min={25000}
                  max={selectedScheme?.maxAmount || 5000000}
                  step={25000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-forest dark:accent-mint cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  <span>₹25,000</span>
                  <span>₹10 Lakhs</span>
                  <span>{selectedScheme?.maxAmountLabel || "₹50 Lakhs"}</span>
                </div>

                {/* Quick Selection Chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[200000, 500000, 1000000, 2500000].map((amt) => {
                    if (selectedScheme && amt > selectedScheme.maxAmount) return null;
                    return (
                      <button
                        key={amt}
                        onClick={() => setLoanAmount(amt)}
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                          loanAmount === amt
                            ? "bg-forest dark:bg-mint text-white dark:text-black border-transparent shadow-xs"
                            : "bg-cream dark:bg-muted/50 text-muted-foreground hover:text-foreground border-sage/30 dark:border-border",
                        )}
                      >
                        ₹{(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)} Lakhs
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-forest dark:text-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <Percent className="size-4 text-mint" /> Interest Rate (% per annum):
                  </span>
                  <span className="text-base font-serif font-bold text-forest dark:text-mint">
                    {interestRate.toFixed(2)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={20}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-forest dark:accent-mint cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  <span>6.0% (Subsidized/Govt)</span>
                  <span>10.5% (Standard Bank)</span>
                  <span>18.0% (NBFC/Unsecured)</span>
                </div>
              </div>

              {/* Repayment Tenure Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-forest dark:text-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-mint" /> Repayment Tenure:
                  </span>
                  <span className="text-base font-serif font-bold text-forest dark:text-mint">
                    {tenureYears} Years ({totalMonths} Months)
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={selectedScheme?.maxTenureYears || 7}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-forest dark:accent-mint cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                  <span>1 Year (12 M)</span>
                  <span>3 Years (36 M)</span>
                  <span>{selectedScheme?.maxTenureYears || 7} Years</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheme Feature Summary Footnote */}
          {selectedScheme && (
            <div className="mt-6 pt-4 border-t border-sage/20 dark:border-border flex items-start gap-2.5 bg-cream/50 dark:bg-muted/20 p-3 rounded-xl">
              <Zap className="size-4 text-forest dark:text-mint shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{selectedScheme.bank}: </span>
                {selectedScheme.features} {selectedScheme.subsidyNote}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Live EMI Commitment, Visual Progress & Outflow Cards */}
        <div className="bg-cream dark:bg-muted/40 rounded-2xl border border-sage/30 dark:border-border p-6 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Monthly EMI Commitment
            </span>
            <div className="text-3xl sm:text-4xl font-serif font-bold text-forest dark:text-mint mb-2">
              ₹{emi.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ month</span>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Payable across {totalMonths} equal monthly installments
            </p>

            {/* Visual Principal vs Interest Progress Bar */}
            <div className="space-y-1.5 mb-6">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-emerald-700 dark:text-mint">Principal: {principalPct}%</span>
                <span className="text-amber-700 dark:text-orange">Interest: {interestPct}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-sage/30 dark:bg-muted overflow-hidden flex">
                <div
                  style={{ width: `${principalPct}%` }}
                  className="h-full bg-forest dark:bg-mint transition-all duration-300"
                />
                <div
                  style={{ width: `${interestPct}%` }}
                  className="h-full bg-orange transition-all duration-300"
                />
              </div>
            </div>

            {/* Financial Outflow Summary Breakdown */}
            <div className="space-y-2.5 text-xs border-t border-sage/30 dark:border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal Borrowed:</span>
                <span className="font-bold text-foreground">
                  ₹{loanAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Interest Burden:</span>
                <span className="font-bold text-orange">
                  ₹{totalInterest.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Overall Payable:</span>
                <span className="font-bold text-foreground text-sm">
                  ₹{totalPayment.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <button
              onClick={handleSaveToDebts}
              disabled={isSavingDebt}
              className="w-full py-3 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Landmark className="size-4" />
              <span>{isSavingDebt ? "Recording..." : "Record in Business Debt Ledger"}</span>
            </button>

            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="w-full py-2.5 bg-white dark:bg-card hover:bg-cream dark:hover:bg-muted text-foreground border border-sage/40 dark:border-border font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="size-4 text-forest dark:text-mint" />
              <span>{showAmortization ? "Hide Amortization Table" : "View Annual Amortization Schedule"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cashflow Compatibility & DSCR Feasibility Radar */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-sage/20 dark:border-border">
          <div>
            <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
              <TrendingUp className="size-5 text-mint" /> Cash Flow Runway &amp; Debt-Service Feasibility (DSCR)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live stress-test comparing your monthly enterprise surplus against the proposed EMI
            </p>
          </div>

          <div
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0",
              dscr >= 2.0
                ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint border border-mint/30"
                : dscr >= 1.3
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300",
            )}
          >
            <ShieldCheck className="size-4" />
            <span>
              DSCR {dscr}x — {dscr >= 2.0 ? "Safe to Borrow" : dscr >= 1.3 ? "Manageable" : "Cash Flow Strain"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-cream dark:bg-muted/40 p-4 rounded-xl border border-sage/30 dark:border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Monthly Inflow (Sales)
            </span>
            <div className="text-lg font-bold text-foreground">
              ₹{monthlyRevenue.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-muted-foreground">Recorded shop revenues</span>
          </div>

          <div className="bg-cream dark:bg-muted/40 p-4 rounded-xl border border-sage/30 dark:border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Operational Expenses
            </span>
            <div className="text-lg font-bold text-foreground">
              ₹{monthlyExpenses.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-muted-foreground">Inventory &amp; overheads</span>
          </div>

          <div className="bg-cream dark:bg-muted/40 p-4 rounded-xl border border-sage/30 dark:border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Net Surplus Before EMI
            </span>
            <div className="text-lg font-bold text-emerald-700 dark:text-mint">
              ₹{netMonthlySurplus.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-muted-foreground">Monthly disposable buffer</span>
          </div>

          <div className="bg-cream dark:bg-muted/40 p-4 rounded-xl border border-sage/30 dark:border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Surplus After EMI
            </span>
            <div
              className={cn(
                "text-lg font-bold",
                surplusAfterEmi > 0
                  ? "text-forest dark:text-mint"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              ₹{surplusAfterEmi.toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {surplusAfterEmi > 0 ? "Retained cash buffer" : "Deficit — reduce loan"}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Amortization Schedule Table */}
      {showAmortization && (
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs mb-8 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
              <FileSpreadsheet className="size-5 text-mint" /> Annual Amortization Schedule
            </h3>
            <span className="text-xs text-muted-foreground">
              Year-by-year principal vs interest repayment trajectory
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-cream dark:bg-muted text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-sage/30 dark:border-border">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Opening Balance</th>
                  <th className="py-3 px-4">Principal Repaid</th>
                  <th className="py-3 px-4">Interest Paid</th>
                  <th className="py-3 px-4">Total Payment</th>
                  <th className="py-3 px-4">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/20 dark:divide-border">
                {amortizationSchedule.map((row) => (
                  <tr
                    key={row.year}
                    className="hover:bg-cream/50 dark:hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-forest dark:text-mint">
                      Year {row.year}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      ₹{row.startBalance.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700 dark:text-mint">
                      ₹{row.principalPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-medium text-orange">
                      ₹{row.interestPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      ₹{row.totalPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      ₹{row.endBalance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pre-Qualification Application Modal */}
      {showPreQualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-sage/40 dark:border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-sage/30 dark:border-border">
              <div className="flex items-center gap-2">
                <FileCheck className="size-5 text-mint" />
                <h3 className="font-serif font-bold text-lg text-forest dark:text-mint">
                  MSME Pre-Qualification Dossier
                </h3>
              </div>
              <button
                onClick={() => setShowPreQualModal(false)}
                className="p-1 hover:bg-cream dark:hover:bg-muted rounded-lg text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-cream dark:bg-muted/40 p-4 rounded-xl border border-sage/30 dark:border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enterprise Name:</span>
                  <span className="font-bold text-foreground">
                    {profile.businessName || "My Enterprise"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration (Udyam):</span>
                  <span className="font-bold text-foreground font-mono">
                    {profile.registrationNumber || "UDYAM-MH-12-0098765"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected Scheme:</span>
                  <span className="font-bold text-forest dark:text-mint">
                    {selectedScheme?.name} ({selectedScheme?.bank})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Requested:</span>
                  <span className="font-bold text-foreground text-sm">
                    ₹{loanAmount.toLocaleString("en-IN")} @ {interestRate}% for {tenureYears} Yrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly EMI Commitment:</span>
                  <span className="font-bold text-forest dark:text-mint text-sm">
                    ₹{emi.toLocaleString("en-IN")} / mo
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2">Required Verification Checklist:</h4>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-mint" /> Active Udyam Registration &amp; GSTIN
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-mint" /> 6 Months Digital Bank / UPI Mandi Inflow Statement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-mint" /> PAN Card &amp; Aadhaar of Enterprise Promoter
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-sage/30 dark:border-border">
              <button
                onClick={() => {
                  toast.success("Pre-Qualification application generated!");
                  setShowPreQualModal(false);
                }}
                className="flex-1 py-2.5 bg-forest dark:bg-mint text-white dark:text-black font-bold text-xs rounded-xl shadow-xs"
              >
                Download Formal Loan Dossier (PDF)
              </button>
              <button
                onClick={() => {
                  setShowPreQualModal(false);
                  router.push(
                    `/ai-saathi?prompt=${encodeURIComponent(`I want to apply for ${selectedScheme?.name} with loan amount of ₹${loanAmount.toLocaleString("en-IN")}. Please generate the official MSME loan application form.`)}`,
                  );
                }}
                className="flex-1 py-2.5 bg-orange text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Discuss with AI Loan Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
