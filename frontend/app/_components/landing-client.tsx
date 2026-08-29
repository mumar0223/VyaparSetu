"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { ConnectionDiagram } from "./connection-diagram";
import { Navbar } from "./navbar";
import { HowItWorks } from "./how-it-works";
import { Technologies } from "./technologies";
import { Pricing } from "./pricing";
import { TargetAudience } from "./target-audience";
import { Code2, Network, ShieldCheck } from "lucide-react";
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

  const [windowWidth, setWindowWidth] = useState(1440);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const HERO_SCALE_CONSTANT = 0.0006;
  const calculatedHeroScale = Math.min(
    1.2,
    Math.max(0.45, windowWidth * HERO_SCALE_CONSTANT),
  );
  const calculatedHeroLeft = Math.min(
    76,
    Math.max(68, 68 + ((windowWidth - 1024) * 8) / (1920 - 1024)),
  );

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <main className="bg-[linear-gradient(180deg,#fdfbf7_0%,#f5f0e6_100%)] selection:bg-[#10b981]/30 min-h-screen">
      <Navbar currentUser={currentUser} />

      {/* Hero Wrapper */}
      <div ref={heroRef} className="h-[130vh] relative">
        <div className="sticky top-0 h-svh w-full overflow-hidden flex flex-col items-center pt-17.5 md:pt-25 pb-4">
          <motion.section
            style={{ y, opacity, scale }}
            className="w-full flex-1 flex flex-col items-center justify-center min-h-0"
          >
            {/* Subtle Background Glows */}
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#10b981]/15 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-1/4 translate-x-1/2 translate-y-1/2 w-75 h-75 bg-[#f59e0b]/15 rounded-full blur-[100px] -z-10 animate-pulse" />

            {/* Diagram Background Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="hidden lg:flex absolute inset-0 z-0 items-center justify-end overflow-hidden pointer-events-none opacity-100 mt-0"
            >
              <div className="w-full h-full max-w-7xl mx-auto relative">
                <div
                  className="absolute top-1/2 origin-center w-250"
                  style={{
                    left: `${calculatedHeroLeft}%`,
                    transform: `translate(-50%, -50%) scale(${calculatedHeroScale})`,
                  }}
                >
                  <ConnectionDiagram />
                </div>
              </div>
            </motion.div>

            <div className="container lg:pl-16 mx-auto px-4 md:px-8 flex items-center flex-1 min-h-0 pb-6 md:pb-10 w-full h-full relative z-10 pointer-events-none">
              {/* Left Side: Text / CTA */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col gap-5 md:gap-6 max-w-2xl z-10 pointer-events-auto"
              >
                <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-[#0f172a]">
                  Grow your local business.
                  <br />
                  <span className="text-[#10b981] font-medium">
                    In your own language.
                  </span>
                </h1>

                <p className="text-sm md:text-base lg:text-lg text-[#475569] leading-relaxed max-w-[90%]">
                  Empowering rural micro-entrepreneurs, artisans, and local
                  traders with instant business advisory, working capital
                  structuring, and government scheme access — directly through
                  WhatsApp, voice, and our intelligent portal.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {currentUser ? (
                    <Link
                      href="/dashboard"
                      className="px-5 py-3 md:px-6 md:py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-2xl shadow-2xl shadow-[#10b981]/30 transition-all active:scale-95 text-sm inline-flex items-center justify-center"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/signup"
                      className="px-5 py-3 md:px-6 md:py-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-2xl shadow-2xl shadow-[#10b981]/30 transition-all active:scale-95 text-sm inline-flex items-center justify-center"
                    >
                      Get Started Free
                    </Link>
                  )}
                </div>

                {/* Rural Metrics Banner */}
                <div className="flex flex-wrap items-center gap-6 pt-4 text-xs md:text-sm font-medium text-[#475569]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#f59e0b]">★</span> 50+ Districts Mapped
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f59e0b]">★</span> 200+ Opportunities
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#f59e0b]">★</span> 100+ Schemes Indexed
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </div>

      <div className="bg-[#fdfbf7] relative z-10 w-full rounded-t-[2.5rem] md:rounded-t-[4rem] border-t border-[#e7e5e4] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <TargetAudience />
        
        {/* Feature Section */}
        <section id="features" className="py-24 md:py-32 bg-transparent border-b border-[#e7e5e4]">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-[#0f172a]">
                The Rural Micro-Enterprise Bottleneck
              </h2>
              <p className="text-[#475569] text-lg md:text-xl leading-relaxed">
                Grassroots businesses generate vital economic value, but lack
                access to affordable financial guidance, formalized credit
                structuring, and hyper-local market intelligence.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Code2,
                  title: "No Complex Paperwork",
                  desc: "Securing working capital shouldn't require confusing bank visits or predatory middlemen. VyaparSetu formats informal ledgers into bank-ready statements and matches you with verified government credit schemes.",
                },
                {
                  icon: Network,
                  title: "Actionable Regional Advisory",
                  desc: "Rural traders often lack real-time insights on regional commodity rates, seasonal demand shifts, and supplier bargaining power. Receive actionable price guidance tailored to your exact pin code.",
                },
                {
                  icon: ShieldCheck,
                  title: "Conversational & Voice First",
                  desc: "No steep technological hurdle. Speak or text naturally in regional languages through WhatsApp, voice notes, and simplified dashboards without needing complex accounting software.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="p-8 rounded-3xl border border-[#e7e5e4] bg-[#f5f0e6] shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="size-12 rounded-2xl bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-[#0f172a]">
                    {feature.title}
                  </h3>
                  <p className="text-[#475569] leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />
        <Technologies />
        <Pricing currentUser={currentUser} />

        {/* Footer */}
        <footer className="border-t border-border py-12 bg-muted/10 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} VyaparSetu. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
