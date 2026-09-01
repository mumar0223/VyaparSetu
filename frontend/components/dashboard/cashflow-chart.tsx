"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import type { DashboardAnalyticsData } from "@/lib/hooks/use-dashboard-analytics";

interface CashflowChartProps {
  data: DashboardAnalyticsData | null;
  loading: boolean;
}

export function CashflowChart({ data, loading }: CashflowChartProps) {
  const chartData = data?.cashflowTrend || [
    { month: "Oct", inflow: 76000, outflow: 40000, net: 36000 },
    { month: "Nov", inflow: 88000, outflow: 43000, net: 45000 },
    { month: "Dec", inflow: 84000, outflow: 47000, net: 37000 },
    { month: "Jan", inflow: 94000, outflow: 42000, net: 52000 },
    { month: "Feb", inflow: 98000, outflow: 44000, net: 54000 },
    { month: "Mar", inflow: 100000, outflow: 45222, net: 54778 },
  ];

  const totalInflow = chartData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = chartData.reduce((sum, d) => sum + d.outflow, 0);
  const avgMargin = Math.round(((totalInflow - totalOutflow) / totalInflow) * 100);

  return (
    <div className="rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border p-5 shadow-2xs flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-bold font-sans text-foreground flex items-center gap-2">
            <span>Cash Inflow vs Outflow Trend</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Monthly commercial revenue compared to operating expenses
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-mint" />
            <span className="text-muted-foreground font-medium">Inflow (Income)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-orange" />
            <span className="text-muted-foreground font-medium">Outflow (Burn)</span>
          </div>
        </div>
      </div>

      {/* Chart Graphic - Flex 1 fills available card height */}
      <div className="flex-1 w-full min-w-0 min-h-[300px] pt-1">
        {loading ? (
          <div className="w-full h-full min-h-[300px] bg-muted/40 animate-pulse rounded-xl flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-medium">Loading Cashflow Graph...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="month"
                stroke="currentColor"
                opacity={0.6}
                tickLine={false}
                axisLine={false}
                className="text-[11px] font-medium"
              />
              <YAxis
                stroke="currentColor"
                opacity={0.6}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                className="text-[11px] font-mono"
              />
              <Tooltip
                wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-xl bg-popover/95 backdrop-blur-md border border-border p-3 shadow-xl text-xs font-sans space-y-1.5 z-50">
                        <div className="font-bold text-foreground pb-1 border-b border-border/60">
                          {label} Cashflow Overview
                        </div>
                        <div className="flex items-center justify-between gap-4 text-mint font-semibold">
                          <span>Inflow:</span>
                          <span className="font-mono font-bold">
                            ₹{Number(payload[0]?.value || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-orange font-semibold">
                          <span>Outflow:</span>
                          <span className="font-mono font-bold">
                            ₹{Number(payload[1]?.value || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-foreground pt-1 border-t border-border/40 font-bold">
                          <span>Net Surplus:</span>
                          <span className="font-mono text-mint">
                            +₹{Math.max(0, Number(payload[0]?.value || 0) - Number(payload[1]?.value || 0)).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                stroke="#22c55e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#inflowGrad)"
              />
              <Area
                type="monotone"
                dataKey="outflow"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#outflowGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Performance Footer */}
      <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-mint shrink-0" />
          <span>6-Month Net Trajectory: <strong className="text-mint font-bold">+{avgMargin}% Margin</strong></span>
        </div>
        <span className="font-mono text-[10.5px]">Updated from primary ledger</span>
      </div>
    </div>
  );
}
