"use client";

import { motion } from "motion/react";
import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { AuthUser } from "@/lib/auth-types";

type Plan = {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  cta: string;
  href: string;
  highlight?: boolean;
  features: string[];
};

export function Pricing({ currentUser }: { currentUser?: AuthUser | null }) {
  const plans: Plan[] = [
    {
      name: "Grassroots Free",
      tagline: "For individual village artisans & nano-traders.",
      monthly: 0,
      yearly: 0,
      cta: currentUser ? "Go to Dashboard" : "Start Free",
      href: currentUser ? "/dashboard" : "/signup",
      features: [
        "50 voice & chat advisory queries/mo",
        "Daily expense & ledger logging",
        "PM Mudra & PM SVANidhi eligibility check",
        "Central & State schemes directory",
      ],
    },
    {
      name: "Vyapar Pro",
      tagline: "For active shopkeepers & growing merchants.",
      monthly: 199,
      yearly: 159,
      cta: currentUser ? "Upgrade to Pro" : "Get Started with Pro",
      href: currentUser ? "/billing" : "/signup",
      highlight: true,
      features: [
        "Unlimited WhatsApp & voice advisory",
        "Automated balance sheets & P&L generation",
        "Bank-ready credit dossier structuring",
        "Regional Mandi daily price alerts",
        "Hyper-local SWOT feasibility scanner",
      ],
    },
    {
      name: "Samriddhi SHG",
      tagline: "For producer groups, SHGs & cooperatives.",
      monthly: 799,
      yearly: 649,
      cta: currentUser ? "Upgrade to Samriddhi" : "Get Started with Samriddhi",
      href: currentUser ? "/billing" : "/signup",
      features: [
        "Multi-member SHG & cooperative access",
        "Priority NBFC loan syndication",
        "Bulk procurement negotiation guidance",
        "Quarterly financial health audits",
        "Dedicated regional advisory support",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-pale dark:bg-mint/10 border border-mint/30 dark:border-mint/20 text-forest dark:text-mint text-xs font-bold mb-3 shadow-xs">
            <ShieldCheck className="size-3.5" /> Transparent Enterprise Plans
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-forest dark:text-foreground">
            Accessible for Every Micro-Enterprise
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Transparent pricing designed for individual village artisans, local merchants, and expanding SHG cooperatives.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative flex flex-col p-7 rounded-3xl border transition-all ${
                plan.highlight
                  ? "border-mint dark:border-mint/60 bg-white/60 dark:bg-card/60 shadow-xl ring-2 ring-mint/20"
                  : "border-sage/20 dark:border-border bg-white/45 dark:bg-card/45 shadow-xs hover:shadow-md hover:bg-white/70 dark:hover:bg-card/65"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-forest dark:bg-mint text-white dark:text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-serif font-bold mb-1 text-forest dark:text-foreground">
                {plan.name}
              </h3>
              <p className="text-muted-foreground text-xs mb-6 h-8">{plan.tagline}</p>

              <div className="mb-6 pb-6 border-b border-sage/20 dark:border-border">
                <span className="text-4xl font-serif font-bold text-forest dark:text-foreground">
                  ₹{plan.monthly}
                </span>
                <span className="text-muted-foreground text-xs ml-1">/ month</span>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div className="size-4 rounded-full bg-mint-pale dark:bg-mint/20 text-forest dark:text-mint flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-3" />
                    </div>
                    <span className="text-xs text-foreground/90 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-3 rounded-xl font-bold text-xs transition-all active:scale-95 text-center inline-block cursor-pointer shadow-xs ${
                  plan.highlight
                    ? "bg-forest dark:bg-mint hover:bg-forest-deep text-white dark:text-black shadow-md"
                    : "bg-cream dark:bg-muted hover:bg-mint-pale text-forest dark:text-foreground border border-sage/40 dark:border-border"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
