"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Building2,
  Bot,
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
import { BrandLogo } from "@/components/brand-icons";

import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

const I18N_NAV_MAP: Record<string, string> = {
  "/ai-saathi": "sidebar.aiSaathi",
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
      { href: "/ai-saathi", label: "AI Saathi", icon: Bot },
    ],
  },
  {
    title: "Grow & Advisory",
    items: [
      { href: "/scanner", label: "SWOT Market Scanner", icon: TrendingUp },
      {
        href: "/profile/business",
        label: "Enterprise Profile",
        icon: Building2,
      },
      { href: "/ai-recommendations", label: "AI Recommendations", icon: Bot },
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

const SECTION_TITLE_MAP: Record<string, string> = {
  Workspace: "sidebar.workspace",
  "Grow & Advisory": "sidebar.growAdvisory",
  "Money & Credit": "sidebar.moneyCredit",
  "Account & Governance": "sidebar.accountGovernance",
};

export function AppSidebar({
  currentUser,
  className,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/ai-saathi") {
      return pathname === "/ai-saathi" || pathname.startsWith("/ai-saathi/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
        "flex w-64 shrink-0 flex-col border-r border-sage/20 dark:border-border bg-white/35 dark:bg-card/35 h-full font-sans text-foreground select-none",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sage/30 dark:border-border shrink-0">
        <Link
          href="/dashboard"
          onClick={() => {
            onClose?.();
          }}
          className="flex items-center min-w-0"
        >
          <BrandLogo iconSize={24} textClassName="text-[15px]" />
        </Link>
        <LanguageSwitcher variant="brand" className="shrink-0" />
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted/70 dark:text-muted-foreground">
              {SECTION_TITLE_MAP[section.title]
                ? t(SECTION_TITLE_MAP[section.title], section.title)
                : section.title}
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
                      onClick={(e) => {
                        onClose?.();
                        if (
                          item.href === "/ai-saathi" &&
                          pathname.startsWith("/ai-saathi")
                        ) {
                          e.preventDefault();
                          window.dispatchEvent(
                            new CustomEvent("reset-ai-saathi"),
                          );
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                        active
                          ? "bg-mint-pale dark:bg-mint/15 text-forest dark:text-mint font-bold shadow-xs border border-mint/20 dark:border-mint/30"
                          : "text-ink-muted dark:text-muted-foreground hover:bg-cream dark:hover:bg-muted hover:text-forest dark:hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          active
                            ? "text-forest dark:text-mint"
                            : "text-ink-muted dark:text-muted-foreground group-hover:text-forest dark:group-hover:text-foreground",
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
      <div className="border-t border-sage/30 dark:border-border p-3 flex items-center justify-between gap-2 shrink-0 bg-transparent">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex flex-1 items-center gap-2.5 rounded-xl bg-cream/70 dark:bg-muted/40 p-2 hover:bg-cream dark:hover:bg-muted transition-colors min-w-0 border border-sage/20 dark:border-border"
        >
          <Avatar className="size-8 border border-mint shrink-0">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="text-[10px] font-bold bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-bold text-forest dark:text-foreground">
              {userName}
            </p>
            <p className="truncate text-[10px] text-ink-muted dark:text-muted-foreground">
              {userRole}
            </p>
          </div>
        </Link>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          title="Log out"
          className="size-9 rounded-xl flex items-center justify-center text-ink-muted dark:text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </aside>
  );
}
