import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-2xl border border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-6 text-primary" /> Regional & Business Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure preferred language dialects, local Mandi pin codes, and advisory alert channels
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <h3 className="font-semibold text-foreground">Regional Preferences</h3>
        <p className="text-xs text-muted-foreground">
          Voice language selection, Mandi rate frequency, and WhatsApp notification parameters.
        </p>
      </div>
    </div>
  );
}
