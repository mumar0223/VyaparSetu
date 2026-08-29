import { motion } from "motion/react";
import { Leaf, Store, Scissors, Flame, Users, Smartphone } from "lucide-react";

export function TargetAudience() {
  const targets = [
    {
      category: "AGRICULTURE",
      title: "Farmer Producer Group",
      icon: Leaf,
      color: "bg-[#ecfdf5] text-[#10b981] border-[#d1fae5]",
    },
    {
      category: "RETAIL",
      title: "Kirana Store",
      icon: Store,
      color: "bg-[#fff7ed] text-[#f97316] border-[#ffedd5]",
    },
    {
      category: "MANUFACTURING",
      title: "Tailoring Unit",
      icon: Scissors,
      color: "bg-[#fdf2f8] text-[#ec4899] border-[#fce7f3]",
    },
    {
      category: "FOOD PROCESSING",
      title: "Spice Processing Unit",
      icon: Flame,
      color: "bg-[#fef2f2] text-[#ef4444] border-[#fee2e2]",
    },
    {
      category: "COMMUNITY FINANCE",
      title: "SHG & Cooperative",
      icon: Users,
      color: "bg-[#eff6ff] text-[#3b82f6] border-[#dbeafe]",
    },
    {
      category: "SERVICES",
      title: "Mobile Repair Shop",
      icon: Smartphone,
      color: "bg-[#f5f3ff] text-[#8b5cf6] border-[#ede9fe]",
    },
  ];

  return (
    <section id="audience" className="w-full bg-[#fdfbf7] py-20 pb-32 border-b border-[#e7e5e4]/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-3xl md:text-4xl font-bold text-[#064e3b] mb-4"
          >
            Empowering Every Micro-Enterprise
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#475569]"
          >
            We support the entire village economy—from agriculture to retail and services.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {targets.map((target, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-[#e7e5e4] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-5"
            >
              <div className={`size-14 rounded-xl border flex items-center justify-center shrink-0 ${target.color}`}>
                <target.icon className="size-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748b] tracking-wider uppercase mb-1">
                  {target.category}
                </p>
                <h3 className="font-bold text-[#0f172a] text-lg">
                  {target.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
