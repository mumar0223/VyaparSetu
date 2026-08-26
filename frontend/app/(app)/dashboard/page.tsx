import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import {
  Activity,
  Workflow,
  User,
  CreditCard,
  Shield,
  Settings,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const quickLinks = [
    { href: "/activity", label: "Advisory & Audit Trail", desc: "Review past advice, queries, and ledger updates", icon: Activity },
    { href: "/architecture", label: "Platform Architecture", desc: "Multilingual NLP, structuring engine & banking gateways", icon: Workflow },
    { href: "/profile", label: "Enterprise Profile", desc: "Manage trade category, business credentials & address", icon: User },
    { href: "/billing", label: "Advisory Plan", desc: "Manage monthly voice quotas, credits & subscription", icon: CreditCard },
    { href: "/security", label: "Financial Security", desc: "Encrypted ledger records, access control & privacy", icon: Shield },
    { href: "/settings", label: "Regional Preferences", desc: "Preferred dialect, local mandi pin code & alerts", icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, <span className="text-primary">{user?.name || "Entrepreneur"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hyper-local market insights, structured financial ledgers, and credit scheme matching
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-xs font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>Advisory Systems Active</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Account Profile", value: user?.role || "ENTREPRENEUR", icon: ShieldCheck, change: "Verified Micro-Enterprise" },
          { label: "Financial Health", value: "Grade A", icon: Activity, change: "Structured Cash Flow" },
          { label: "Credit Schemes", value: "3 Matched", icon: Shield, change: "Mudra, SVANidhi, SHG" },
          { label: "Regional Mandi", value: "Live Sync", icon: CheckCircle2, change: "Price advisory active" },
        ].map((metric, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between gap-3 hover:border-border/80 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <metric.icon className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{metric.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-lg font-bold tracking-tight mb-4 text-foreground">
          Workspace Navigation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="p-5 rounded-2xl border border-border bg-card hover:bg-accent/40 hover:border-primary/40 transition-all duration-200 group flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <link.icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {link.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
