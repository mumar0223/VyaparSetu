"use client";

import { useState } from "react";
import {
  Building,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function BorrowingPage() {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenureYears, setTenureYears] = useState(3);

  // EMI Calculation: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi =
    monthlyRate > 0
      ? Math.round(
          (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : Math.round(loanAmount / totalMonths);

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  const LOAN_PRODUCTS = [
    {
      bank: "State Bank of India (SBI)",
      scheme: "Pradhan Mantri Mudra Yojana (Tarun)",
      interest: "8.50% - 9.85%",
      maxAmount: "Up to ₹10 Lakhs",
      features: "Collateral-free, Mudra RuPay card provided for overdraft",
    },
    {
      bank: "Bank of Baroda",
      scheme: "Baroda MSME Sanjeevani",
      interest: "9.15% - 10.50%",
      maxAmount: "Up to ₹25 Lakhs",
      features: "Fast-track 72-hour digital approval for GST-registered shops",
    },
    {
      bank: "Punjab National Bank (PNB)",
      scheme: "PNB Tatkal Loan for Micro Units",
      interest: "8.90% - 10.20%",
      maxAmount: "Up to ₹15 Lakhs",
      features: "Working capital against digital Mandi / UPI sales statements",
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Building className="size-7 text-mint" /> Bank Loan Structuring &amp; EMI Calculator
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Simulate monthly loan repayments and explore verified public sector MSME credit options
          </p>
        </div>
      </div>

      {/* EMI Calculator Card */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs mb-8">
        <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2 mb-4">
          <Calculator className="size-5 text-mint" /> Interactive Business EMI Simulator
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sliders */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold text-forest dark:text-foreground mb-1.5">
                <span>Loan Required:</span>
                <span className="text-sm">₹{loanAmount.toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min={50000}
                max={5000000}
                step={25000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-forest dark:accent-mint"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>₹50K</span>
                <span>₹25 Lakhs</span>
                <span>₹50 Lakhs</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-forest dark:text-foreground mb-1.5">
                <span>Interest Rate (% p.a.):</span>
                <span className="text-sm">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={6}
                max={18}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-forest dark:accent-mint"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>6% (Subvented)</span>
                <span>12% (Standard)</span>
                <span>18% (NBFC)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-forest dark:text-foreground mb-1.5">
                <span>Repayment Tenure:</span>
                <span className="text-sm">{tenureYears} Years ({totalMonths} Months)</span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-forest dark:accent-mint"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1 Year</span>
                <span>3 Years</span>
                <span>7 Years</span>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-cream dark:bg-muted/40 rounded-2xl border border-sage/30 dark:border-border p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Monthly EMI Commitment
              </span>
              <div className="text-3xl sm:text-4xl font-serif font-bold text-forest dark:text-mint mb-4">
                ₹{emi.toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">/ month</span>
              </div>

              <div className="space-y-2 text-xs border-t border-sage/30 dark:border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Principal Amount:</span>
                  <span className="font-bold text-foreground">₹{loanAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Interest Burden:</span>
                  <span className="font-bold text-orange">₹{totalInterest.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Overall Payable:</span>
                  <span className="font-bold text-foreground">₹{totalPayment.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toast.success("EMI simulation added to your cashflow forecast planner!")}
              className="mt-6 w-full py-3 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Simulate on Cash Flow Runway
            </button>
          </div>
        </div>
      </div>

      {/* Verified Bank Loan Products */}
      <div>
        <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground mb-4">
          Verified Micro-Enterprise Credit Options
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {LOAN_PRODUCTS.map((prod, i) => (
            <div
              key={i}
              className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-forest dark:text-mint mb-2">
                  <Building className="size-4 text-mint" /> {prod.bank}
                </div>
                <h4 className="font-serif font-bold text-base text-forest dark:text-foreground mb-2">{prod.scheme}</h4>

                <div className="bg-cream dark:bg-muted/40 rounded-xl p-3 mb-3 border border-sage/30 dark:border-border space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-bold text-foreground">{prod.interest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Limit:</span>
                    <span className="font-bold text-foreground">{prod.maxAmount}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{prod.features}</p>
              </div>

              <button
                onClick={() => toast.info(`Pre-qualification checklist opened for ${prod.bank}`)}
                className="w-full py-2.5 bg-cream dark:bg-muted hover:bg-mint-pale dark:hover:bg-mint/20 text-forest dark:text-foreground border border-sage/40 dark:border-border rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                Apply Pre-Qualification <ArrowRight className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
