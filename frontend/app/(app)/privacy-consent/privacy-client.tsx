"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export interface ConsentData {
  dataSharing: boolean;
  marketingEmails: boolean;
  termsAccepted: boolean;
}

export function PrivacyConsentClient({ initialConsent }: { initialConsent: ConsentData }) {
  const [consent, setConsent] = useState<ConsentData>(initialConsent);

  const handleToggle = async (key: keyof typeof consent) => {
    const nextVal = !consent[key];
    const updated = { ...consent, [key]: nextVal };
    setConsent(updated);

    try {
      await fetch("/api/privacy-consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      toast.success("Privacy preferences updated successfully");
    } catch (err) {
      toast.error("Failed to update preferences");
    }
  };

  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <ShieldCheck className="size-7 text-mint" /> Privacy &amp; Data Consent Governance
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            DPDP Act 2023 compliant data sharing controls for bank credit and scheme verification
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Compliance Notice */}
        <div className="bg-mint-pale dark:bg-mint/10 border border-mint/30 dark:border-mint/20 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
          <Lock className="size-5 text-forest dark:text-mint shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-forest dark:text-foreground leading-relaxed">
            <span className="font-bold block mb-0.5">Your Enterprise Data is Encrypted &amp; Sovereign</span>
            VyaparSetu never shares raw transaction histories with third parties without your explicit one-time consent. You can revoke all bank read permissions instantly below.
          </div>
        </div>

        {/* Consent Options */}
        <div className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border shadow-xs divide-y divide-sage/20 dark:divide-border/50">
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-forest dark:text-foreground mb-1">
                Account Aggregator &amp; Bank Credit Sharing
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Allow scheduled commercial banks to verify your GST and UPI cash flows for pre-approved Mudra and CGTMSE loans.
              </p>
            </div>
            <button
              onClick={() => handleToggle("dataSharing")}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                consent.dataSharing ? "bg-forest dark:bg-mint" : "bg-sage/40 dark:bg-muted"
              }`}
            >
              <div
                className={`size-4 rounded-full bg-white dark:bg-black transition-transform absolute top-1 ${
                  consent.dataSharing ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-forest dark:text-foreground mb-1">
                Subsidy &amp; Scheme Update Broadcasts
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Receive SMS and WhatsApp notifications when new state subsidies matching your district are published.
              </p>
            </div>
            <button
              onClick={() => handleToggle("marketingEmails")}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                consent.marketingEmails ? "bg-forest dark:bg-mint" : "bg-sage/40 dark:bg-muted"
              }`}
            >
              <div
                className={`size-4 rounded-full bg-white dark:bg-black transition-transform absolute top-1 ${
                  consent.marketingEmails ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-forest dark:text-foreground mb-1">
                Terms of Service &amp; Fair Usage Agreement
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Agreed to digital signature and verified data structuring protocols.
              </p>
            </div>
            <span className="text-xs font-bold text-forest dark:text-mint bg-cream dark:bg-muted px-3 py-1.5 rounded-lg border border-sage/30 dark:border-border">
              Accepted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
