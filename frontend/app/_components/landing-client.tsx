"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Navbar } from "./navbar";
import { HowItWorks } from "./how-it-works";
import { Technologies } from "./technologies";
import { Pricing } from "./pricing";
import { AppBackground } from "@/components/app-background";
import { BrandLogo } from "@/components/brand-icons";
import {
  Code2,
  Network,
  ShieldCheck,
  ArrowRight,
  IndianRupee,
  Bot,
  Award,
  Globe2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { AuthUser } from "@/lib/auth-types";

interface LandingClientProps {
  currentUser?: AuthUser | null;
}

export function LandingClient({ currentUser }: LandingClientProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  const STATS = [
    { label: "Subsidies Mapped", value: "₹50Cr+" },
    { label: "Indian Dialects", value: "8 Languages" },
    { label: "Mudra Pre-Approved", value: "100% Digital" },
    { label: "Ledger Security", value: "PBKDF2 Salted" },
  ];

  return (
    <main className="relative bg-transparent text-foreground selection:bg-mint-pale selection:text-forest min-h-screen font-sans overflow-x-clip max-w-full">
      {/* Universal Fixed Animated Honeycomb Grid Background */}
      <AppBackground />

      <Navbar currentUser={currentUser} />

      {/* Hero Section */}
      <div ref={heroRef} className="min-h-[110vh] lg:h-[125vh] relative overflow-x-clip max-w-full">
        <div className="sticky top-0 h-svh w-full overflow-hidden flex flex-col items-center pt-20 md:pt-28 pb-4">
          <motion.section
            style={{ y, opacity, scale }}
            className="w-full flex-1 flex flex-col items-center justify-center min-h-0 relative"
          >
            {/* Ambient Radial Lighting */}
            <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-mint/15 dark:bg-mint/5 rounded-full blur-[140px] -z-10 pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 translate-x-1/2 translate-y-1/2 w-80 sm:w-[400px] h-80 sm:h-[400px] bg-orange/10 dark:bg-orange/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

            {/* Hero Content Grid (Left: Copy & Actions, Right: Hero Image) */}
            <div className="container lg:px-12 mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 flex-1 min-h-0 pb-6 md:pb-10 w-full h-full relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex flex-col gap-4 sm:gap-6 max-w-xl lg:max-w-2xl z-10"
              >
                <h1 className="text-3xl sm:text-5xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-[1.12] text-forest dark:text-foreground">
                  Grow your local business.{" "}
                  <span className="text-orange dark:text-orange block mt-1">
                    In your own language.
                  </span>
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-ink-muted dark:text-muted-foreground leading-relaxed max-w-xl">
                  Empowering rural shopkeepers, artisans, and micro-enterprises
                  with AI pricing advisory, automated ledger structuring, and
                  direct government scheme access — seamlessly via WhatsApp and
                  voice.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {currentUser ? (
                    <Link
                      href="/dashboard"
                      className="px-6 py-3.5 bg-forest dark:bg-mint hover:bg-forest-deep dark:hover:bg-mint-light text-white dark:text-black font-bold rounded-xl shadow-lg transition-all active:scale-95 text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/signup"
                        className="px-6 py-3.5 bg-orange hover:bg-orange-hover text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span>Start Free Advisory</span>
                        <ArrowRight className="size-4" />
                      </Link>
                      <Link
                        href="/schemes-for-you"
                        className="px-5 py-3.5 bg-white dark:bg-card border border-sage/40 dark:border-border hover:bg-cream dark:hover:bg-muted text-forest dark:text-foreground font-bold rounded-xl transition-all shadow-xs text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="size-4 text-mint" />
                        <span>Explore Govt Subsidies</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Trust Points */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-sage/20 dark:border-border max-w-xl">
                  {STATS.map((s, idx) => (
                    <div key={idx} className="leading-tight">
                      <span className="text-xs sm:text-sm font-serif font-bold text-forest dark:text-mint block">
                        {s.value}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right Hero Image (Replacing Connection Diagram) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, x: 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                className="w-full max-w-md sm:max-w-lg lg:max-w-lg xl:max-w-xl shrink-0"
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfmb1_ip4DJn-j_j1v4joG2lRxbO0IYe8NSH5FOlEjSm5nsVbWkGDcM5RfbbteCe-Wb6yOU_Hnm3vOXEzsN9fNj_JZHyOAqIY5XrJfjTsbwKY2Eww1zLxnn_rodicxtpoOK5YL9aIlwpj_1x1PS_rD4fcHuD1neaw95-4VDpNpKPh0ppCFR5zV0V1WfxYfdYJOdljY2HBoZaiLHghhBuZsEU3r46wq5hb8iuQL-HbN_LsdTgikHScDgw"
                  alt="VyaparSetu Kirana Store"
                  className="w-full h-auto object-cover rounded-2xl md:rounded-3xl shadow-2xl border border-sage/30 dark:border-border"
                />
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="bg-cream/40 dark:bg-background/40 relative z-10 w-full rounded-t-[2.5rem] md:rounded-t-[3.5rem] border-t border-sage/20 dark:border-border shadow-2xl">
        {/* Core Bottleneck Section */}
        <section className="py-20 md:py-28 bg-white/30 dark:bg-card/20 border-b border-sage/20 dark:border-border rounded-t-[2.5rem] md:rounded-t-[3.5rem]">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <span className="text-xs font-bold text-forest dark:text-mint uppercase tracking-wider block mb-2">
                Grassroots Challenges Solved
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4 tracking-tight text-forest dark:text-foreground">
                Built for the Realities of Local Commerce
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Micro-enterprises power 45% of national manufacturing and
                employment, yet face severe hurdles in credit formality, pricing
                discovery, and scheme awareness.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Code2,
                  title: "Zero Complex Paperwork",
                  desc: "Securing working capital shouldn't require confusing bank visits or third-party brokers. VyaparSetu structures informal receipts into bankable statements matching PM Mudra requirements.",
                },
                {
                  icon: Network,
                  title: "Actionable Mandi Intelligence",
                  desc: "Traders often lack real-time regional commodity trends and distributor pricing power. Receive actionable price guidance tailored directly to your local district.",
                },
                {
                  icon: ShieldCheck,
                  title: "Voice & Regional Dialects",
                  desc: "No steep technical hurdles. Speak or message naturally in 8 Indian regional dialects through WhatsApp and simplified dashboards without needing complex accounting tools.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="p-7 rounded-3xl border border-sage/20 dark:border-border bg-white/45 dark:bg-card/45 hover:bg-white/70 dark:hover:bg-card/65 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="size-12 rounded-2xl bg-mint-pale dark:bg-mint/10 text-forest dark:text-mint border border-mint/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-mint group-hover:text-black transition-all duration-300">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="font-serif font-bold text-lg mb-2 text-forest dark:text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works, Tech & Pricing */}
        <HowItWorks />
        <Technologies />
        <Pricing currentUser={currentUser} />

        {/* Footer */}
        <footer className="border-t border-sage/20 dark:border-border py-10 bg-white/40 dark:bg-zinc-950/40 text-center text-xs text-muted-foreground">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <BrandLogo iconSize={24} textClassName="text-sm" />
            <p>
              © {new Date().getFullYear()} VyaparSetu. DPDP Act 2023 Compliant
              &amp; Encrypted.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium">
              <Link
                href="/privacy-consent"
                className="hover:text-forest dark:hover:text-mint"
              >
                Privacy Consent
              </Link>
              <Link
                href="/schemes-for-you"
                className="hover:text-forest dark:hover:text-mint"
              >
                Govt Schemes
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
