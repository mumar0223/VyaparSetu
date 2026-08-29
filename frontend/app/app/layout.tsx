"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  FileText,
  Sparkles,
  Award,
  IndianRupee,
  Activity,
  Target,
  PieChart,
  HandCoins,
  CreditCard,
  Building,
  Trash2,
  ShieldCheck,
  Settings,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Make sure to use the new exact colors from the tokens:
// navy: #0F2B40, cream: #FAF6EB, forest: #1B4332, mint: #4ADE80, sage: #A8E3D1, orange: #D98E2A

const NAV_GROUPS = [
  {
    title: "Pinned",
    items: [{ title: "Home", href: "/app", icon: Home }],
  },
  {
    title: "Grow",
    items: [
      { title: "Business Advisor", href: "/app/advisor", icon: TrendingUp },
      { title: "Business Profile", href: "/app/profile/business", icon: FileText },
      { title: "AI Recommendations", href: "/app/ai-recommendations", icon: Sparkles },
      { title: "Schemes for You", href: "/app/schemes-for-you", icon: Award },
    ],
  },
  {
    title: "Money",
    items: [
      { title: "Expenses", href: "/app/expenses", icon: IndianRupee },
      { title: "Cash Flow", href: "/app/cashflow", icon: Activity },
      { title: "Savings", href: "/app/savings", icon: Target },
      { title: "Budget & Planning", href: "/app/budget", icon: PieChart },
      { title: "Debt", href: "/app/debt", icon: HandCoins },
      { title: "Borrowing", href: "/app/borrowing", icon: Building },
      { title: "Business Credit", href: "/app/credit", icon: CreditCard },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Recycle Bin", href: "/app/recycle-bin", icon: Trash2 },
      { title: "Privacy & Consent", href: "/app/privacy-consent", icon: ShieldCheck },
      { title: "Settings", href: "/app/settings", icon: Settings },
      { title: "Profile", href: "/app/profile", icon: User },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-cream text-ink font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-72 flex-col border-r border-sage/30 bg-white">
        <div className="flex h-20 items-center px-6 border-b border-sage/30 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-4 bg-forest rounded-full" />
            <span className="font-serif font-bold text-2xl text-forest tracking-tight">VyaparSetu</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {group.title !== "Pinned" && (
                <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted/70">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                        isActive
                          ? "bg-mint-pale text-forest border border-mint/20"
                          : "text-ink-muted hover:bg-sage/10 hover:text-forest"
                      )}
                    >
                      <item.icon
                        className={cn("size-5", isActive ? "text-forest" : "text-ink-muted")}
                      />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex h-16 items-center justify-between border-b border-sage/30 bg-white px-4 shrink-0 z-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-3 bg-forest rounded-full" />
            <span className="font-serif font-bold text-xl text-forest tracking-tight">VyaparSetu</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-forest">
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-0 top-16 z-10 bg-white overflow-y-auto pb-24 border-b border-sage/30">
            <nav className="p-4 space-y-6">
              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  {group.title !== "Pinned" && (
                    <h3 className="px-3 mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted/70">
                      {group.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all",
                            isActive
                              ? "bg-mint-pale text-forest border border-mint/20"
                              : "text-ink-muted hover:bg-sage/10 hover:text-forest"
                          )}
                        >
                          <item.icon
                            className={cn("size-5", isActive ? "text-forest" : "text-ink-muted")}
                          />
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-cream p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden flex h-16 items-center justify-between border-t border-sage/30 bg-white px-2 shrink-0 z-20">
          <Link href="/app" className="flex flex-col items-center justify-center w-full h-full gap-1 text-forest">
            <Home className="size-5" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link href="/app/advisor" className="flex flex-col items-center justify-center w-full h-full gap-1 text-ink-muted hover:text-forest">
            <TrendingUp className="size-5" />
            <span className="text-[10px] font-bold">Grow</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center justify-center w-full h-full gap-1 text-ink-muted hover:text-forest">
            <Menu className="size-5" />
            <span className="text-[10px] font-bold">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
