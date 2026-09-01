"use client";

import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Activity,
  ShieldAlert,
  Wallet,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardAnalyticsData } from "@/lib/hooks/use-dashboard-analytics";

interface KpiCardsProps {
  data: DashboardAnalyticsData | null;
  loading: boolean;
}

export function KpiCards({ data, loading }: KpiCardsProps) {
  const kpis = data?.kpis;

  const cards = [
    {
      title: "Monthly Revenue",
      value: kpis ? `₹${kpis.monthlyRevenue.toLocaleString("en-IN")}` : "₹1,25,000",
      subtext: `${kpis?.profitMargin || 48}% net margin`,
      badge: "+12.4% vs last mo",
      badgeTrend: "up" as const,
      icon: IndianRupee,
      accent: "text-mint border-mint/30 bg-mint/10",
    },
    {
      title: "Monthly Outflow / Burn",
      value: kpis ? `₹${kpis.monthlyExpenses.toLocaleString("en-IN")}` : "₹65,000",
      subtext: "Operating & stock costs",
      badge: "-3.8% efficiency",
      badgeTrend: "up" as const, // lower burn is positive
      icon: TrendingDown,
      accent: "text-orange border-orange/30 bg-orange/10",
    },
    {
      title: "Working Capital Runway",
      value: kpis ? `${kpis.runwayDays} Days` : "42 Days",
      subtext: `₹${(kpis?.liquidBuffer || 150000).toLocaleString("en-IN")} liquid buffer`,
      badge: kpis && kpis.runwayDays >= 30 ? "Safe buffer" : "Tight liquidity",
      badgeTrend: (kpis && kpis.runwayDays >= 30 ? "up" : "down") as "up" | "down",
      icon: Clock,
      accent: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    },
    {
      title: "Active EMI & Debt Burden",
      value: kpis ? `₹${(kpis.monthlyEmiBurden || 12850).toLocaleString("en-IN")}/mo` : "₹12,850/mo",
      subtext: `₹${(kpis?.totalOutstandingDebt || 220000).toLocaleString("en-IN")} total debt`,
      badge: `Debt ratio: ${(kpis as any)?.debtRatio ?? 18}%`,
      badgeTrend: "up" as const,
      icon: Wallet,
      accent: "text-purple-500 border-purple-500/30 bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="relative rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border p-4.5 shadow-2xs hover:shadow-md transition-all hover:border-mint/40 hover:bg-white/65 dark:hover:bg-card/60 flex flex-col justify-between"
        >
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="size-8 bg-muted rounded-xl" />
              </div>
              <div className="h-7 w-32 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {card.title}
                </span>
                <div className={cn("size-8 rounded-xl border flex items-center justify-center", card.accent)}>
                  <card.icon className="size-4" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-sans tracking-tight text-foreground">
                  {card.value}
                </h3>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground truncate">{card.subtext}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10.5px] font-bold px-1.5 py-0.5 rounded-md shrink-0",
                      card.badgeTrend === "up"
                        ? "bg-mint/15 text-forest dark:text-mint"
                        : "bg-orange/15 text-orange"
                    )}
                  >
                    {card.badgeTrend === "up" ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    {card.badge}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
