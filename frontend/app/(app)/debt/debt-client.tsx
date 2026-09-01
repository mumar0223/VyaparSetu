"use client";

import { useState } from "react";
import {
  HandCoins,
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

export interface DebtItem {
  id: string;
  type: string;
  lender: string;
  amountOutStanding: number;
  totalAmount: number;
  interestRate?: number | null;
  nextPaymentDate?: string | Date | null;
  emiAmount?: number | null;
  status: string;
}

const DEBT_TYPES = [
  { value: "TERM_LOAN", label: "Term Loan" },
  { value: "WORKING_CAPITAL", label: "Working Capital Loan" },
  { value: "EQUIPMENT_FINANCING", label: "Equipment Financing" },
  { value: "CREDIT_CARD", label: "Business Credit Card" },
  { value: "OTHER", label: "Informal / Supplier Khata" },
];

export function DebtClient({ initialDebts }: { initialDebts: DebtItem[] }) {
  const [debts, setDebts] = useState<DebtItem[]>(initialDebts);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [lender, setLender] = useState("");
  const [type, setType] = useState("TERM_LOAN");
  const [amountOutStanding, setAmountOutStanding] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender || !amountOutStanding || isNaN(parseFloat(amountOutStanding))) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lender,
          type,
          amountOutStanding: parseFloat(amountOutStanding),
          totalAmount: totalAmount ? parseFloat(totalAmount) : parseFloat(amountOutStanding),
          interestRate: interestRate ? parseFloat(interestRate) : undefined,
          emiAmount: emiAmount ? parseFloat(emiAmount) : undefined,
          nextPaymentDate: nextPaymentDate || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to record debt");
      const created = await res.json();

      toast.success("Debt record added successfully!");
      setDebts((prev) => [created, ...prev]);
      setShowAddModal(false);
      setLender("");
      setAmountOutStanding("");
      setTotalAmount("");
      setInterestRate("");
      setEmiAmount("");
    } catch (err) {
      toast.error("Error creating debt record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    try {
      const res = await fetch(`/api/debts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Debt settled and removed");
        setDebts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      toast.error("Failed to remove debt");
    }
  };

  const totalOutstanding = debts.reduce((sum, d) => sum + d.amountOutStanding, 0);
  const totalMonthlyEmi = debts.reduce((sum, d) => sum + (d.emiAmount || 0), 0);

  const selectedTypeLabel =
    DEBT_TYPES.find((item) => item.value === type)?.label || type;

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <HandCoins className="size-7 text-mint" /> Debt &amp; Liability Navigator
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Monitor active bank credit, informal supplier borrowing, and monthly EMI commitments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="size-4" /> Add Liability / Loan
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs">
          <span className="text-xs font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            Total Outstanding Debt
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-destructive">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs">
          <span className="text-xs font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            Total Monthly EMI Burden
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-orange">
            ₹{totalMonthlyEmi.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs">
          <span className="text-xs font-bold text-ink-muted dark:text-muted-foreground uppercase tracking-wider block mb-1">
            Active Accounts
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-forest dark:text-foreground">
            {debts.length}
          </span>
        </div>
      </div>

      {/* Debts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1">
        {debts.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-card rounded-2xl border border-dashed border-sage/40 dark:border-border p-12 text-center">
            <HandCoins className="size-10 text-sage dark:text-muted-foreground mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-base">No active debt liabilities</h4>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Log formal bank loans or supplier credit to track repayment schedules and interest drag.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-forest dark:bg-mint text-white dark:text-black text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Record First Liability
            </button>
          </div>
        ) : (
          debts.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-full">
                    {d.type.replace("_", " ")}
                  </span>
                  <span className="text-xs font-bold text-foreground bg-cream dark:bg-muted px-2 py-0.5 rounded border border-sage/30 dark:border-border">
                    {d.status}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base sm:text-lg text-forest dark:text-foreground mb-1">
                  {d.lender}
                </h3>

                <div className="bg-cream dark:bg-muted/40 rounded-xl p-3 my-3 border border-sage/30 dark:border-border space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding:</span>
                    <span className="font-bold text-destructive">
                      ₹{d.amountOutStanding.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Sanction:</span>
                    <span className="font-bold text-foreground">
                      ₹{d.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {d.interestRate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Interest:</span>
                      <span className="font-bold text-orange">{d.interestRate}% p.a.</span>
                    </div>
                  )}
                  {d.emiAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly EMI:</span>
                      <span className="font-bold text-foreground">₹{d.emiAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteDebt(d.id)}
                className="w-full py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="size-3.5" /> Settle / Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Debt Modal with Shadcn DropdownMenu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/40 dark:border-border w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sage/20 dark:border-border mb-4">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                <HandCoins className="size-5 text-mint" /> Record Liability or Loan
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebt} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Lender / Creditor Name *
                </label>
                <input
                  type="text"
                  required
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  placeholder="e.g. Bank of Maharashtra / Local Arhatiya"
                  className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                />
              </div>

              {/* Shadcn DropdownMenu for Debt Type */}
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Debt Type
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                    <span>{selectedTypeLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                    {DEBT_TYPES.map((item) => (
                      <DropdownMenuItem
                        key={item.value}
                        onClick={() => setType(item.value)}
                        className="px-3 py-2 text-xs font-semibold text-foreground hover:bg-cream dark:hover:bg-muted rounded-lg cursor-pointer"
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                    Outstanding (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountOutStanding}
                    onChange={(e) => setAmountOutStanding(e.target.value)}
                    placeholder="e.g. 200000"
                    className="w-full px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                    Total Sanction (₹)
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="e.g. 250000"
                    className="w-full px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g. 9.5"
                    className="w-full px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                    Monthly EMI (₹)
                  </label>
                  <input
                    type="number"
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-sage/20 dark:border-border flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-sage/40 dark:border-border text-xs font-bold text-muted-foreground hover:bg-cream dark:hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange hover:bg-orange-hover text-white text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Record Debt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
