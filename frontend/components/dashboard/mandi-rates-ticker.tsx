"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowUpRight, Bot, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardAnalyticsData } from "@/lib/hooks/use-dashboard-analytics";

interface MandiRatesTickerProps {
  data: DashboardAnalyticsData | null;
  loading: boolean;
}

export function MandiRatesTicker({ data, loading }: MandiRatesTickerProps) {
  const rates = data?.mandiRates || [
    {
      commodity: "Wheat (Sharbati)",
      mandi: "Indore APMC (MP)",
      ratePerQtl: 2850,
      change: "+3.2%",
      trend: "up" as const,
      arrivalQty: "1,420 Qtl",
      advice: "Price uptrend; favorable to release stored grain stock.",
    },
    {
      commodity: "Onion (Red Nashik)",
      mandi: "Lasalgaon APMC (MH)",
      ratePerQtl: 1680,
      change: "-2.4%",
      trend: "down" as const,
      arrivalQty: "3,850 Qtl",
      advice: "Fresh arrivals peaking; ideal window for bulk inventory buy.",
    },
    {
      commodity: "Mustard Seeds (Bold)",
      mandi: "Kota APMC (RJ)",
      ratePerQtl: 5450,
      change: "+1.8%",
      trend: "up" as const,
      arrivalQty: "890 Qtl",
      advice: "Steady mill demand; prices consolidating with upward bias.",
    },
    {
      commodity: "Basmati Paddy (1509)",
      mandi: "Karnal APMC (HR)",
      ratePerQtl: 3420,
      change: "+0.6%",
      trend: "up" as const,
      arrivalQty: "2,100 Qtl",
      advice: "Export demand stable; consistent wholesale margins.",
    },
  ];

  return (
    <div className="rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-mint/15 text-forest dark:text-mint flex items-center justify-center">
            <Sprout className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-sans text-foreground">
              Live APMC Mandi Spot Rates
            </h3>
            <p className="text-xs text-muted-foreground">
              Regional commodity arrivals, price movement and AI procurement advice
            </p>
          </div>
        </div>

        <Link
          href="/ai-saathi?prompt=Analyze%20current%20regional%20APMC%20mandi%20spot%20prices%20and%20give%20me%20inventory%20procurement%20advice."
          className="text-xs font-bold text-mint hover:underline flex items-center gap-1"
        >
          <span>Ask Procurement Strategy</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 p-3.5 space-y-2.5 bg-muted/20 animate-pulse"
              >
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-6 w-20 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            ))
          : rates.map((rate, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-sage/20 dark:border-border p-3.5 bg-white/30 dark:bg-muted/20 hover:bg-white/60 dark:hover:bg-muted/40 hover:border-mint/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-foreground truncate">
                      {rate.commodity}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[10.5px] font-bold px-1.5 py-0.5 rounded-md shrink-0",
                        rate.trend === "up"
                          ? "bg-mint/15 text-forest dark:text-mint"
                          : "bg-orange/15 text-orange"
                      )}
                    >
                      {rate.trend === "up" ? (
                        <TrendingUp className="size-3" />
                      ) : (
                        <TrendingDown className="size-3" />
                      )}
                      {rate.change}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-black font-sans text-foreground">
                      ₹{rate.ratePerQtl.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      / Quintal
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground mb-2 flex items-center justify-between">
                    <span>{rate.mandi}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      Arr: {rate.arrivalQty}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] leading-relaxed text-ink-muted dark:text-muted-foreground flex items-start gap-1.5">
                  <Bot className="size-3 text-mint shrink-0 mt-0.5" />
                  <span>{rate.advice}</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
