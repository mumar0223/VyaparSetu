import { Shield, Key, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SecurityPage() {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="size-6 text-primary" /> Financial Security & Access Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            End-to-end ledger encryption, database session protection, and immutable audit logs
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">PBKDF2 Cryptographic Security</h3>
              <p className="text-xs text-muted-foreground">
                Micro-enterprise credentials and financial records are protected with 100,000 PBKDF2 iterations and constant-time verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

