import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { User, Mail, Shield, Calendar, Building2, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  const avatarInitials = (user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="h-full overflow-y-auto pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 font-sans text-foreground">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-2xl border border-sage/30 dark:border-border bg-white dark:bg-card shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <User className="size-7 text-mint" /> Operator &amp; Account Profile
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Manage your personal operator account and connected enterprise identity
          </p>
        </div>

        {/* Business Link Banner */}
        <div className="bg-mint-pale dark:bg-mint/10 border border-mint/30 dark:border-mint/20 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-mint/20 dark:bg-mint/20 rounded-xl">
              <Building2 className="size-6 text-forest dark:text-mint" />
            </div>
            <div>
              <h3 className="font-bold text-forest dark:text-foreground text-base">Enterprise Profile &amp; GST Details</h3>
              <p className="text-xs text-forest/80 dark:text-muted-foreground">Configure turnover, Udyam registration number, and address.</p>
            </div>
          </div>
          <Link
            href="/profile/business"
            className="bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
          >
            Manage Enterprise <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl border border-sage/30 dark:border-border bg-white dark:bg-card shadow-xs space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-mint">
              <AvatarImage src={user?.avatar || ""} alt={user?.name} />
              <AvatarFallback className="text-lg font-bold bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-serif font-bold text-forest dark:text-foreground">{user?.name}</h2>
              <p className="text-xs text-ink-muted dark:text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-sage/20 dark:border-border">
            <div className="p-4 rounded-xl border border-sage/30 dark:border-border bg-cream/50 dark:bg-muted/40">
              <div className="flex items-center gap-2 text-ink-muted dark:text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                <Mail className="size-3.5 text-forest dark:text-mint" /> Email Address
              </div>
              <p className="text-sm font-bold text-forest dark:text-foreground">{user?.email}</p>
            </div>

            <div className="p-4 rounded-xl border border-sage/30 dark:border-border bg-cream/50 dark:bg-muted/40">
              <div className="flex items-center gap-2 text-ink-muted dark:text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                <Shield className="size-3.5 text-forest dark:text-mint" /> Authorization Role
              </div>
              <p className="text-sm font-bold text-forest dark:text-foreground">{user?.role || "USER"}</p>
            </div>

            <div className="p-4 rounded-xl border border-sage/30 dark:border-border bg-cream/50 dark:bg-muted/40">
              <div className="flex items-center gap-2 text-ink-muted dark:text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                <Shield className="size-3.5 text-forest dark:text-mint" /> User Account ID
              </div>
              <p className="text-xs font-mono font-medium text-ink-muted dark:text-muted-foreground truncate">{user?.id}</p>
            </div>

            <div className="p-4 rounded-xl border border-sage/30 dark:border-border bg-cream/50 dark:bg-muted/40">
              <div className="flex items-center gap-2 text-ink-muted dark:text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
                <Calendar className="size-3.5 text-forest dark:text-mint" /> Status
              </div>
              <p className="text-sm font-bold text-forest dark:text-foreground flex items-center gap-1.5">
                <span className="size-2 bg-mint rounded-full inline-block" /> Active &amp; Verified
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
