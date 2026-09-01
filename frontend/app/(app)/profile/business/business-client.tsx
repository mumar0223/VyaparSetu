"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Save,
  MapPin,
  FileText,
  IndianRupee,
  ShieldCheck,
  ChevronDown,
  Users,
  Target,
  Sparkles,
  Check,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ALL_INDIAN_STATES_DATA, getDistrictGeo } from "@/lib/api/district-data";
import { cn } from "@/lib/utils";

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
  "One Person Company (OPC)",
  "Self Help Group (SHG)",
  "Hindu Undivided Family (HUF)",
];

const POPULAR_CATEGORIES = [
  "General Store / Kirana",
  "Agricultural Trading / Mandi Vendor",
  "Textiles & Garment Retail",
  "FMCG Wholesale Distribution",
  "Hardware, Electrical & Building Material",
  "Food Processing & Dairy Products",
  "Automobile Spare Parts & Workshop",
  "Electronics & Mobile Retail",
  "Catering & Restaurant Services",
  "Manufacturing & Light Engineering",
];

const POPULAR_INDUSTRIES = [
  "Retail & Trade Commerce",
  "Agriculture & Allied Agro-Trade",
  "Food & Beverage Processing",
  "Textiles & Apparel",
  "Logistics, Freight & Transport",
  "Manufacturing & MSME Fabrication",
  "Services, Repair & Maintenance",
  "Healthcare & Pharma Distribution",
];

export function BusinessClient({ initialData }: { initialData: BusinessFormData }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusinessFormData>({
    ...initialData,
    businessType: initialData.businessType || "Sole Proprietorship",
    state: initialData.state || "Maharashtra",
    city: initialData.city || "Pune",
    category: initialData.category || "General Store / Kirana",
    industry: initialData.industry || "Retail & Trade Commerce",
  });

  const [stateSearch, setStateSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

  // Districts for current selected state
  const availableDistricts = useMemo(() => {
    const stateObj = ALL_INDIAN_STATES_DATA.find(
      (s) => s.state.toLowerCase() === form.state.toLowerCase()
    );
    return stateObj ? stateObj.districts : [];
  }, [form.state]);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return ALL_INDIAN_STATES_DATA;
    return ALL_INDIAN_STATES_DATA.filter((s) =>
      s.state.toLowerCase().includes(stateSearch.toLowerCase())
    );
  }, [stateSearch]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return availableDistricts;
    return availableDistricts.filter((d) =>
      d.name.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [availableDistricts, districtSearch]);

  const handleStateChange = (newState: string) => {
    const stateObj = ALL_INDIAN_STATES_DATA.find((s) => s.state === newState);
    const defaultDistrict = stateObj && stateObj.districts.length > 0 ? stateObj.districts[0].name : form.city;
    setForm((prev) => ({
      ...prev,
      state: newState,
      city: defaultDistrict,
    }));
    toast.info(`State updated to ${newState}`);
  };

  const handleDistrictChange = (newDistrict: string) => {
    setForm((prev) => ({ ...prev, city: newDistrict }));
  };

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

      // Invalidate dashboard cache so dashboard immediately reflects profile changes
      if (typeof window !== "undefined") {
        localStorage.removeItem("vyaparsetu_dashboard_analytics_cache");
      }

      toast.success("Enterprise profile saved & synced with AI!");
    } catch {
      toast.error("Error saving business profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto pt-16 sm:pt-16 lg:pt-8 p-4 sm:p-6 lg:p-8 font-sans text-foreground">
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-forest dark:text-mint">
                Enterprise &amp; Compliance Profile
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-mint-pale dark:bg-mint/15 text-forest dark:text-mint border border-mint/30">
                <ShieldCheck className="size-3.5" />
                Live Underwriting Data
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Official enterprise registrations, geospatial location, operating scale &amp; tax compliance.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 px-5 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
          >
            <Save className="size-4" />
            <span>{saving ? "Saving Changes..." : "Save & Sync"}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-12">
          {/* Section 1: Enterprise Identity */}
          <div className="rounded-2xl bg-card border border-border/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="size-8 rounded-xl bg-mint/15 text-forest dark:text-mint flex items-center justify-center">
                <Building2 className="size-4" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-foreground">
                  Enterprise Identity &amp; Constitution
                </h3>
                <p className="text-xs text-muted-foreground">
                  Legal entity name and ownership classification
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Enterprise / Trade Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="e.g. Ramesh Kirana & Provision Store"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm font-semibold text-foreground transition-all outline-none"
                />
              </div>

              {/* Entity Type Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Constitution / Entity Type
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground flex items-center justify-between transition-all outline-none cursor-pointer">
                    <span className="font-semibold truncate">{form.businessType}</span>
                    <ChevronDown className="size-4 text-muted-foreground opacity-70 shrink-0 ml-2" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 max-h-64 overflow-y-auto p-1.5 rounded-xl bg-popover/98 backdrop-blur-md border border-border shadow-xl z-50">
                    <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      Select Legal Entity
                    </DropdownMenuLabel>
                    {BUSINESS_TYPES.map((t) => (
                      <DropdownMenuItem
                        key={t}
                        onClick={() => setForm({ ...form, businessType: t })}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                          form.businessType === t
                            ? "bg-mint/15 text-forest dark:text-mint font-bold"
                            : "hover:bg-muted"
                        )}
                      >
                        <span>{t}</span>
                        {form.businessType === t && <Check className="size-3.5 text-mint" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Industry Sector Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Industry Sector
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground flex items-center justify-between transition-all outline-none cursor-pointer">
                    <span className="truncate">{form.industry}</span>
                    <ChevronDown className="size-4 text-muted-foreground opacity-70 shrink-0 ml-2" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-64 overflow-y-auto p-1.5 rounded-xl bg-popover/98 backdrop-blur-md border border-border shadow-xl z-50">
                    <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      Select Primary Industry
                    </DropdownMenuLabel>
                    {POPULAR_INDUSTRIES.map((ind) => (
                      <DropdownMenuItem
                        key={ind}
                        onClick={() => setForm({ ...form, industry: ind })}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                          form.industry === ind
                            ? "bg-mint/15 text-forest dark:text-mint font-bold"
                            : "hover:bg-muted"
                        )}
                      >
                        <span>{ind}</span>
                        {form.industry === ind && <Check className="size-3.5 text-mint" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Business Category Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Business Category
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground flex items-center justify-between transition-all outline-none cursor-pointer">
                    <span className="truncate">{form.category}</span>
                    <ChevronDown className="size-4 text-muted-foreground opacity-70 shrink-0 ml-2" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-84 max-h-64 overflow-y-auto p-1.5 rounded-xl bg-popover/98 backdrop-blur-md border border-border shadow-xl z-50">
                    <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                      Select Business Trade
                    </DropdownMenuLabel>
                    {POPULAR_CATEGORIES.map((cat) => (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() => setForm({ ...form, category: cat })}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                          form.category === cat
                            ? "bg-mint/15 text-forest dark:text-mint font-bold"
                            : "hover:bg-muted"
                        )}
                      >
                        <span>{cat}</span>
                        {form.category === cat && <Check className="size-3.5 text-mint" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Short Description / Key Offerings
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what your enterprise sells, core suppliers, or specialized services."
                className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground transition-all outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Geospatial & Commercial Address */}
          <div className="rounded-2xl bg-card border border-border/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="size-8 rounded-xl bg-orange/15 text-orange flex items-center justify-center">
                <MapPin className="size-4" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-foreground">
                  Geospatial &amp; Commercial Location
                </h3>
                <p className="text-xs text-muted-foreground">
                  Regional location powers localized APMC Mandi rates, state subsidies, and SWOT catchment data
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              {/* Full Address */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Shop / Unit / Premises Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Plot / Shop No., Main Market Road, Near APMC Market"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground transition-all outline-none"
                />
              </div>

              {/* State Dropdown (Shadcn DropdownMenu with all Indian States) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  State / UT ({ALL_INDIAN_STATES_DATA.length})
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground flex items-center justify-between transition-all outline-none cursor-pointer">
                    <span className="font-semibold truncate">{form.state}</span>
                    <ChevronDown className="size-4 text-muted-foreground opacity-70 shrink-0 ml-2" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 max-h-72 overflow-y-auto p-1.5 rounded-xl bg-popover/98 backdrop-blur-md border border-border shadow-xl z-50">
                    <div className="p-1.5 mb-1 sticky top-0 bg-popover">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/60 rounded-lg text-xs">
                        <Search className="size-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Filter state..."
                          value={stateSearch}
                          onChange={(e) => setStateSearch(e.target.value)}
                          className="bg-transparent outline-none w-full text-foreground text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {filteredStates.map((s) => (
                      <DropdownMenuItem
                        key={s.state}
                        onClick={() => handleStateChange(s.state)}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between transition-colors",
                          form.state === s.state
                            ? "bg-mint/15 text-forest dark:text-mint font-bold"
                            : "hover:bg-muted"
                        )}
                      >
                        <span>{s.state}</span>
                        {form.state === s.state && <Check className="size-3.5 text-mint" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* District / City Dropdown (Shadcn DropdownMenu with all districts of selected state) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  District / City ({availableDistricts.length})
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground flex items-center justify-between transition-all outline-none cursor-pointer">
                    <span className="font-semibold truncate">{form.city}</span>
                    <ChevronDown className="size-4 text-muted-foreground opacity-70 shrink-0 ml-2" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 max-h-72 overflow-y-auto p-1.5 rounded-xl bg-popover/98 backdrop-blur-md border border-border shadow-xl z-50">
                    <div className="p-1.5 mb-1 sticky top-0 bg-popover">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/60 rounded-lg text-xs">
                        <Search className="size-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Filter district..."
                          value={districtSearch}
                          onChange={(e) => setDistrictSearch(e.target.value)}
                          className="bg-transparent outline-none w-full text-foreground text-xs"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    {filteredDistricts.map((d) => (
                      <DropdownMenuItem
                        key={d.name}
                        onClick={() => handleDistrictChange(d.name)}
                        className={cn(
                          "cursor-pointer px-3 py-2 text-xs font-medium rounded-lg flex flex-col items-start transition-colors",
                          form.city === d.name
                            ? "bg-mint/15 text-forest dark:text-mint font-bold"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span>{d.name}</span>
                          {form.city === d.name && <Check className="size-3.5 text-mint" />}
                        </div>
                        {d.odop && (
                          <span className="text-[10px] text-muted-foreground opacity-80 line-clamp-1">
                            ODOP: {d.odop.split("(")[0].trim()}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Pin Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Postal PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="411001"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm font-mono text-foreground transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Regulatory & Registrations */}
          <div className="rounded-2xl bg-card border border-border/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="size-8 rounded-xl bg-mint/15 text-forest dark:text-mint flex items-center justify-center">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-foreground">
                  Registrations &amp; Tax Compliance
                </h3>
                <p className="text-xs text-muted-foreground">
                  Official IDs enable instant matching for MSME loan subsidies (PMEGP, Mudra, CGTMSE)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Udyam Registration Number (MSME)
                </label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                  placeholder="UDYAM-MH-12-0098765"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm font-mono text-foreground transition-all outline-none"
                />
                <p className="text-[10.5px] text-muted-foreground">
                  Found on your official Udyam certificate
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  GSTIN / Trade Tax ID
                </label>
                <input
                  type="text"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value.toUpperCase() })}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm font-mono text-foreground transition-all outline-none"
                />
                <p className="text-[10.5px] text-muted-foreground">
                  15-digit GST identification number (optional for non-GST turnover)
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Operational Scale & Financials */}
          <div className="rounded-2xl bg-card border border-border/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
              <div className="size-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <IndianRupee className="size-4" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-foreground">
                  Financials &amp; Operational Scale
                </h3>
                <p className="text-xs text-muted-foreground">
                  Turnover baseline for business health scoring and cashflow runway projections
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Annual Turnover (₹)
                </label>
                <input
                  type="number"
                  value={form.annualRevenue || ""}
                  onChange={(e) => setForm({ ...form, annualRevenue: Number(e.target.value) })}
                  placeholder="1200000"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm font-mono font-bold text-foreground transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Avg Monthly Revenue (₹)
                </label>
                <input
                  type="number"
                  value={form.monthlyRevenue || ""}
                  onChange={(e) => setForm({ ...form, monthlyRevenue: Number(e.target.value) })}
                  placeholder="100000"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm font-mono font-bold text-foreground transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Avg Monthly Expenses (₹)
                </label>
                <input
                  type="number"
                  value={form.monthlyExpenses || ""}
                  onChange={(e) => setForm({ ...form, monthlyExpenses: Number(e.target.value) })}
                  placeholder="65000"
                  className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm font-mono font-bold text-foreground transition-all outline-none"
                />
              </div>
            </div>

            {/* Growth Goals */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-foreground block">
                Primary Business Expansion Goals
              </label>
              <input
                type="text"
                value={form.businessGoals}
                onChange={(e) => setForm({ ...form, businessGoals: e.target.value })}
                placeholder="e.g. Scale inventory to wholesale distribution and open 2nd retail branch."
                className="w-full px-3.5 py-2.5 bg-muted/25 hover:bg-muted/40 focus:bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 rounded-xl text-sm text-foreground transition-all outline-none"
              />
            </div>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-7 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Save className="size-4" />
              <span>{saving ? "Saving Enterprise Profile..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
