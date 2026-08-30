import { CreditCard, Check, Sparkles } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 font-sans text-ink">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-sage/30 bg-white shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest flex items-center gap-2.5">
            <CreditCard className="size-7 text-mint" /> Advisory Subscription &amp; Quotas
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Manage your micro-enterprise plan, voice advisory quotas, and billing details
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-mint/40 bg-mint-pale/40 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest bg-mint-pale px-2.5 py-0.5 rounded-full">
                Active Plan
              </span>
              <h2 className="text-2xl font-serif font-bold text-forest mt-2">
                Grassroots Enterprise (Free Tier)
              </h2>
            </div>
            <button className="bg-forest hover:bg-forest-deep text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0">
              Upgrade to VyaparSetu Pro
            </button>
          </div>
          <p className="text-xs sm:text-sm text-forest/90 leading-relaxed">
            Unlimited daily expense tracking, basic AI Copilot advisory, and central scheme eligibility checks included.
          </p>
        </div>
      </div>
    </div>
  );
}
