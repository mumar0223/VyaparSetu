"use client";

import Link from "next/link";
import { Bot, ArrowRight, Award, TrendingUp, ShieldAlert } from "lucide-react";
import type { DashboardAnalyticsData } from "@/lib/hooks/use-dashboard-analytics";

interface AiActionCardsProps {
  data: DashboardAnalyticsData | null;
  loading: boolean;
}

export function AiActionCards({ data, loading }: AiActionCardsProps) {
  const actions = data?.aiActionItems || [
    {
      id: "action-1",
      type: "subsidy",
      badge: "Govt Scheme Match",
      title: "PMEGP 35% Capital Subsidy Pre-Approved",
      desc: "Your enterprise qualifies for up to ₹8.75 Lakh subsidy on store expansion and equipment upgrade under PMEGP Scheme.",
      prompt: "Help me apply for the 35% PMEGP Capital Subsidy and prepare the project profile for bank submission.",
    },
    {
      id: "action-2",
      type: "mandi",
      badge: "APMC Opportunity",
      title: "Nashik Onion Rate Down 2.4% — Stock Up",
      desc: "Lasalgaon Mandi spot rates hit a 3-week seasonal low. Procuring 20 quintals now can save ~₹6,800 in operating margins.",
      prompt: "Show me regional onion mandi price comparisons and give procurement strategy advice.",
    },
    {
      id: "action-3",
      type: "liquidity",
      badge: "Cashflow Optimizer",
      title: "Working Capital Runway is 42 Days (Healthy)",
      desc: "You can comfortably allocate ₹15,000 extra towards high-margin seasonal inventory without hurting liquid buffer.",
      prompt: "How should I allocate my ₹1.5L working capital buffer across high-margin FMCG goods this month?",
    },
  ];

  return (
    <div className="rounded-2xl bg-white/40 dark:bg-card/40 border border-sage/20 dark:border-border p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-forest/10 dark:bg-mint/15 text-forest dark:text-mint flex items-center justify-center">
            <Bot className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold font-sans text-foreground">
              AI Saathi Recommended Actions
            </h3>
            <p className="text-xs text-muted-foreground">
              Personalized intelligence based on your transaction flow & local market data
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-muted/20 animate-pulse"
              >
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
              </div>
            ))
          : actions.map((item) => (
              <Link
                key={item.id}
                href={`/ai-saathi?prompt=${encodeURIComponent(item.prompt)}`}
                className="group rounded-xl border border-sage/20 dark:border-border p-4 bg-white/30 dark:bg-muted/20 hover:bg-white/60 dark:hover:bg-muted/40 hover:border-mint/40 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint-pale dark:bg-mint/15 text-forest dark:text-mint border border-mint/20">
                    {item.badge}
                  </span>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-forest dark:group-hover:text-mint transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between text-xs font-bold text-forest dark:text-mint group-hover:translate-x-0.5 transition-transform">
                  <span>Take Action with AI</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
