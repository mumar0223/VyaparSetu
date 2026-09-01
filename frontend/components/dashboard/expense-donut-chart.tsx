"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, Sparkles } from "lucide-react";
import type { DashboardAnalyticsData } from "@/lib/hooks/use-dashboard-analytics";

interface ExpenseDonutChartProps {
  data: DashboardAnalyticsData | null;
  loading: boolean;
}

export function ExpenseDonutChart({ data, loading }: ExpenseDonutChartProps) {
  const categories = data?.expenseCategories || [
    { name: "Inventory & Stock", amount: 21707, color: "#16a34a", percentage: 48 },
    { name: "Store Rent & Lease", amount: 9044, color: "#f97316", percentage: 20 },
    { name: "Logistics & Transport", amount: 6331, color: "#3b82f6", percentage: 14 },
    { name: "Utilities & Electricity", amount: 4522, color: "#eab308", percentage: 10 },
    { name: "Staff & Labour", amount: 3618, color: "#8b5cf6", percentage: 8 },
  ];

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);
  const topCategory = categories.reduce(
    (max, c) => (c.percentage > max.percentage ? c : max),
    categories[0]
  );

  return (
    <div className="rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border p-5 shadow-2xs flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-base font-bold font-sans text-foreground">
            Expense Allocation
          </h3>
          <p className="text-xs text-muted-foreground">
            Distribution across operating categories
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono font-bold text-foreground">
            ₹{totalExpense.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-muted-foreground block">/ month</span>
        </div>
      </div>

      {/* Donut Visual */}
      <div className="h-44 w-full min-w-0 relative flex items-center justify-center">
        {loading ? (
          <div className="size-36 rounded-full border-8 border-muted border-t-mint animate-spin" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="amount"
              >
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 100, pointerEvents: "none" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-popover/95 backdrop-blur-md border border-border p-2.5 shadow-xl text-xs font-sans space-y-1 relative z-50">
                        <div className="font-bold text-foreground">{item.name}</div>
                        <div className="text-muted-foreground flex items-center justify-between gap-3">
                          <span>Amount:</span>
                          <span className="font-mono font-bold text-foreground">
                            ₹{Number(item.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex items-center justify-between gap-3">
                          <span>Share:</span>
                          <span className="font-bold text-mint">{item.percentage}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Centered Total Label */}
        {!loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-0">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Total Burn
            </span>
            <span className="text-xs font-bold font-mono text-foreground">
              100%
            </span>
          </div>
        )}
      </div>

      {/* Categories Breakdown List */}
      <div className="space-y-2 flex-1">
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate text-foreground font-medium">
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                <span className="font-semibold text-foreground">
                  ₹{cat.amount.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-muted-foreground font-bold w-8 text-right">
                  {cat.percentage}%
                </span>
              </div>
            </div>
            {/* Miniature progress bar */}
            <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary Pill */}
      <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-mint shrink-0" />
        <span className="truncate">
          Highest cost: <strong className="text-foreground">{topCategory.name}</strong> ({topCategory.percentage}%)
        </span>
      </div>
    </div>
  );
}
