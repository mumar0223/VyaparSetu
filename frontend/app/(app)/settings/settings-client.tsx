"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon,
  Globe,
  DollarSign,
  Moon,
  Sun,
  Laptop,
  Bell,
  Save,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
];

const CURRENCIES = [
  { value: "INR", label: "Indian Rupee (₹ INR - Lakhs / Crores format)" },
  { value: "USD", label: "US Dollar ($ USD)" },
];

export interface SettingsData {
  currency: string;
  language: string;
  theme: string;
  emailAlerts: boolean;
}

export function SettingsClient({ initialSettings }: { initialSettings: SettingsData }) {
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<SettingsData>(initialSettings);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, theme: theme || form.theme }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      toast.success("Settings updated successfully!");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrencyLabel =
    CURRENCIES.find((c) => c.value === form.currency)?.label || form.currency;

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <SettingsIcon className="size-7 text-mint" /> Regional &amp; Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Configure regional dialects, visual themes, currency formatting, and notification channels
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange hover:bg-orange-hover text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Save className="size-4" /> {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl pb-8">
        {/* Visual Appearance Theme Mode */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-forest dark:text-foreground flex items-center gap-2 border-b border-sage/20 dark:border-border pb-3">
            <Sun className="size-4 text-mint" /> Interface Appearance &amp; Theme
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === "light"
                  ? "bg-mint-pale dark:bg-mint/20 border-mint text-forest dark:text-mint shadow-xs"
                  : "bg-cream/50 dark:bg-muted/40 border-sage/30 dark:border-border text-muted-foreground hover:border-mint"
              }`}
            >
              <Sun className="size-5" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === "dark"
                  ? "bg-mint-pale dark:bg-mint/20 border-mint text-forest dark:text-mint shadow-xs"
                  : "bg-cream/50 dark:bg-muted/40 border-sage/30 dark:border-border text-muted-foreground hover:border-mint"
              }`}
            >
              <Moon className="size-5" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`p-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === "system"
                  ? "bg-mint-pale dark:bg-mint/20 border-mint text-forest dark:text-mint shadow-xs"
                  : "bg-cream/50 dark:bg-muted/40 border-sage/30 dark:border-border text-muted-foreground hover:border-mint"
              }`}
            >
              <Laptop className="size-5" />
              <span>System Default</span>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-forest dark:text-foreground flex items-center gap-2 border-b border-sage/20 dark:border-border pb-3">
            <Globe className="size-4 text-mint" /> Preferred Regional Dialect
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                type="button"
                key={lang.code}
                onClick={() => setForm({ ...form, language: lang.code })}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                  form.language === lang.code
                    ? "bg-mint-pale dark:bg-mint/20 border-mint text-forest dark:text-mint shadow-xs"
                    : "bg-cream/50 dark:bg-muted/40 border-sage/30 dark:border-border text-muted-foreground hover:border-mint"
                }`}
              >
                <span className="block text-foreground">{lang.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{lang.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency & Financial Preferences with Shadcn DropdownMenu */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-forest dark:text-foreground flex items-center gap-2 border-b border-sage/20 dark:border-border pb-3">
            <DollarSign className="size-4 text-mint" /> Currency &amp; Notification Alerts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shadcn DropdownMenu for Currency */}
            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Display Currency
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-4 py-2.5 bg-cream dark:bg-muted/40 border border-sage/40 dark:border-border rounded-xl text-sm text-foreground flex items-center justify-between outline-none focus:border-mint cursor-pointer">
                  <span>{selectedCurrencyLabel}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-96 bg-white dark:bg-popover border border-sage/30 dark:border-border p-1 shadow-lg rounded-xl z-50">
                  {CURRENCIES.map((c) => (
                    <DropdownMenuItem
                      key={c.value}
                      onClick={() => setForm({ ...form, currency: c.value })}
                      className="px-3 py-2 text-xs font-semibold text-foreground hover:bg-cream dark:hover:bg-muted rounded-lg cursor-pointer"
                    >
                      {c.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-xs font-bold text-forest dark:text-muted-foreground uppercase tracking-wider block mb-1">
                Notification Alerts
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="alerts"
                  checked={form.emailAlerts}
                  onChange={(e) => setForm({ ...form, emailAlerts: e.target.checked })}
                  className="size-4 accent-forest rounded cursor-pointer"
                />
                <label htmlFor="alerts" className="text-xs font-semibold text-foreground cursor-pointer">
                  Receive SMS / WhatsApp alerts for scheme deadlines
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
