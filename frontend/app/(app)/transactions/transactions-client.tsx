"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
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

export interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  date: string | Date;
  category?: string | null;
  description?: string | null;
  referenceId?: string | null;
}

const TRANSACTION_TYPES = [
  { value: "INCOME", label: "Income (Sale / Customer Inward)" },
  { value: "EXPENSE", label: "Expense (Supplier / Utility Outflow)" },
  { value: "SAVING", label: "Savings (Deposit / Reserve)" },
  { value: "DEBT_PAYMENT", label: "Debt Payment (EMI / Loan)" },
];

export function TransactionsClient({ initialTransactions }: { initialTransactions: TransactionItem[] }) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [type, setType] = useState("INCOME");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Direct Sales");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          category,
          description,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to record transaction");
      const created = await res.json();

      toast.success("Transaction recorded in master ledger!");
      setTransactions((prev) => [created, ...prev]);
      setShowAddModal(false);
      setAmount("");
      setDescription("");
    } catch (err) {
      toast.error("Error recording transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const headers = ["Date", "Type", "Category", "Description", "Amount (INR)"];
    const rows = transactions.map((t) => [
      new Date(t.date).toISOString().split("T")[0],
      t.type,
      t.category || "",
      `"${t.description || ""}"`,
      t.amount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VyaparSetu_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Master ledger exported as CSV!");
  };

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      (t.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "ALL" || t.type === selectedType;
    return matchesSearch && matchesType;
  });

  const selectedTypeLabel =
    TRANSACTION_TYPES.find((item) => item.value === type)?.label || type;

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <FileText className="size-7 text-mint" /> Master Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Audit-compliant record of all sales, payments, savings, and expense entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted text-foreground font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="size-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" /> Record Entry
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description or category..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-card border border-sage/40 dark:border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-mint"
          />
          <Search className="size-4 text-sage dark:text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "INCOME", "EXPENSE", "SAVING", "DEBT_PAYMENT"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedType === t
                  ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
                  : "bg-white dark:bg-card border border-sage/40 dark:border-border text-ink-muted dark:text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border shadow-xs overflow-hidden flex-1">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="size-10 text-sage mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-base">No transactions matched</h4>
            <p className="text-xs text-muted-foreground mt-1">Record a new sales or expense entry to populate the ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-cream/60 dark:bg-muted/40 border-b border-sage/30 dark:border-border text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/20 dark:divide-border/50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-cream/30 dark:hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${
                          t.type === "INCOME"
                            ? "bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint font-bold"
                            : t.type === "SAVING"
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                            : "bg-orange/10 dark:bg-orange/20 text-orange"
                        }`}
                      >
                        {t.type === "INCOME" ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {t.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-forest dark:text-foreground">{t.category || "General"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{t.description || "—"}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        t.type === "INCOME" ? "text-forest dark:text-mint" : "text-orange"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Transaction Modal with Shadcn DropdownMenu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-2xl border border-sage/40 dark:border-border w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-sage/20 dark:border-border mb-4">
              <h3 className="font-serif font-bold text-lg text-forest dark:text-foreground flex items-center gap-2">
                <Plus className="size-5 text-mint" /> Record Transaction Entry
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Shadcn DropdownMenu for Type */}
              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Transaction Type *
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                    <span>{selectedTypeLabel}</span>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                    {TRANSACTION_TYPES.map((item) => (
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
                  placeholder="e.g. 12000"
                  className="w-full px-4 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Wholesale Rice Sale / Fuel"
                  className="w-full px-4 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Invoice #204 - Suresh Kirana"
                  className="w-full px-4 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
                />
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
                  {submitting ? "Recording..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
