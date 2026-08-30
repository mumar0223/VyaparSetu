"use client";

import { useState } from "react";
import {
  Building2,
  Save,
  MapPin,
  FileText,
  IndianRupee,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface BusinessFormData {
  businessName: string;
  businessType: string;
  industry: string;
  category: string;
  description: string;
  registrationNumber: string;
  taxNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  numberOfEmployees: number;
  annualRevenue: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  businessGoals: string;
}

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership Firm",
  "Limited Liability Partnership (LLP)",
  "Private Limited Company",
  "Self Help Group (SHG)",
];

export function BusinessClient({ initialData }: { initialData: BusinessFormData }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusinessFormData>(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      toast.success("Business profile saved successfully!");
    } catch (err) {
      toast.error("Error saving business profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Building2 className="size-7 text-mint" /> Enterprise &amp; Compliance Profile
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Maintain your official business registration numbers, location, turnover, and operational parameters
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Save className="size-4" /> {saving ? "Saving Changes..." : "Save Profile"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-8">
        {/* Basic Identity Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-forest dark:text-foreground flex items-center gap-2 border-b border-sage/20 dark:border-border pb-3">
            <FileText className="size-4 text-mint" /> Basic Business Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Enterprise Name *
              </label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-semibold text-foreground outline-none focus:border-mint"
              />
            </div>

            {/* Shadcn DropdownMenu for Entity Type */}
            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Constitution / Entity Type
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                  <span>{form.businessType}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                  {BUSINESS_TYPES.map((t) => (
                    <DropdownMenuItem
                      key={t}
                      onClick={() => setForm({ ...form, businessType: t })}
                      className="px-3 py-2 text-xs font-semibold text-foreground hover:bg-cream dark:hover:bg-muted rounded-lg cursor-pointer"
                    >
                      {t}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Business Category
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
              Short Description / Offerings
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint resize-none"
            />
          </div>
        </div>

        {/* Regulatory & Registrations */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-forest dark:text-foreground flex items-center gap-2 border-b border-sage/20 dark:border-border pb-3">
            <ShieldCheck className="size-4 text-mint" /> Registrations &amp; Tax Compliance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Udyam Registration Number
              </label>
              <input
                type="text"
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                placeholder="UDYAM-XX-00-0000000"
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={form.taxNumber}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>
          </div>
        </div>

        {/* Financial & Operational Scale */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-forest dark:text-foreground flex items-center gap-2 border-b border-sage/20 dark:border-border pb-3">
            <IndianRupee className="size-4 text-mint" /> Financials &amp; Operational Scale
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Annual Turnover (₹)
              </label>
              <input
                type="number"
                value={form.annualRevenue}
                onChange={(e) => setForm({ ...form, annualRevenue: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Avg Monthly Revenue (₹)
              </label>
              <input
                type="number"
                value={form.monthlyRevenue}
                onChange={(e) => setForm({ ...form, monthlyRevenue: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Avg Monthly Expenses (₹)
              </label>
              <input
                type="number"
                value={form.monthlyExpenses}
                onChange={(e) => setForm({ ...form, monthlyExpenses: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-mint"
              />
            </div>
          </div>
        </div>

        {/* Location & Address */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-forest dark:text-foreground flex items-center gap-2 border-b border-sage/20 dark:border-border pb-3">
            <MapPin className="size-4 text-orange" /> Commercial Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Shop / Unit Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Plot / Shop No., Main Market Road"
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                State
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Pin Code
              </label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground outline-none focus:border-mint"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
