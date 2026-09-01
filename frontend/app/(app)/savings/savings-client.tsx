"use client";

import { useState } from "react";
import {
  Target,
  Plus,
  PiggyBank,
  Calendar,
  X,
} from "lucide-react";
import { toast } from "sonner";

export interface SavingContributionItem {
  id: string;
  amount: number;
  date: string | Date;
  notes?: string | null;
}

export interface SavingGoalItem {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string | Date | null;
  status: string;
  contributions: SavingContributionItem[];
}

export function SavingsClient({ initialGoals }: { initialGoals: SavingGoalItem[] }) {
  const [goals, setGoals] = useState<SavingGoalItem[]>(initialGoals);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || isNaN(parseFloat(targetAmount))) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetAmount: parseFloat(targetAmount),
          targetDate: targetDate || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create goal");
      const created = await res.json();

      toast.success("New savings goal created!");
      setGoals((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setName("");
      setTargetAmount("");
      setTargetDate("");
    } catch (err) {
      toast.error("Error creating savings goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !depositAmount || isNaN(parseFloat(depositAmount))) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/savings/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savingGoalId: selectedGoalId,
          amount: parseFloat(depositAmount),
          notes: depositNotes,
        }),
      });

      if (!res.ok) throw new Error("Failed to record deposit");
      const data = await res.json();

      toast.success("Savings deposit recorded successfully!");
      setGoals((prev) =>
        prev.map((g) => (g.id === selectedGoalId ? data.goal : g))
      );
      setShowDepositModal(false);
      setDepositAmount("");
      setDepositNotes("");
    } catch (err) {
      toast.error("Error making deposit");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Target className="size-7 text-mint" /> Goal-Based Savings &amp; Emergency Reserves
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Build liquid buffers for seasonal working capital, machinery upgrades, and unforeseen shocks
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="size-4" /> New Savings Goal
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs">
          <span className="text-xs font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            Total Saved
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-forest dark:text-foreground">
            ₹{totalSaved.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs">
          <span className="text-xs font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            Total Target
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-forest dark:text-foreground">
            ₹{totalTarget.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs">
          <span className="text-xs font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            Overall Completion
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-forest dark:text-mint">
            {overallPercentage}%
          </span>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1">
        {goals.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-card rounded-2xl border border-dashed border-sage/40 dark:border-border p-12 text-center">
            <PiggyBank className="size-10 text-sage dark:text-muted-foreground mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-base">No active savings goals</h4>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create dedicated goal buckets like &quot;Monsoon Buffer&quot; or &quot;New Machinery&quot; to build resilience.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-forest dark:bg-mint text-white dark:text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const pct = Math.min(Math.round((goal.savedAmount / (goal.targetAmount || 1)) * 100), 100);
            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-full">
                      {goal.status}
                    </span>
                    {goal.targetDate && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        {new Date(goal.targetDate).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base sm:text-lg text-forest dark:text-foreground mb-1">
                    {goal.name}
                  </h3>

                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-lg font-bold text-forest dark:text-foreground">
                      ₹{goal.savedAmount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      of ₹{goal.targetAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-cream dark:bg-muted rounded-full h-3 mb-4 overflow-hidden border border-sage/30 dark:border-border">
                    <div
                      className="bg-mint h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Recent Deposits Preview */}
                  {goal.contributions && goal.contributions.length > 0 && (
                    <div className="bg-cream/60 dark:bg-muted/40 rounded-xl p-2.5 mb-4 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Latest Deposit:</span>
                      <div className="flex justify-between font-medium text-forest dark:text-foreground">
                        <span>+₹{goal.contributions[0].amount.toLocaleString("en-IN")}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(goal.contributions[0].date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedGoalId(goal.id);
                    setShowDepositModal(true);
                  }}
                  className="w-full py-2.5 bg-forest dark:bg-mint text-white dark:text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-4" /> Deposit Funds
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-forest/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/40 dark:border-border w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sage/20 dark:border-border mb-4">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                <Target className="size-5 text-mint" /> Create Savings Goal
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Goal Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monsoon Cash Buffer / Solar Chiller"
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Target Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                />
              </div>

              <div className="pt-4 border-t border-sage/20 dark:border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-sage/40 dark:border-border text-xs font-bold text-muted-foreground hover:bg-cream dark:hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-forest/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/40 dark:border-border w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sage/20 dark:border-border mb-4">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                <PiggyBank className="size-5 text-mint" /> Add Funds to Goal
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Deposit Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Deposit Notes
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="e.g. Weekly Kirana cash surplus"
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                />
              </div>

              <div className="pt-4 border-t border-sage/20 dark:border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-sage/40 dark:border-border text-xs font-bold text-muted-foreground hover:bg-cream dark:hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-forest dark:bg-mint text-white dark:text-black text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
