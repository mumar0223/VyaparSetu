"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
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
      name: "Free",
      tagline: "For individual village artisans & nano-traders.",
      monthly: 0,
      yearly: 0,
      cta: currentUser ? "Go to Dashboard" : "Start Free",
      href: currentUser ? "/dashboard" : "/signup",
      features: [
        "50 voice & chat advisory queries/mo",
        "Basic ledger & sales tracking",
        "PM Mudra & SVANidhi eligibility check",
        "Community advisory support",
      ],
    },
    {
      name: "Vyapar Pro",
      tagline: "For active shopkeepers & growing merchants.",
      monthly: 199,
      yearly: 159,
      cta: currentUser ? "Upgrade to Pro" : "Get Started with Pro",
      href: currentUser ? "/billing" : "/login?callbackUrl=/billing",
      highlight: true,
      features: [
        "Unlimited WhatsApp voice advisory",
        "Automated balance sheets & P&L",
        "Bank-ready credit application structuring",
        "Regional Mandi daily price alerts",
        "Priority advisory support",
      ],
    },
    {
      name: "Samriddhi",
      tagline: "For producer groups, SHGs & cooperatives.",
      monthly: 799,
      yearly: 649,
      cta: currentUser ? "Upgrade to Samriddhi" : "Get Started with Samriddhi",
      href: currentUser ? "/billing" : "/login?callbackUrl=/billing",
      features: [
        "Multi-member SHG & cooperative access",
        "Priority NBFC loan syndication",
        "Bulk purchase & supplier negotiation",
        "Quarterly financial health audits",
        "Dedicated regional advisor",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32 relative bg-[#fdfbf7]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ backgroundColor: { duration: 0 }, borderColor: { duration: 0 }, color: { duration: 0 } }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-[#0f172a]">Accessible for Every Micro-Enterprise</h2>
          <p className="text-[#475569] text-lg md:text-xl">
            Affordable, transparent tiers designed for individual village artisans, local merchants, and expanding cooperatives.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.6, backgroundColor: { duration: 0 }, borderColor: { duration: 0 }, color: { duration: 0 } }}
              className={`relative flex flex-col p-8 rounded-3xl border ${
                plan.highlight
                  ? "border-[#10b981] bg-[#ecfdf5] shadow-2xl shadow-[#10b981]/10"
                  : i === 2
                    ? "border-[#e7e5e4] bg-[#f5f0e6] shadow-sm hover:shadow-md transition-shadow"
                    : "border-[#e7e5e4] bg-white shadow-sm hover:shadow-md transition-shadow"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#10b981] text-white text-xs font-bold uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2 text-[#0f172a]">{plan.name}</h3>
              <p className="text-[#475569] text-sm mb-6 h-10">{plan.tagline}</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-[#0f172a]">₹{plan.monthly}</span>
                <span className="text-[#475569]">/mo</span>
              </div>
              
              <ul className="flex flex-col gap-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="size-5 text-[#10b981] shrink-0" />
                    <span className="text-sm text-[#475569]">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link
                href={plan.href}
                className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 text-center inline-block ${
                  plan.highlight
                    ? "bg-[#10b981] text-white hover:bg-[#059669] shadow-lg shadow-[#10b981]/25"
                    : "bg-[#e7e5e4] text-[#0f172a] hover:bg-[#d6d3d1]"
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
