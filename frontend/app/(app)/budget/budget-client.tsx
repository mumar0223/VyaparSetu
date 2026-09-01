"use client";

import { useState } from "react";
import {
  PieChart,
  Plus,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface BudgetItemData {
  id: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
}

export interface BudgetData {
  id: string;
  name: string;
  period: string;
  totalLimit: number;
  items: BudgetItemData[];
}

const CATEGORY_OPTIONS = [
  "Raw Materials & Stock",
  "Transport & Logistics",
  "Shop Rent & Power",
  "Staff Wages & Daily Labor",
  "Marketing & Promotions",
  "Repairs & Maintenance",
  "General Miscellaneous",
];

export function BudgetClient({ initialBudgets }: { initialBudgets: BudgetData[] }) {
  const [budgets, setBudgets] = useState<BudgetData[]>(initialBudgets);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [name, setName] = useState("Monthly Operational Budget");
  const [period, setPeriod] = useState("MONTHLY");
  const [totalLimit, setTotalLimit] = useState("");
  const [items, setItems] = useState<{ category: string; allocatedAmount: number }[]>([
    { category: CATEGORY_OPTIONS[0], allocatedAmount: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { category: CATEGORY_OPTIONS[0], allocatedAmount: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalLimit || isNaN(parseFloat(totalLimit))) return;

    setSubmitting(true);
    try {
      const amountVal = parseFloat(totalLimit);
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name?.trim() || `${period} Operating Budget`,
          period,
          totalAmount: amountVal,
          totalLimit: amountVal,
          items: items.filter((it) => it.allocatedAmount > 0),
        }),
      });

      if (!res.ok) throw new Error("Failed to create budget");
      const created = await res.json();

      toast.success("Budget plan created successfully!");
      setBudgets((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setTotalLimit("");
    } catch (err) {
      toast.error("Error creating budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Budget deleted");
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete budget");
    }
  };

  const activeBudget = budgets[0];

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <PieChart className="size-7 text-mint" /> Budget Allocation &amp; Variance Tracking
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Set category-wise expense caps and monitor real-time department spending limits
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="size-4" /> Create New Budget
        </button>
      </div>

      {!activeBudget ? (
        <div className="flex-1 bg-white dark:bg-card rounded-2xl border border-dashed border-sage/40 dark:border-border p-12 text-center flex flex-col items-center justify-center">
          <PieChart className="size-12 text-sage dark:text-muted-foreground mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-foreground">No active budget plans</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mt-1 mb-4">
            Create a monthly or quarterly spending cap to prevent margin erosion across raw materials, rent, and wages.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-forest dark:bg-mint text-white dark:text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Setup Monthly Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Budget Overview Card */}
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage/20 dark:border-border pb-4 mb-4">
              <div>
                <span className="text-[11px] font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                  {activeBudget.period} PLAN
                </span>
                <h2 className="text-xl font-serif font-bold text-forest dark:text-foreground">
                  {activeBudget.name}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Total Monthly Limit</span>
                  <span className="text-2xl font-serif font-bold text-forest dark:text-foreground">
                    ₹{activeBudget.totalLimit.toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteBudget(activeBudget.id)}
                  className="text-muted-foreground hover:text-destructive p-2 rounded-xl border border-sage/30 dark:border-border cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {/* Department Items List */}
            <h4 className="font-serif font-bold text-base text-forest dark:text-foreground mb-3">
              Department Caps vs. Actual Recorded Outflows
            </h4>

            <div className="space-y-4">
              {activeBudget.items.map((item) => {
                const pct = Math.min(
                  Math.round((item.spentAmount / (item.allocatedAmount || 1)) * 100),
                  100
                );
                const isOver = item.spentAmount > item.allocatedAmount;

                return (
                  <div
                    key={item.id}
                    className="bg-cream/50 dark:bg-muted/30 rounded-xl p-4 border border-sage/30 dark:border-border"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-forest dark:text-foreground text-sm">
                        {item.category}
                      </span>
                      <div className="text-xs font-semibold">
                        <span className={isOver ? "text-destructive font-bold" : "text-forest dark:text-foreground"}>
                          Spent: ₹{item.spentAmount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-muted-foreground"> / ₹{item.allocatedAmount.toLocaleString("en-IN")}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">({pct}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-white dark:bg-muted rounded-full h-2.5 overflow-hidden border border-sage/20 dark:border-border">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? "bg-destructive" : pct > 80 ? "bg-orange" : "bg-mint"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Budget Modal with Shadcn DropdownMenu */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-forest/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/40 dark:border-border w-full max-w-lg p-6 shadow-xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-sage/20 dark:border-border mb-4">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                <PieChart className="size-5 text-mint" /> Define Budget Allocation
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Budget Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-semibold text-foreground outline-none focus:border-mint"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                    Overall Cap (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={totalLimit}
                    onChange={(e) => setTotalLimit(e.target.value)}
                    placeholder="e.g. 80000"
                    className="w-full px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                    Budget Period
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                      <span>{period}</span>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                      {["MONTHLY", "QUARTERLY", "ANNUAL"].map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => setPeriod(p)}
                          className="px-3 py-2 text-xs font-semibold text-foreground hover:bg-cream dark:hover:bg-muted rounded-lg cursor-pointer"
                        >
                          {p}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Department Caps with DropdownMenu */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider">
                    Category Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-mint hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Add Category
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-full px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                          <span className="truncate">{it.category}</span>
                          <ChevronDown className="size-3.5 text-muted-foreground shrink-0 ml-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72 max-h-48 overflow-y-auto bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                          {CATEGORY_OPTIONS.map((cat) => (
                            <DropdownMenuItem
                              key={cat}
                              onClick={() => {
                                const copy = [...items];
                                copy[idx].category = cat;
                                setItems(copy);
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-cream dark:hover:bg-muted rounded-lg cursor-pointer"
                            >
                              {cat}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <input
                      type="number"
                      placeholder="Cap ₹"
                      value={it.allocatedAmount || ""}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].allocatedAmount = parseFloat(e.target.value) || 0;
                        setItems(copy);
                      }}
                      className="w-28 px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-mint"
                    />

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
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
                  {submitting ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
