import { CreditCard, Check } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="h-full overflow-y-auto pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 font-sans text-foreground">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-sage/30 dark:border-border bg-white dark:bg-card shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <CreditCard className="size-7 text-mint" /> Advisory Subscription &amp; Quotas
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Manage your micro-enterprise plan, voice advisory quotas, and billing details
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-mint/40 dark:border-mint/30 bg-mint-pale/40 dark:bg-mint/10 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-full">
                Active Plan
              </span>
              <h2 className="text-2xl font-serif font-bold text-forest dark:text-foreground mt-2">
                Grassroots Enterprise (Free Tier)
              </h2>
            </div>
            <button className="bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0">
              Upgrade to VyaparSetu Pro
            </button>
          </div>
          <p className="text-xs sm:text-sm text-forest/90 dark:text-muted-foreground leading-relaxed">
            Unlimited daily expense tracking, basic AI Copilot advisory, and central scheme eligibility checks included.
          </p>
        </div>
      </div>
    </div>
  );
}
