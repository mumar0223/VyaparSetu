"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Activity,
  Workflow,
  Settings,
  User,
  CreditCard,
  Shield,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth-types";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/architecture", label: "Architecture", icon: Workflow },
];

const secondary = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  currentUser?: AuthUser | null;
  className?: string;
  onClose?: () => void;
}

export function AppSidebar({ currentUser, className, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const userName = currentUser?.name || "Operator";
  const userRole = currentUser?.role || "User";
  const avatarUrl = currentUser?.avatar || "";

  const avatarInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar h-full",
        className
      )}
    >
      <div className="flex h-14 items-center px-4 select-none border-b border-sidebar-border/40">
        <Link href="/dashboard" className="app-font text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/75 dark:from-white dark:to-white/60">
          VyaparSetu
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        <ul className="flex flex-col gap-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </ul>
        <p className="px-2 pb-1 pt-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Manage
        </p>
        <ul className="flex flex-col gap-0.5">
          {secondary.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={onClose}
            />
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3 flex items-center justify-between gap-2">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex flex-1 items-center gap-2 rounded-lg bg-accent/50 p-1.5 hover:bg-accent/80 transition-colors min-w-0"
        >
          <Avatar className="size-8 border border-zinc-800 shrink-0">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="text-[10px] font-semibold bg-zinc-800 text-zinc-200">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-foreground">
              {userName}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {userRole}
            </p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          title="Log out"
          className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </Link>
    </li>
  );
}
