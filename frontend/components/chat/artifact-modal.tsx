"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Check,
  X,
  Plus,
  Trash2,
  Mic,
  AudioLines,
  Target,
  PieChart as PieIcon,
  IndianRupee,
  Calendar,
  Layers,
  Landmark,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  LineChart as LineIcon,
  Activity,
  Download,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ArtifactPayload {
  artifactId?: string;
  targetArtifactId?: string;
  isUpdated?: boolean;
  artifactType:
    | "budget"
    | "expense"
    | "transaction"
    | "saving_goal"
    | "debt"
    | "delete_record"
    | "chart"
    | "form";
  title?: string;
  summary?: string;
  data: any;
}

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: ArtifactPayload | null;
  onCommitSuccess?: (record: any) => void;
  isVoiceMode?: boolean;
  onVoiceHoldStart?: () => void;
  onVoiceHoldEnd?: () => void;
  isUserSpeaking?: boolean;
  isHoldingToSpeak?: boolean;
}

export function ArtifactModal({
  isOpen,
  onClose,
  artifact,
  onCommitSuccess,
  isVoiceMode = false,
  onVoiceHoldStart,
  onVoiceHoldEnd,
  isUserSpeaking = false,
  isHoldingToSpeak = false,
}: ArtifactModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [activeChartType, setActiveChartType] = useState<"bar" | "line" | "area" | "pie">("bar");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (artifact?.data) {
      const cloned = JSON.parse(JSON.stringify(artifact.data));
      if (artifact.artifactType === "form" && cloned.sections) {
        const initialVals: Record<string, any> = cloned.values || {};
        for (const sec of cloned.sections) {
          for (const f of sec.fields || []) {
            if (f.id && initialVals[f.id] === undefined) {
              initialVals[f.id] =
                f.defaultValue !== undefined ? f.defaultValue : "";
            }
          }
        }
        cloned.values = initialVals;
      }
      setFormData(cloned);
      if (artifact.artifactType === "chart" && artifact.data.chartType) {
        setActiveChartType(artifact.data.chartType);
      }
    }
  }, [artifact]);

  if (!artifact) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleDynamicFieldChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      values: {
        ...(prev.values || {}),
        [fieldId]: value,
      },
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const handleAddItem = () => {
    setFormData((prev: any) => ({
      ...prev,
      items: [...(prev.items || []), { category: "New Category", allocatedAmount: 5000 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev: any) => {
      const items = (prev.items || []).filter((_: any, i: number) => i !== index);
      return { ...prev, items };
    });
  };

  const handleApprove = async () => {
    if (artifact.artifactType === "chart") {
      toast.success("Visual chart view saved!");
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/agent/commit-artifact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactType: artifact.artifactType,
          data: formData,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to commit record.");
      }

      toast.success(json.message || "Record successfully committed to database!");
      onCommitSuccess?.(json.record);
      onClose();
    } catch (err: any) {
      console.error("Commit artifact error:", err);
      toast.error(err?.message || "Failed to commit record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAllocatedTotal = () => {
    return (formData.items || []).reduce(
      (sum: number, item: any) => sum + (Number(item.allocatedAmount) || 0),
      0
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 md:p-8 rounded-3xl bg-white dark:bg-card border border-sage/30 dark:border-border text-foreground font-sans shadow-2xl">
        <DialogHeader className="pr-8">
          <div className="flex items-start gap-3 mb-1">
            <span className="p-2.5 rounded-2xl bg-mint-pale dark:bg-mint/15 text-forest dark:text-mint shrink-0 mt-0.5">
              {artifact.artifactType === "budget" && <PieIcon className="size-5" />}
              {artifact.artifactType === "chart" && <BarChart3 className="size-5" />}
              {artifact.artifactType === "expense" && <IndianRupee className="size-5" />}
              {artifact.artifactType === "transaction" && <Layers className="size-5" />}
              {artifact.artifactType === "saving_goal" && <Target className="size-5" />}
              {artifact.artifactType === "debt" && <Landmark className="size-5" />}
              {artifact.artifactType === "form" && <ClipboardList className="size-5" />}
              {artifact.artifactType === "delete_record" && <AlertTriangle className="size-5 text-rose-500" />}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-serif font-bold text-lg sm:text-2xl text-forest dark:text-foreground leading-snug">
                {artifact.title || `Review & Approve ${artifact.artifactType}`}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {artifact.summary || "Review the generated draft below. You can edit any value before approving."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Dynamic Form Based on Artifact Type ── */}
        <div className="space-y-4 py-3">
          {/* 1. BUDGET ARTIFACT FORM */}
          {artifact.artifactType === "budget" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Budget Plan Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden focus:border-mint"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Period Frequency
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full h-9.5 px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground flex items-center justify-between focus:outline-hidden focus:border-mint transition-colors cursor-pointer">
                      <span className="truncate">{formData.period || "Monthly"}</span>
                      <ChevronDown className="size-4 text-muted-foreground shrink-0 opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-(--anchor-width) min-w-[180px] bg-white dark:bg-[#18181b] border border-sage/30 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1"
                    >
                      {["Monthly", "Quarterly", "Annual", "Weekly"].map((opt) => (
                        <DropdownMenuItem
                          key={opt}
                          onClick={() => handleFieldChange("period", opt)}
                          className="cursor-pointer text-xs sm:text-sm rounded-lg px-2.5 py-1.5 focus:bg-cream dark:focus:bg-muted"
                        >
                          {opt}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Total Budget Limit (₹)
                </label>
                <input
                  type="number"
                  value={formData.totalAmount || ""}
                  onChange={(e) => handleFieldChange("totalAmount", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm font-bold text-forest dark:text-mint focus:outline-hidden focus:border-mint"
                />
              </div>

              {/* Category Allocations Sub-List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Category Allocations</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-forest dark:text-mint hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Add Category
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(formData.items || []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-cream/40 dark:bg-muted/30 border border-sage/20 dark:border-border"
                    >
                      <input
                        type="text"
                        value={item.category || ""}
                        onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                        placeholder="Category"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-card border border-sage/30 dark:border-border text-xs text-foreground focus:outline-hidden"
                      />
                      <div className="flex items-center gap-1 w-32">
                        <span className="text-xs text-muted-foreground font-semibold">₹</span>
                        <input
                          type="number"
                          value={item.allocatedAmount || ""}
                          onChange={(e) =>
                            handleItemChange(idx, "allocatedAmount", Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-card border border-sage/30 dark:border-border text-xs font-bold text-foreground focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Allocation Sum Checker */}
                <div className="flex items-center justify-between text-xs px-2 pt-1 text-muted-foreground">
                  <span>Allocated Sum: ₹{calculateAllocatedTotal().toLocaleString("en-IN")}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      calculateAllocatedTotal() > (formData.totalAmount || 0)
                        ? "text-rose-500"
                        : "text-mint font-bold"
                    )}
                  >
                    {calculateAllocatedTotal() > (formData.totalAmount || 0)
                      ? "⚠️ Exceeds total budget limit"
                      : "✓ Fits within budget limit"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. EXPENSE ARTIFACT FORM */}
          {artifact.artifactType === "expense" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Expense Category
                  </label>
                  <input
                    type="text"
                    value={formData.category || ""}
                    onChange={(e) => handleFieldChange("category", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden focus:border-mint"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amount || ""}
                    onChange={(e) => handleFieldChange("amount", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm font-bold text-forest dark:text-mint focus:outline-hidden focus:border-mint"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Vendor / Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.vendor || ""}
                    onChange={(e) => handleFieldChange("vendor", e.target.value)}
                    placeholder="e.g. Mahalakshmi Traders"
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Payment Method
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full h-9.5 px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground flex items-center justify-between focus:outline-hidden transition-colors cursor-pointer">
                      <span className="truncate">{formData.paymentMethod || "UPI"}</span>
                      <ChevronDown className="size-4 text-muted-foreground shrink-0 opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-(--anchor-width) min-w-[180px] bg-white dark:bg-[#18181b] border border-sage/30 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1"
                    >
                      {[
                        { label: "UPI", value: "UPI" },
                        { label: "Cash", value: "CASH" },
                        { label: "Bank Transfer / NEFT", value: "BANK_TRANSFER" },
                        { label: "Cheque", value: "CHEQUE" },
                        { label: "Credit Card", value: "CREDIT_CARD" },
                        { label: "Other", value: "OTHER" },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => handleFieldChange("paymentMethod", item.value)}
                          className="cursor-pointer text-xs sm:text-sm rounded-lg px-2.5 py-1.5 focus:bg-cream dark:focus:bg-muted"
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Description / Notes
                </label>
                <input
                  type="text"
                  value={formData.description || formData.notes || ""}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Optional details"
                  className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* 3. TRANSACTION ARTIFACT FORM */}
          {artifact.artifactType === "transaction" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Transaction Type
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full h-9.5 px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground flex items-center justify-between focus:outline-hidden transition-colors cursor-pointer">
                      <span className="truncate">
                        {formData.type === "INCOME"
                          ? "Income / Revenue"
                          : formData.type === "TRANSFER"
                          ? "Transfer"
                          : formData.type === "DEBT_PAYMENT"
                          ? "Debt Payment"
                          : formData.type === "OTHER"
                          ? "Other"
                          : "Expense"}
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground shrink-0 opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-(--anchor-width) min-w-[180px] bg-white dark:bg-[#18181b] border border-sage/30 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1"
                    >
                      {[
                        { label: "Income / Revenue", value: "INCOME" },
                        { label: "Expense", value: "EXPENSE" },
                        { label: "Transfer", value: "TRANSFER" },
                        { label: "Debt Payment", value: "DEBT_PAYMENT" },
                        { label: "Other", value: "OTHER" },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => handleFieldChange("type", item.value)}
                          className="cursor-pointer text-xs sm:text-sm rounded-lg px-2.5 py-1.5 focus:bg-cream dark:focus:bg-muted"
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amount || ""}
                    onChange={(e) => handleFieldChange("amount", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm font-bold text-forest dark:text-mint focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Category &amp; Description
                </label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="e.g. Daily mandi grain sales receipt"
                  className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* 4. SAVINGS GOAL ARTIFACT FORM */}
          {artifact.artifactType === "saving_goal" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="e.g. Cold Storage Equipment"
                  className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.targetAmount || ""}
                    onChange={(e) => handleFieldChange("targetAmount", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm font-bold text-forest dark:text-mint focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate || ""}
                    onChange={(e) => handleFieldChange("targetDate", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. DEBT ARTIFACT FORM */}
          {artifact.artifactType === "debt" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Lender Bank / Name
                  </label>
                  <input
                    type="text"
                    value={formData.lender || ""}
                    onChange={(e) => handleFieldChange("lender", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Loan Type
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="w-full h-9.5 px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground flex items-center justify-between focus:outline-hidden transition-colors cursor-pointer">
                      <span className="truncate">
                        {formData.type === "TERM_LOAN"
                          ? "Term Loan"
                          : formData.type === "EQUIPMENT_FINANCING"
                          ? "Equipment Financing"
                          : formData.type === "CREDIT_CARD"
                          ? "Credit Card"
                          : formData.type === "OTHER"
                          ? "Other"
                          : "Working Capital"}
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground shrink-0 opacity-70" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-(--anchor-width) min-w-[180px] bg-white dark:bg-[#18181b] border border-sage/30 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1"
                    >
                      {[
                        { label: "Working Capital", value: "WORKING_CAPITAL" },
                        { label: "Term Loan", value: "TERM_LOAN" },
                        { label: "Equipment Financing", value: "EQUIPMENT_FINANCING" },
                        { label: "Credit Card", value: "CREDIT_CARD" },
                        { label: "Other", value: "OTHER" },
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => handleFieldChange("type", item.value)}
                          className="cursor-pointer text-xs sm:text-sm rounded-lg px-2.5 py-1.5 focus:bg-cream dark:focus:bg-muted"
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.totalAmount || ""}
                    onChange={(e) => handleFieldChange("totalAmount", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Outstanding (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amountOutStanding || ""}
                    onChange={(e) => handleFieldChange("amountOutStanding", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm font-bold text-forest dark:text-mint focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Monthly EMI (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.emiAmount || ""}
                    onChange={(e) => handleFieldChange("emiAmount", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-cream/60 dark:bg-muted/40 border border-sage/30 dark:border-border text-sm text-foreground focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. DYNAMIC MULTI-SECTION MULTI-FIELD FORM ARTIFACT */}
          {artifact.artifactType === "form" && (
            <div className="space-y-5">
              {formData.description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed -mt-1">
                  {formData.description}
                </p>
              )}

              {(formData.sections || []).map((section: any, sIdx: number) => (
                <div
                  key={sIdx}
                  className="p-4 sm:p-5 rounded-2xl bg-cream/35 dark:bg-muted/15 border border-sage/30 dark:border-border/60 space-y-3.5 shadow-2xs"
                >
                  {section.title && (
                    <div className="border-b border-sage/20 dark:border-border/40 pb-2">
                      <h3 className="font-serif font-bold text-sm sm:text-base text-forest dark:text-mint">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {section.description}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(section.fields || []).map((field: any) => {
                      const fieldVal =
                        formData.values?.[field.id] !== undefined
                          ? formData.values[field.id]
                          : (field.defaultValue !== undefined ? field.defaultValue : "");
                      const isFullWidth =
                        field.type === "textarea" ||
                        field.id?.toLowerCase().includes("address") ||
                        field.id?.toLowerCase().includes("notes") ||
                        field.id?.toLowerCase().includes("purpose") ||
                        field.id?.toLowerCase().includes("description");

                      return (
                        <div
                          key={field.id}
                          className={cn(
                            "space-y-1.5",
                            isFullWidth ? "sm:col-span-2" : "col-span-1"
                          )}
                        >
                          <label className="text-xs font-semibold text-foreground/90 block">
                            {field.label || field.id}
                            {field.required && (
                              <span className="text-rose-500 ml-1 font-bold">*</span>
                            )}
                          </label>

                          {field.type === "select" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="w-full h-9.5 px-3 py-2 rounded-xl bg-white dark:bg-card border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground flex items-center justify-between focus:outline-hidden focus:border-mint transition-colors cursor-pointer">
                                <span className="truncate">
                                  {fieldVal || field.placeholder || "Select option"}
                                </span>
                                <ChevronDown className="size-4 text-muted-foreground shrink-0 opacity-70" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-(--anchor-width) min-w-[180px] bg-white dark:bg-[#18181b] border border-sage/30 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1"
                              >
                                {(field.options || []).map((opt: string) => (
                                  <DropdownMenuItem
                                    key={opt}
                                    onClick={() =>
                                      handleDynamicFieldChange(field.id, opt)
                                    }
                                    className="cursor-pointer text-xs sm:text-sm rounded-lg px-2.5 py-1.5 focus:bg-cream dark:focus:bg-muted"
                                  >
                                    {opt}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : field.type === "textarea" ? (
                            <textarea
                              rows={3}
                              value={fieldVal || ""}
                              onChange={(e) =>
                                handleDynamicFieldChange(field.id, e.target.value)
                              }
                              placeholder={field.placeholder || ""}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-card border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-mint resize-y"
                            />
                          ) : field.type === "checkbox" ? (
                            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-card border border-sage/30 dark:border-border cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(fieldVal)}
                                onChange={(e) =>
                                  handleDynamicFieldChange(field.id, e.target.checked)
                                }
                                className="size-4 rounded-md accent-forest dark:accent-mint cursor-pointer"
                              />
                              <span className="text-xs sm:text-sm text-foreground">
                                {field.placeholder || field.label}
                              </span>
                            </label>
                          ) : field.type === "date" ? (
                            <input
                              type="date"
                              value={fieldVal || ""}
                              onChange={(e) =>
                                handleDynamicFieldChange(field.id, e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-card border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-mint"
                            />
                          ) : field.type === "number" ? (
                            <input
                              type="number"
                              value={fieldVal}
                              onChange={(e) =>
                                handleDynamicFieldChange(
                                  field.id,
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                              placeholder={field.placeholder || "0"}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-card border border-sage/30 dark:border-border text-xs sm:text-sm font-semibold text-foreground focus:outline-hidden focus:border-mint"
                            />
                          ) : (
                            <input
                              type="text"
                              value={fieldVal || ""}
                              onChange={(e) =>
                                handleDynamicFieldChange(field.id, e.target.value)
                              }
                              placeholder={field.placeholder || ""}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-card border border-sage/30 dark:border-border text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-mint"
                            />
                          )}

                          {field.helpText && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {field.helpText}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. DELETE RECORD CONFIRMATION */}
          {artifact.artifactType === "delete_record" && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                Are you sure you want to permanently delete this {formData.entityType}?
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {formData.entityName} (ID: {formData.entityId})
              </p>
            </div>
          )}

          {/* 7. INTERACTIVE VISUAL CHART ARTIFACT */}
          {artifact.artifactType === "chart" && (
            <div className="space-y-4">
              {/* Chart Type Selector Bar */}
              <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-cream/70 dark:bg-muted/40 border border-sage/30 dark:border-border">
                <span className="text-xs font-semibold text-muted-foreground px-2">Visualization Type:</span>
                <div className="flex items-center gap-1">
                  {[
                    { type: "bar" as const, label: "Bar", icon: BarChart3 },
                    { type: "line" as const, label: "Line", icon: LineIcon },
                    { type: "area" as const, label: "Area", icon: Activity },
                    { type: "pie" as const, label: "Pie", icon: PieIcon },
                  ].map((tab) => (
                    <button
                      key={tab.type}
                      type="button"
                      onClick={() => setActiveChartType(tab.type)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        activeChartType === tab.type
                          ? "bg-forest dark:bg-mint text-white dark:text-black shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-card"
                      )}
                    >
                      <tab.icon className="size-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recharts Container */}
              <div className="h-[340px] sm:h-[400px] md:h-[440px] w-full p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#18181b]/90 border border-sage/30 dark:border-border">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartType === "bar" ? (
                    <BarChart data={formData.data || []} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey={formData.xAxisKey || "name"} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(18, 19, 22, 0.95)",
                          borderRadius: "12px",
                          border: "1px solid rgba(74, 222, 128, 0.2)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      {(formData.series || [{ dataKey: "value", color: "#4ADE80" }]).map((s: any, idx: number) => (
                        <Bar
                          key={s.dataKey || idx}
                          dataKey={s.dataKey}
                          name={s.name || s.dataKey}
                          fill={s.color || "#4ADE80"}
                          radius={[6, 6, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  ) : activeChartType === "line" ? (
                    <LineChart data={formData.data || []} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey={formData.xAxisKey || "name"} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(18, 19, 22, 0.95)",
                          borderRadius: "12px",
                          border: "1px solid rgba(74, 222, 128, 0.2)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      {(formData.series || [{ dataKey: "value", color: "#4ADE80" }]).map((s: any, idx: number) => (
                        <Line
                          key={s.dataKey || idx}
                          type="monotone"
                          dataKey={s.dataKey}
                          name={s.name || s.dataKey}
                          stroke={s.color || "#4ADE80"}
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  ) : activeChartType === "area" ? (
                    <AreaChart data={formData.data || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey={formData.xAxisKey || "name"} tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(18, 19, 22, 0.95)",
                          borderRadius: "12px",
                          border: "1px solid rgba(74, 222, 128, 0.2)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      {(formData.series || [{ dataKey: "value", color: "#4ADE80" }]).map((s: any, idx: number) => (
                        <Area
                          key={s.dataKey || idx}
                          type="monotone"
                          dataKey={s.dataKey}
                          name={s.name || s.dataKey}
                          stroke={s.color || "#4ADE80"}
                          fill={s.color || "#4ADE80"}
                          fillOpacity={0.2}
                        />
                      ))}
                    </AreaChart>
                  ) : (
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(18, 19, 22, 0.95)",
                          borderRadius: "12px",
                          border: "1px solid rgba(74, 222, 128, 0.2)",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Pie
                        data={formData.data || []}
                        dataKey={(formData.series && formData.series[0]?.dataKey) || "value"}
                        nameKey={formData.xAxisKey || "name"}
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        label={({ name, percent }: any) => `${name || ""} ${(((percent || 0) as number) * 100).toFixed(0)}%`}
                      >
                        {(formData.data || []).map((_: any, index: number) => {
                          const colors = ["#4ADE80", "#1B4332", "#D98E2A", "#EAB308", "#10B981", "#3B82F6", "#8B5CF6"];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Data points table preview */}
              {Array.isArray(formData.data) && formData.data.length > 0 && (
                <div className="rounded-2xl border border-sage/30 dark:border-border overflow-hidden">
                  <div className="px-3.5 py-2 bg-cream/70 dark:bg-muted/40 text-xs font-bold text-forest dark:text-mint flex items-center justify-between">
                    <span>Dataset Points ({formData.data.length})</span>
                    <span className="text-[11px] text-muted-foreground font-normal">X-Axis: {formData.xAxisKey || "name"}</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-sage/20 dark:divide-border/40">
                    {formData.data.map((row: any, rIdx: number) => (
                      <div key={rIdx} className="px-3.5 py-1.5 text-xs flex items-center justify-between text-muted-foreground">
                        <span className="font-semibold text-foreground">{row[formData.xAxisKey || "name"] || `Point ${rIdx + 1}`}</span>
                        <div className="flex items-center gap-3 font-mono">
                          {(formData.series || []).map((s: any, sIdx: number) => (
                            <span key={sIdx} className="text-forest dark:text-mint">
                              {s.name || s.dataKey}: {row[s.dataKey]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom Voice Interaction Bar (Only if Voice Agent Mode is active) ── */}
        {isVoiceMode && (
          <div className="p-3 rounded-2xl bg-mint-pale/50 dark:bg-mint/10 border border-mint/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AudioLines className="size-4 text-mint animate-pulse" />
              <span className="text-xs text-forest dark:text-mint font-semibold">
                Voice Feedback Active: Speak modifications or approve
              </span>
            </div>
            <button
              type="button"
              onMouseDown={onVoiceHoldStart}
              onMouseUp={onVoiceHoldEnd}
              onTouchStart={onVoiceHoldStart}
              onTouchEnd={onVoiceHoldEnd}
              className={cn(
                "px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer select-none",
                isHoldingToSpeak
                  ? "bg-mint text-black shadow-md scale-105"
                  : "bg-forest dark:bg-mint text-white dark:text-black hover:opacity-90"
              )}
            >
              <Mic className="size-3.5" />
              <span>{isHoldingToSpeak ? "Listening..." : "Hold to Speak"}</span>
            </button>
          </div>
        )}

        {/* ── Dialog Action Footer ── */}
        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
          >
            {artifact.artifactType === "chart" ? "Close" : "Discard"}
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md",
              artifact.artifactType === "delete_record"
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black"
            )}
          >
            <Check className="size-4 stroke-[2.5]" />
            <span>
              {artifact.artifactType === "chart"
                ? "Done"
                : isSubmitting
                  ? "Saving..."
                  : formData.submitLabel || "Approve & Save"}
            </span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
