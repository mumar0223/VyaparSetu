"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, FileText, AlertCircle, Plus, Minus } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface DashboardData {
  user: { name: string };
  metrics: {
    revenue: number;
    expenses: number;
    balance: number;
    transactionsCount: number;
    topExpenseCategory: string;
  };
  alerts: Array<{
    id: string;
    type: "warning" | "info" | "success" | "destructive";
    title: string;
    message: string;
  }>;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      // Mocking for now, adjust when API is perfectly available
      try {
        const response = await apiClient.get<DashboardData>("/dashboard");
        return response;
      } catch (err) {
        console.warn("API not reachable yet, returning fallback mock data.");
        // Fallback simulated data if API fails to run
        return {
          user: { name: "Ramesh" },
          metrics: {
            revenue: 42000,
            expenses: 27500,
            balance: 14500,
            transactionsCount: 18,
            topExpenseCategory: "Raw Materials",
          },
          alerts: [
            {
              id: "1",
              type: "warning",
              title: "Your expenses are ₹3,200 higher than last month.",
              message: "Most of the extra money went to Raw Materials.",
            },
            {
              id: "2",
              type: "info",
              title: "Your loan payment of ₹4,500 is due in 5 days.",
              message: "SBI Term Loan monthly installment.",
            }
          ]
        };
      }
    }
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 animate-pulse text-ink animate-skeleton-shimmer">
        <div className="h-8 bg-sage/20 rounded w-1/3 mb-2" />
        <div className="h-4 bg-sage/20 rounded w-1/4" />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-red-500">Failed to load dashboard data.</div>;
  }

  const { user, metrics, alerts } = data;
  const balancePercentage = metrics.revenue > 0 ? (metrics.balance / metrics.revenue) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 md:pb-0">
      <div className="space-y-1">
        <h2 className="text-3xl font-serif font-bold text-forest tracking-tight">Good morning, {user?.name}</h2>
        <p className="text-ink-muted">Here is how your business is doing this month.</p>
      </div>

      {/* Main Financial Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-sage/30 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-muted uppercase tracking-wider mb-2">
            <ArrowUpRight className="size-5 text-mint" />
            Money earned
          </div>
          <div className="text-4xl font-bold tracking-tight text-forest pb-2">₹{metrics.revenue.toLocaleString('en-IN')}</div>
          <p className="text-sm font-medium text-ink-muted/80">From {metrics.transactionsCount} transactions</p>
        </div>

        <div className="rounded-3xl border border-sage/30 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-muted uppercase tracking-wider mb-2">
            <ArrowDownRight className="size-5 text-orange" />
            Money spent
          </div>
          <div className="text-4xl font-bold tracking-tight text-forest pb-2">₹{metrics.expenses.toLocaleString('en-IN')}</div>
          <p className="text-sm font-medium text-ink-muted/80">Highest expense: {metrics.topExpenseCategory}</p>
        </div>

        <div className="rounded-3xl border border-mint/40 bg-mint-pale p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-forest uppercase tracking-wider mb-2">
            Money left
          </div>
          <div className="text-4xl font-bold tracking-tight text-forest pb-2">₹{metrics.balance.toLocaleString('en-IN')}</div>
          <div className="mt-4 w-full bg-sage/30 rounded-full h-2 overflow-hidden">
            <div className="bg-mint h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, balancePercentage))}%` }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <button className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sage/50 bg-white p-5 text-forest font-bold hover:border-mint hover:bg-mint-pale transition-all active:scale-95">
          <Plus className="size-5 group-hover:text-mint" />
          <span>Add Money In</span>
        </button>
        <button className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sage/50 bg-white p-5 text-forest font-bold hover:border-orange hover:bg-orange/5 transition-all active:scale-95">
          <Minus className="size-5 group-hover:text-orange" />
          <span>Add Money Out</span>
        </button>
      </div>

      {/* Alerts / Things to notice */}
      {alerts.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">Things to notice</h3>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border p-5 transition-shadow hover:shadow-sm",
                  alert.type === 'warning' && "border-orange/30 bg-orange/5",
                  alert.type === 'info' && "border-mint/30 bg-mint-pale text-forest",
                  alert.type === 'destructive' && "border-red-200 bg-red-50 text-red-900",
                )}
              >
                <div className={cn(
                  "rounded-full p-2 mt-0.5",
                  alert.type === 'warning' && "bg-orange/20 text-orange-hover",
                  alert.type === 'info' && "bg-mint-light text-forest",
                  alert.type === 'destructive' && "bg-red-200 text-red-700",
                )}>
                  {alert.type === 'info' ? <FileText className="size-5" /> : <AlertCircle className="size-5" />}
                </div>
                <div className="flex-1">
                  <h4 className={cn(
                    "font-bold text-lg",
                    alert.type === 'warning' && "text-orange-hover",
                    alert.type === 'info' && "text-forest",
                    alert.type === 'destructive' && "text-red-900",
                  )}>
                    {alert.title}
                  </h4>
                  <p className={cn(
                    "mt-1 text-sm font-medium",
                    alert.type === 'warning' ? "text-orange-hover/80" : "text-ink-muted",
                  )}>
                    {alert.message}
                  </p>
                  <button className={cn(
                    "mt-3 text-sm font-bold hover:underline",
                    alert.type === 'warning' && "text-orange-hover",
                    alert.type === 'info' && "text-forest",
                    alert.type === 'destructive' && "text-red-700",
                  )}>
                    See details &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
