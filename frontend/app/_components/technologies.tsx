"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { Database, Server, Cpu, Layers, Shield, Cloud } from "lucide-react";

const techs = [
  {
    name: "Multilingual Voice & NLP",
    desc: "Understands local trade terminologies, dialects, and voice notes across 8 Indian languages.",
    icon: Cpu,
  },
  {
    name: "WhatsApp & Voice IVR",
    desc: "Conversational logging without application installation hurdles, accessible via basic mobile phones.",
    icon: Cloud,
  },
  {
    name: "PBKDF2 Cryptographic Security",
    desc: "Salted cryptographic encryption, immutable ledger trails, and sovereign privacy controls.",
    icon: Shield,
  },
  {
    name: "Automated Scheme Matcher",
    desc: "Instant eligibility checks across PM Mudra, PM SVANidhi, and KVIC PMEGP subsidy programs.",
    icon: Database,
  },
  {
    name: "Hyper-Local Mandi Indexing",
    desc: "Daily wholesale commodity rate indexing and regional distributor connectivity.",
    icon: Server,
  },
  {
    name: "Offline-First Edge Resilience",
    desc: "Engineered for low-bandwidth networks with sub-second response times on rural connections.",
    icon: Layers,
  },
];

export function Technologies() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      id="technologies"
      className="py-20 md:py-28 bg-forest/90 dark:bg-zinc-950/90 text-white relative border-y border-sage/20 dark:border-border overflow-hidden"
    >
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,222,128,0.15),transparent_60%)]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-bold text-mint uppercase tracking-wider block mb-2">
            Enterprise Architecture
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-white">
            Engineered for Rural Connectivity &amp; Scale
          </h2>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            VyaparSetu combines multilingual generative intelligence, offline-first edge capabilities, and secure banking protocol integrations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors group"
            >
              <div className="size-11 rounded-xl bg-mint/10 border border-mint/20 text-mint flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-mint group-hover:text-black transition-all duration-300">
                <tech.icon className="size-5" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2 text-white">{tech.name}</h3>
              <p className="text-white/70 leading-relaxed text-xs sm:text-sm">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
