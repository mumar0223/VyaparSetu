"use client";

import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from "lucide-react";

export interface CashflowSummaryData {
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  monthlyBurn: number;
  runwayMonths: number;
  breakdown: {
    category: string;
    amount: number;
    pct: number;
  }[];
}

export function CashflowClient({ summary }: { summary: CashflowSummaryData }) {
  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Activity className="size-7 text-mint" /> Cash Flow Health &amp; Runway Monitor
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Real-time liquidity analysis, net surplus tracking, and working capital forecasting
          </p>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
              Total Inflow (Receipts)
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint">
              +₹{summary.totalInflow.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint rounded-xl">
            <ArrowUpRight className="size-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
              Total Outflow (Burn)
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-orange">
              -₹{summary.totalOutflow.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-orange/10 dark:bg-orange/20 text-orange rounded-xl">
            <ArrowDownRight className="size-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
              Net Surplus / Deficit
            </span>
            <span
              className={`text-2xl sm:text-3xl font-serif font-bold ${
                summary.netCashflow >= 0 ? "text-forest dark:text-mint" : "text-destructive"
              }`}
            >
              ₹{summary.netCashflow.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 bg-cream dark:bg-muted text-forest dark:text-foreground rounded-xl">
            {summary.netCashflow >= 0 ? (
              <TrendingUp className="size-6" />
            ) : (
              <TrendingDown className="size-6" />
            )}
          </div>
        </div>
      </div>

      {/* Runway Analysis Box */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs mb-6">
        <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2 mb-3">
          <Calendar className="size-5 text-mint" /> Working Capital Runway Assessment
        </h3>
        <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground leading-relaxed mb-6 max-w-3xl">
          Based on your average monthly operating burn of{" "}
          <strong className="text-forest dark:text-foreground">₹{summary.monthlyBurn.toLocaleString("en-IN")}</strong> and current net
          surplus reserves, your business has an estimated operational cushion of:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-mint/40 bg-mint-pale/40 dark:bg-mint/10">
            <span className="text-xs font-bold text-forest dark:text-mint block mb-1">30-Day Safe Horizon</span>
            <p className="text-xs text-ink-muted dark:text-muted-foreground">
              Sufficient liquid funds to cover immediate supplier dues and vendor credit.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-sage/30 dark:border-border bg-cream/40 dark:bg-muted/30">
            <span className="text-xs font-bold text-forest dark:text-foreground block mb-1">60-Day Runway</span>
            <p className="text-xs text-ink-muted dark:text-muted-foreground">
              Maintain current sales cadence to preserve raw material replenishment buffer.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-sage/30 dark:border-border bg-cream/40 dark:bg-muted/30">
            <span className="text-xs font-bold text-forest dark:text-foreground block mb-1">90-Day Expansion Horizon</span>
            <p className="text-xs text-ink-muted dark:text-muted-foreground">
              Eligible for working capital line from MUDRA / CGTMSE partners.
            </p>
          </div>
        </div>
      </div>

      {/* Expense Concentration Breakdown */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs flex-1">
        <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground mb-4">
          Cash Outflow Concentration
        </h3>

        {summary.breakdown.length === 0 ? (
          <p className="text-xs text-muted-foreground">No expense categories recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {summary.breakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <span>{item.category}</span>
                  <span>
                    ₹{item.amount.toLocaleString("en-IN")}{" "}
                    <span className="text-muted-foreground font-normal">({item.pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-cream dark:bg-muted rounded-full h-2 overflow-hidden border border-sage/20 dark:border-border">
                  <div
                    className="bg-forest dark:bg-mint h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
