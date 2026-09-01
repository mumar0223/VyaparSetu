"use client";

import { useState } from "react";
import {
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export interface TrashedExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string | Date;
  vendor?: string | null;
  deletedAt: string | Date;
}

export function RecycleBinClient({ initialItems }: { initialItems: TrashedExpenseItem[] }) {
  const [trashedItems, setTrashedItems] = useState<TrashedExpenseItem[]>(initialItems);

  const handleAction = async (id: string, action: "restore" | "purge") => {
    try {
      const res = await fetch("/api/recycle-bin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (res.ok) {
        toast.success(action === "restore" ? "Item restored to active records!" : "Item permanently deleted");
        setTrashedItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Trash2 className="size-7 text-mint" /> Recycle Bin &amp; Data Recovery
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Restore deleted expense records or purge them permanently from your business ledger
          </p>
        </div>
      </div>

      {/* Trashed Items List */}
      <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border shadow-xs divide-y divide-sage/20 dark:divide-border/50 flex-1 overflow-hidden">
        {trashedItems.length === 0 ? (
          <div className="p-12 text-center">
            <Trash2 className="size-10 text-sage dark:text-muted-foreground mx-auto mb-2" />
            <h4 className="font-bold text-foreground text-base">Recycle Bin is Empty</h4>
            <p className="text-xs text-muted-foreground mt-1">Deleted expenses will appear here for safe 30-day recovery.</p>
          </div>
        ) : (
          trashedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cream/20 dark:hover:bg-muted/20 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-forest dark:text-foreground text-sm sm:text-base">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-destructive">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vendor: {item.vendor || "General"} • Deleted: {new Date(item.deletedAt).toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(item.id, "restore")}
                  className="px-3.5 py-2 bg-cream dark:bg-muted hover:bg-mint-pale dark:hover:bg-mint/20 text-forest dark:text-foreground font-bold text-xs rounded-xl border border-sage/40 dark:border-border transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="size-3.5" /> Restore
                </button>
                <button
                  onClick={() => handleAction(item.id, "purge")}
                  className="px-3.5 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Purge Permanently
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
