"use client";

import { useState } from "react";
import {
  IndianRupee,
  Plus,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string | Date;
  vendor?: string | null;
  description?: string | null;
  paymentMethod?: string | null;
  recurring: boolean;
  notes?: string | null;
}

const CATEGORIES = [
  "Raw Materials",
  "Logistics & Transport",
  "Store Rent & Utilities",
  "Labor & Wages",
  "Marketing & Signage",
  "Equipment Maintenance",
  "General Operations",
];

const PAYMENT_METHODS = [
  "UPI / Online",
  "Cash",
  "Bank NEFT / RTGS",
  "Cheque",
  "Supplier Khata (Credit)",
];

export function ExpensesClient({ initialExpenses }: { initialExpenses: ExpenseItem[] }) {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [recurring, setRecurring] = useState(false);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          vendor,
          description,
          paymentMethod,
          recurring,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save expense");
      const created = await res.json();

      toast.success("Expense recorded successfully!");
      setExpenses((prev) => [created, ...prev]);
      setShowAddModal(false);
      setAmount("");
      setVendor("");
      setDescription("");
    } catch (err) {
      toast.error("Error creating expense record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Expense moved to Recycle Bin");
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete expense");
    }
  };

  // Calculations
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const recurringMonthly = expenses
    .filter((e) => e.recurring)
    .reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const highestCategory =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const filteredExpenses =
    selectedCategory === "ALL"
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <IndianRupee className="size-7 text-mint" /> {t("expenses.title", "Daily Expense Tracker")}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            {t("expenses.subtitle", "Track business cash outflows, monitor supplier payments, and identify margin leaks")}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="size-4" /> {t("expenses.addExpense", "Add Expense")}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/40 dark:bg-card/40 p-4 sm:p-5 rounded-2xl border border-sage/20 dark:border-border shadow-xs">
          <span className="text-[11px] font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            {t("expenses.totalSpent", "Total Outflow")}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-forest dark:text-foreground">
            ₹{totalSpent.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white/40 dark:bg-card/40 p-4 sm:p-5 rounded-2xl border border-sage/20 dark:border-border shadow-xs">
          <span className="text-[11px] font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            {t("expenses.highestCategory", "Highest Category")}
          </span>
          <span className="text-base sm:text-lg font-bold text-forest dark:text-foreground truncate block">
            {highestCategory}
          </span>
        </div>

        <div className="bg-white/40 dark:bg-card/40 p-4 sm:p-5 rounded-2xl border border-sage/20 dark:border-border shadow-xs">
          <span className="text-[11px] font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            {t("expenses.recurringMonthly", "Recurring Monthly")}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-forest dark:text-foreground">
            ₹{recurringMonthly.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white/40 dark:bg-card/40 p-4 sm:p-5 rounded-2xl border border-sage/20 dark:border-border shadow-xs">
          <span className="text-[11px] font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            {t("expenses.recordsCount", "Total Entries")}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-forest dark:text-foreground">
            {expenses.length}
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 shrink-0">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "ALL"
              ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
              : "bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border text-ink-muted dark:text-muted-foreground hover:text-foreground"
          }`}
        >
          All Categories ({expenses.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
                : "bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border text-ink-muted dark:text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat} {categoryTotals[cat] ? `(₹${categoryTotals[cat].toLocaleString("en-IN")})` : ""}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white/40 dark:bg-card/40 rounded-2xl border border-sage/20 dark:border-border shadow-xs overflow-hidden flex-1">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <IndianRupee className="size-10 text-sage mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-base">No expense records found</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add Expense&quot; above to log your daily business purchases.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-cream/60 dark:bg-muted/40 border-b border-sage/30 dark:border-border text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Vendor / Payee</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/20 dark:divide-border/50">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-cream/30 dark:hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-forest dark:text-foreground">
                      {exp.category}
                      {exp.recurring && (
                        <span className="ml-1.5 text-[10px] bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint px-1.5 py-0.5 rounded font-normal">
                          Recurring
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {exp.vendor || exp.description || "General Purchase"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{exp.paymentMethod || "UPI"}</td>
                    <td className="py-3 px-4 text-right font-bold text-forest dark:text-mint whitespace-nowrap">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        title="Move to Recycle Bin"
                        className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal with Shadcn DropdownMenu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/40 dark:border-border w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sage/20 dark:border-border mb-4">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                <Plus className="size-5 text-mint" /> Record Business Expense
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint focus:ring-2 focus:ring-mint-light"
                />
              </div>

              {/* Shadcn Dropdown for Category */}
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Category *
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                    <span>{category}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-56 overflow-y-auto bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                    {CATEGORIES.map((c) => (
                      <DropdownMenuItem
                        key={c}
                        onClick={() => setCategory(c)}
                        className="px-3 py-2 text-xs font-semibold text-foreground hover:bg-cream dark:hover:bg-muted rounded-lg cursor-pointer"
                      >
                        {c}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Vendor / Payee Name
                </label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Kolhapur Agro Mandi"
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                />
              </div>

              {/* Shadcn Dropdown for Payment Method */}
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Payment Method
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                    <span>{paymentMethod}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                    {PAYMENT_METHODS.map((m) => (
                      <DropdownMenuItem
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className="px-3 py-2 text-xs font-semibold text-foreground hover:bg-cream dark:hover:bg-muted rounded-lg cursor-pointer"
                      >
                        {m}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="size-4 accent-forest rounded cursor-pointer"
                />
                <label htmlFor="recurring" className="text-xs font-semibold text-foreground cursor-pointer">
                  Recurring Monthly Expense (Rent, Wages, Utilities)
                </label>
              </div>

              <div className="pt-4 border-t border-sage/20 dark:border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-sage/40 dark:border-border text-xs font-bold text-muted-foreground hover:bg-cream dark:hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
