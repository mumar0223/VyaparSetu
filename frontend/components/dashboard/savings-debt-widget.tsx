"use client";

import Link from "next/link";
import { Target, Wallet, ArrowUpRight, Calendar, CheckCircle2 } from "lucide-react";
import type { DashboardAnalyticsData } from "@/lib/hooks/use-dashboard-analytics";

interface SavingsDebtWidgetProps {
  data: DashboardAnalyticsData | null;
  loading: boolean;
}

export function SavingsDebtWidget({ data, loading }: SavingsDebtWidgetProps) {
  const savingsGoals = data?.savingsGoals || [
    {
      id: "sg-1",
      name: "Festive Season Bulk Stock",
      targetAmount: 200000,
      savedAmount: 145000,
      progress: 72,
      targetDate: "Oct 2026",
    },
    {
      id: "sg-2",
      name: "Shop Modernization & Racks",
      targetAmount: 80000,
      savedAmount: 48000,
      progress: 60,
      targetDate: "Dec 2026",
    },
    {
      id: "sg-3",
      name: "Emergency Working Capital Cushion",
      targetAmount: 100000,
      savedAmount: 85000,
      progress: 85,
      targetDate: "Ongoing",
    },
  ];

  const debts = data?.debts || [
    {
      id: "debt-1",
      lender: "SBI PM Mudra Kishor Loan",
      amountOutStanding: 185000,
      totalAmount: 300000,
      emiAmount: 7850,
      interestRate: 8.9,
      nextPaymentDate: "10th of every month",
      status: "ACTIVE",
    },
    {
      id: "debt-2",
      lender: "Local Trade Credit (Wholesale Supplier)",
      amountOutStanding: 35000,
      totalAmount: 50000,
      emiAmount: 5000,
      interestRate: 0,
      nextPaymentDate: "25th of every month",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Savings Goals Card */}
      <div className="rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-mint/15 text-forest dark:text-mint flex items-center justify-center">
                <Target className="size-4" />
              </div>
              <h3 className="text-base font-bold font-sans text-foreground">
                Active Savings Targets
              </h3>
            </div>
            <Link
              href="/savings"
              className="text-xs font-bold text-mint hover:underline flex items-center gap-1"
            >
              <span>Manage Goals</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5 animate-pulse">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-2 w-full bg-muted rounded-full" />
                  </div>
                ))
              : savingsGoals.map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-foreground font-semibold truncate">
                        {goal.name}
                      </span>
                      <span className="font-mono text-muted-foreground shrink-0">
                        ₹{goal.savedAmount.toLocaleString("en-IN")} / ₹{goal.targetAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-mint rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
                      <span>Target: {goal.targetDate}</span>
                      <span className="font-bold text-mint">{goal.progress}% Funded</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Debts & EMIs Card */}
      <div className="rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-orange/15 text-orange flex items-center justify-center">
                <Wallet className="size-4" />
              </div>
              <h3 className="text-base font-bold font-sans text-foreground">
                Active Debt & EMI Schedule
              </h3>
            </div>
            <Link
              href="/debt"
              className="text-xs font-bold text-mint hover:underline flex items-center gap-1"
            >
              <span>Debt Navigator</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2 animate-pulse">
                    <div className="h-4 w-36 bg-muted rounded" />
                    <div className="h-3 w-28 bg-muted rounded" />
                  </div>
                ))
              : debts.map((debt) => (
                  <div
                    key={debt.id}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="font-bold text-foreground truncate block">
                        {debt.lender}
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Due: {debt.nextPaymentDate}
                        </span>
                        {debt.interestRate > 0 && (
                          <span>• {debt.interestRate}% APR</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-sm text-foreground">
                        ₹{debt.emiAmount.toLocaleString("en-IN")}/mo
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Rem: ₹{debt.amountOutStanding.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
