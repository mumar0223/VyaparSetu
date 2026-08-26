import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="p-6 rounded-2xl border border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="size-6 text-primary" /> Advisory & Transaction Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review full audit trails of financial structuring, scheme applications, and advisory queries
        </p>
      </div>

      <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center gap-3">
        <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
          <Activity className="size-6" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">No recent advisory logs</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          WhatsApp voice queries, daily sales ledger updates, and scheme qualification results will be recorded here in real-time.
        </p>
      </div>
    </div>
  );
}
