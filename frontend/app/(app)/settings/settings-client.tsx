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
  Fingerprint,
  Trash2,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { startRegistration } from "@simplewebauthn/browser";
import { useEffect } from "react";
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
  const [passkeys, setPasskeys] = useState<
    Array<{ id: string; deviceName: string; createdAt: string; lastUsedAt?: string }>
  >([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(false);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  const [form, setForm] = useState<SettingsData>(initialSettings);

  const fetchPasskeys = async () => {
    try {
      setLoadingPasskeys(true);
      const res = await fetch("/api/auth/passkey");
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data.passkeys || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPasskeys(false);
    }
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    // Hardware sensor availability check
    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      toast.error("Fingerprint sensor not found on this device.");
      return;
    }

    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        toast.error("Fingerprint sensor not found on this device.");
        return;
      }
    } catch {
      toast.error("Fingerprint sensor not found on this device.");
      return;
    }

    setRegisteringPasskey(true);
    try {
      const optionsRes = await fetch("/api/auth/passkey/register-options", { method: "POST" });
      if (!optionsRes.ok) throw new Error("Failed to initialize registration");
      const options = await optionsRes.json();

      const regResp = await startRegistration({ optionsJSON: options });
      const verifyRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResp),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || "Failed to register fingerprint");
      }

      toast.success("Fingerprint registered successfully!");
      fetchPasskeys();
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Registration cancelled";
      if (e?.name === "NotAllowedError" || msg.includes("cancelled") || msg.includes("timed out")) {
        console.log("[passkey] cancelled");
      } else {
        toast.error(msg);
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      const res = await fetch(`/api/auth/passkey?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Fingerprint removed");
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error("Failed to remove fingerprint");
      }
    } catch {
      toast.error("Failed to remove fingerprint");
    }
  };

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
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
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

        {/* Biometric & Fingerprint Security Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-mint-pale dark:bg-mint/15 text-forest dark:text-mint flex items-center justify-center shrink-0">
                <Fingerprint className="size-5 text-mint" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-forest dark:text-foreground">
                  Fingerprint &amp; Biometric Login
                </h3>
                <p className="text-xs text-ink-muted dark:text-muted-foreground mt-0.5">
                  Sign in with 1 tap using your device&apos;s biometric sensor without typing passwords.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddPasskey}
              disabled={registeringPasskey}
              className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70 shrink-0 self-start sm:self-auto"
            >
              {registeringPasskey ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-mint" /> Registering...
                </>
              ) : (
                <>
                  <Fingerprint className="size-3.5 text-mint" /> Add Fingerprint
                </>
              )}
            </button>
          </div>

          <div className="border-t border-sage/20 dark:border-border/60 pt-3">
            {loadingPasskeys ? (
              <p className="text-xs text-ink-muted dark:text-muted-foreground italic py-1">
                Loading registered credentials...
              </p>
            ) : passkeys.length === 0 ? (
              <p className="text-xs text-ink-muted dark:text-muted-foreground italic py-1">
                No fingerprint devices registered yet. Click &quot;Add Fingerprint&quot; to enable 1-tap sign-in on this device.
              </p>
            ) : (
              <div className="space-y-2">
                {passkeys.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-cream/60 dark:bg-muted/30 border border-sage/30 dark:border-border/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="size-4 text-mint" />
                      <div>
                        <p className="text-xs font-semibold text-forest dark:text-foreground">
                          {p.deviceName || "Biometric Device"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Added {new Date(p.createdAt).toLocaleDateString()}
                          {p.lastUsedAt && ` • Last used ${new Date(p.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePasskey(p.id)}
                      className="p-1.5 rounded-lg text-ink-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove passkey"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
