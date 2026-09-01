"use client";

import { useDashboardAnalytics } from "@/lib/hooks/use-dashboard-analytics";
import { DashboardHeader } from "./dashboard-header";
import { KpiCards } from "./kpi-cards";
import { CashflowChart } from "./cashflow-chart";
import { ExpenseDonutChart } from "./expense-donut-chart";
import { MandiRatesTicker } from "./mandi-rates-ticker";
import { SavingsDebtWidget } from "./savings-debt-widget";
import { AiActionCards } from "./ai-action-cards";

export function DashboardView() {
  const { data, loading, isRefreshing, lastFetched, refetch } = useDashboardAnalytics();

  return (
    <div className="h-full w-full overflow-y-auto pt-16 sm:pt-16 lg:pt-8 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6 pb-24">
        {/* Executive Header */}
        <DashboardHeader
          data={data}
          loading={loading}
          isRefreshing={isRefreshing}
          lastFetched={lastFetched}
          onRefresh={refetch}
        />

        {/* KPI Cards Grid */}
        <KpiCards data={data} loading={loading} />

        {/* 2-Column Graph Grid: Cashflow vs Expense Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 flex flex-col">
            <CashflowChart data={data} loading={loading} />
          </div>
          <div className="lg:col-span-1 flex flex-col">
            <ExpenseDonutChart data={data} loading={loading} />
          </div>
        </div>

        {/* Live APMC Mandi Spot Rates */}
        <MandiRatesTicker data={data} loading={loading} />

        {/* Savings & Debt Widgets */}
        <SavingsDebtWidget data={data} loading={loading} />

        {/* AI Saathi Action Items */}
        <AiActionCards data={data} loading={loading} />
      </div>
    </div>
  );
}
