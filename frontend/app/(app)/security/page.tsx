import { Shield, Key, Lock, CheckCircle2 } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="h-full overflow-y-auto pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 font-sans text-foreground">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-sage/30 dark:border-border bg-white dark:bg-card shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Shield className="size-7 text-mint" /> Financial Security &amp; Access Control
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            End-to-end ledger encryption, database session protection, and immutable audit logs
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-sage/30 dark:border-border bg-white dark:bg-card space-y-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-forest dark:text-foreground">PBKDF2 Cryptographic Security</h3>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1 leading-relaxed">
                Micro-enterprise credentials and financial records are protected with 100,000 PBKDF2 iterations, 16-byte random salts, and constant-time verification against timing attacks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
