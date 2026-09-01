import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  LayoutDashboard,
  IndianRupee,
  Bot,
  Award,
  FileText,
  ScanEye,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NotFound() {
  const QUICK_LINKS = [
    {
      title: "AI Saathi Workspace",
      desc: "Return to your primary business overview and daily summaries",
      href: "/ai-saathi",
      icon: LayoutDashboard,
    },
    {
      title: "Daily Expenses",
      desc: "Record and review supplier outlays and store operating costs",
      href: "/expenses",
      icon: IndianRupee,
    },
    {
      title: "SWOT Market Scanner",
      desc: "Get hyper-local market feasibility and SWOT insights",
      href: "/scanner",
      icon: ScanEye,
    },
    {
      title: "Government Schemes",
      desc: "Explore verified PMEGP, Mudra, and Vishwakarma subsidies",
      href: "/schemes-for-you",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-cream dark:bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans selection:bg-mint-pale selection:text-forest relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-mint/15 dark:from-mint/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-20 -right-20 size-96 rounded-full bg-forest/5 dark:bg-mint/5 blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto shrink-0 z-10">
        <Link href="/ai-saathi" className="flex items-center gap-2.5">
          <div className="size-3.5 bg-mint rounded-full shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
          <span className="font-serif font-bold text-xl text-forest dark:text-mint tracking-tight">
            VyaparSetu
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main 404 Hero Section */}
      <main className="max-w-3xl w-full mx-auto text-center my-auto py-8 sm:py-12 z-10">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mint-pale dark:bg-mint/10 border border-mint/30 dark:border-mint/20 text-forest dark:text-mint text-xs font-bold mb-6 shadow-xs animate-in fade-in zoom-in-95 duration-500">
          <Compass className="size-4 animate-spin [animation-duration:8s]" />
          <span>Error 404 — Destination Not Found</span>
        </div>

        {/* 404 Giant Typography */}
        <h1 className="text-6xl sm:text-8xl lg:text-9xl font-serif font-black tracking-tight text-forest dark:text-mint mb-3 drop-shadow-xs">
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-foreground mb-3">
          Lost in the Mandi?
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-ink-muted dark:text-muted-foreground max-w-lg mx-auto leading-relaxed mb-8">
          The page or financial record you are searching for might have been
          moved, renamed, or is temporarily unavailable in your active
          workspace.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Link
            href="/ai-saathi"
            className="w-full sm:w-auto px-6 py-3.5 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return to AI Saathi</span>
          </Link>
          <Link
            href="/scanner"
            className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted text-foreground font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ScanEye className="size-4 text-mint" />
            <span>Open SWOT Scanner</span>
          </Link>
        </div>

        {/* Popular Destinations Grid */}
        <div className="text-left border-t border-sage/30 dark:border-border/60 pt-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-4 text-center">
            Suggested Destinations
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="p-4 rounded-2xl bg-white dark:bg-card border border-sage/30 dark:border-border hover:border-mint dark:hover:border-mint transition-all shadow-xs hover:shadow-md flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-mint-pale dark:bg-mint/10 text-forest dark:text-mint group-hover:bg-mint group-hover:text-black transition-colors shrink-0">
                  <link.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-sm text-forest dark:text-foreground group-hover:text-mint transition-colors">
                    {link.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {link.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground shrink-0 max-w-5xl w-full mx-auto pt-6 border-t border-sage/20 dark:border-border/40">
        VyaparSetu — AI Hyper-Local Business Advisory &amp; Financial
        Structuring
      </footer>
    </div>
  );
}
