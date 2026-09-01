"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Bot, Building2, MapPin, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardAnalyticsData } from "@/lib/hooks/use-dashboard-analytics";

interface DashboardHeaderProps {
  data: DashboardAnalyticsData | null;
  loading: boolean;
  isRefreshing: boolean;
  lastFetched: number | null;
  onRefresh: () => void;
}

export function DashboardHeader({
  data,
  loading,
  isRefreshing,
  lastFetched,
  onRefresh,
}: DashboardHeaderProps) {
  const healthScore = data?.kpis?.healthScore || 84;
  const business = data?.business;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-forest dark:text-mint">
            {loading ? (
              <span className="inline-block w-48 h-8 bg-muted animate-pulse rounded-lg" />
            ) : (
              business?.name || "My Enterprise"
            )}
          </h1>
          {!loading && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-mint-pale dark:bg-mint/15 text-forest dark:text-mint border border-mint/30">
              <ShieldCheck className="size-3.5" />
              Verified MSME
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="size-3.5 opacity-70" />
            {business?.category || "Kirana & Commerce"}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 opacity-70" />
            {business?.city || "Pune"}, {business?.state || "Maharashtra"}
          </span>
          <span className="font-mono text-[11px] opacity-80">
            {business?.regNumber || "UDYAM-MH-12-0098765"}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Health Score Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border shadow-2xs">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Health Score
            </span>
            <span className="text-xs font-bold text-foreground">
              {healthScore >= 75 ? "Strong" : healthScore >= 50 ? "Moderate" : "Needs Attention"}
            </span>
          </div>
          <div className="size-9 rounded-full bg-mint/15 dark:bg-mint/20 border-2 border-mint flex items-center justify-center font-bold text-forest dark:text-mint text-xs font-mono">
            {healthScore}
          </div>
        </div>

        {/* Sync / Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing || loading}
          className="h-9 px-3 text-xs font-semibold rounded-xl bg-white/40 dark:bg-muted/40 hover:bg-white/70 dark:hover:bg-muted/70 border border-sage/20 dark:border-border text-foreground transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Data cached for 1 hour. Click to sync latest numbers immediately."
        >
          <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin text-mint")} />
          <span className="hidden sm:inline">
            {lastFetched ? formatDistanceToNow(lastFetched, { addSuffix: true }) : "1-hr Cache"}
          </span>
        </button>

        {/* Ask AI Saathi Quick Jump */}
        <Link
          href="/ai-saathi"
          className="h-9 px-3.5 text-xs font-bold rounded-xl bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <Bot className="size-3.5" />
          <span>Ask AI Saathi</span>
        </Link>
      </div>
    </div>
  );
}
