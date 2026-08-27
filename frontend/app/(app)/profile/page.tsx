import { getCurrentUser } from "@/lib/auth";
import { User, Mail, Shield, Calendar } from "lucide-react";
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
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-2xl border border-border bg-card">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <User className="size-6 text-primary" /> Enterprise & Entrepreneur Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your micro-business details, trade category, and geographic region
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-border">
            <AvatarImage src={user?.avatar || ""} alt={user?.name} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
              <Mail className="size-3.5" /> Email
            </div>
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
              <Shield className="size-3.5" /> Role
            </div>
            <p className="text-sm font-medium text-foreground">{user?.role || "USER"}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
              <Shield className="size-3.5" /> User ID
            </div>
            <p className="text-xs font-mono font-medium text-foreground truncate">{user?.id}</p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="size-3.5" /> Status
            </div>
            <p className="text-sm font-medium text-success">Active</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

