import { CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-2xl border border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CreditCard className="size-6 text-primary" /> Advisory Subscription & Plans
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your micro-enterprise plan, voice advisory quotas, and billing details
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-primary/40 bg-primary/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Current Plan</span>
            <h2 className="text-2xl font-bold text-foreground mt-1">Micro Trader (Free Tier)</h2>
          </div>
          <Button variant="outline" className="font-semibold">Upgrade to Vyapar Pro</Button>
        </div>
        <p className="text-sm text-muted-foreground">
          50 voice and chat advisory queries included monthly with basic ledger tracking.
        </p>
      </div>
    </div>
  );
}
