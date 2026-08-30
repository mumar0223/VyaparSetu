"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Building2,
  Sparkles,
  Award,
  Star,
  IndianRupee,
  Target,
  PieChart,
  HandCoins,
  Building,
  CreditCard,
  FileText,
  Bell,
  ShieldCheck,
  Trash2,
  Shield,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth-types";
import { ThemeToggle } from "@/components/theme-toggle";

import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

const I18N_NAV_MAP: Record<string, string> = {
  "/dashboard": "sidebar.dashboard",
  "/scanner": "sidebar.swotScanner",
  "/profile/business": "sidebar.enterpriseProfile",
  "/ai-recommendations": "sidebar.aiRecommendations",
  "/schemes-for-you": "sidebar.govtSchemes",
  "/success-stories": "sidebar.successStories",
  "/expenses": "sidebar.dailyExpenses",
  "/cashflow": "sidebar.cashFlowRunway",
  "/savings": "sidebar.savingsGoals",
  "/budget": "sidebar.budgetPlanning",
  "/debt": "sidebar.debtNavigator",
  "/borrowing": "sidebar.loanSimulator",
  "/credit": "sidebar.businessCredit",
  "/transactions": "sidebar.masterLedger",
};

const NAV_SECTIONS = [
  {
    title: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Grow & Advisory",
    items: [
      { href: "/scanner", label: "SWOT Market Scanner", icon: TrendingUp },
      { href: "/profile/business", label: "Enterprise Profile", icon: Building2 },
      { href: "/ai-recommendations", label: "AI Recommendations", icon: Sparkles },
      { href: "/schemes-for-you", label: "Govt. Schemes", icon: Award },
      { href: "/success-stories", label: "Success Stories", icon: Star },
    ],
  },
  {
    title: "Money & Credit",
    items: [
      { href: "/expenses", label: "Daily Expenses", icon: IndianRupee },
      { href: "/cashflow", label: "Cash Flow Runway", icon: Activity },
      { href: "/savings", label: "Savings Goals", icon: Target },
      { href: "/budget", label: "Budget Planning", icon: PieChart },
      { href: "/debt", label: "Debt Navigator", icon: HandCoins },
      { href: "/borrowing", label: "Loan Simulator", icon: Building },
      { href: "/credit", label: "Business Credit", icon: CreditCard },
      { href: "/transactions", label: "Master Ledger", icon: FileText },
    ],
  },
  {
    title: "Account & Governance",
    items: [
      { href: "/notifications", label: "Alerts & Deadlines", icon: Bell },
      { href: "/privacy-consent", label: "Privacy & DPDP", icon: ShieldCheck },
      { href: "/recycle-bin", label: "Recycle Bin", icon: Trash2 },
      { href: "/billing", label: "Subscription", icon: CreditCard },
      { href: "/security", label: "Security & Access", icon: Shield },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AppSidebarProps {
  currentUser?: AuthUser | null;
  className?: string;
  onClose?: () => void;
}

export function AppSidebar({ currentUser, className, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const userName = currentUser?.name || "Operator";
  const userRole = currentUser?.role || "Enterprise";
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
        "flex w-64 shrink-0 flex-col border-r border-sage/30 bg-white h-full font-sans text-ink select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sage/30 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="size-3.5 bg-mint rounded-full shadow-[0_0_10px_rgba(74,222,128,0.7)] shrink-0" />
          <span className="font-serif font-bold text-lg text-forest tracking-tight truncate">
            {t("common.appName", "VyaparSetu")}
          </span>
        </Link>
        <LanguageSwitcher variant="brand" className="shrink-0" />
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted/70">
              {section.title}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const translatedLabel = I18N_NAV_MAP[item.href]
                  ? t(I18N_NAV_MAP[item.href], item.label)
                  : item.label;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                        active
                          ? "bg-mint-pale text-forest font-bold shadow-xs border border-mint/20"
                          : "text-ink-muted hover:bg-cream hover:text-forest"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-forest" : "text-ink-muted group-hover:text-forest"
                        )}
                      />
                      <span className="truncate">{translatedLabel}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="border-t border-sage/30 p-3 flex items-center justify-between gap-2 shrink-0 bg-white">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex flex-1 items-center gap-2.5 rounded-xl bg-cream/70 p-2 hover:bg-cream transition-colors min-w-0 border border-sage/20"
        >
          <Avatar className="size-8 border border-mint shrink-0">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="text-[10px] font-bold bg-mint-pale text-forest">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-bold text-forest">
              {userName}
            </p>
            <p className="truncate text-[10px] text-ink-muted">
              {userRole}
            </p>
          </div>
        </Link>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          title="Log out"
          className="size-9 rounded-xl flex items-center justify-center text-ink-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}
