"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { Database, Server, Cpu, Layers, Workflow, Cloud } from "lucide-react";

const techs = [
  {
    name: "Multilingual LLM Engines",
    desc: "Understanding regional dialects, localized trade terminologies, and voice notes across Indian languages.",
    icon: Cpu,
  },
  {
    name: "WhatsApp & Voice Interface",
    desc: "Conversational onboarding without app installation barriers, accessible via basic smartphones.",
    icon: Cloud,
  },
  {
    name: "Bank-Grade Ledger Security",
    desc: "Salted PBKDF2 cryptography, immutable audit trails, and privacy-first financial record storage.",
    icon: Database,
  },
  {
    name: "Scheme & Credit Scoring",
    desc: "Automated eligibility verification for PM Mudra, PM SVANidhi, and rural SHG micro-loans.",
    icon: Workflow,
  },
  {
    name: "Regional Mandi Intelligence",
    desc: "Daily wholesale mandi price indexing and direct agricultural/handicraft buyer matching.",
    icon: Server,
  },
  {
    name: "Low-Bandwidth Architecture",
    desc: "Engineered for edge resilience and sub-second responses even on 2G/3G rural networks.",
    icon: Layers,
  }
];

export function Technologies() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={containerRef} id="technologies" className="py-24 md:py-32 bg-[#f5f0e6] relative border-y border-[#e7e5e4] overflow-hidden">
      {/* Background styling */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ backgroundColor: { duration: 0 }, borderColor: { duration: 0 }, color: { duration: 0 } }}
          className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-[#0f172a]">Built for Rural Connectivity & Resilience</h2>
          <p className="text-[#475569] text-lg md:text-xl">
            VyaparSetu combines multilingual generative intelligence, offline-first edge capabilities, and secure banking protocol integrations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut", backgroundColor: { duration: 0 }, borderColor: { duration: 0 }, color: { duration: 0 } }}
              className="p-6 rounded-2xl border border-[#e7e5e4] bg-white shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="size-12 rounded-xl bg-[#ecfdf5] border border-[#10b981]/20 text-[#10b981] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
                <tech.icon className="size-6" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-[#0f172a]">{tech.name}</h3>
              <p className="text-[#475569] leading-relaxed text-sm">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
