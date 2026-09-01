"use client";

import {
  Star,
  TrendingUp,
  MapPin,
  Award,
  Building2,
  ArrowUpRight,
} from "lucide-react";

const CASE_STUDIES = [
  {
    id: "story-1",
    name: "Laxmi Dairy & Chilling Center",
    owner: "Laxmibai Patil",
    location: "Kolhapur, Maharashtra",
    category: "Agro & Dairy",
    schemeUsed: "NABARD Dairy Entrepreneurship Development Scheme",
    initialRevenue: "₹45,000 / month",
    currentRevenue: "₹3,20,000 / month",
    growth: "+610%",
    story: "Upgraded from manual milking to solar-powered chilling bulk storage with 33% NABARD subsidy, eliminating spoilage and supplying directly to district cooperatives.",
    keyLesson: "Cold storage infrastructure unlocks institutional pricing without middlemen.",
  },
  {
    id: "story-2",
    name: "Shree Ganesh Kirana & Provisions",
    owner: "Rameshwar Gurjar",
    location: "Indore, Madhya Pradesh",
    category: "Retail & Commerce",
    schemeUsed: "Mudra Tarun (₹8.5 Lakhs)",
    initialRevenue: "₹80,000 / month",
    currentRevenue: "₹4,10,000 / month",
    growth: "+412%",
    story: "Digitized daily ledger with UPI QR codes, secured collateral-free Mudra loan to purchase bulk FMCG inventory directly from regional distributors at 8% higher margin.",
    keyLesson: "Digital sales history turns cash sales into bankable credit collateral.",
  },
  {
    id: "story-3",
    name: "Saraswati Handloom & Khadi Crafts",
    owner: "Anjali Devi",
    location: "Varanasi, Uttar Pradesh",
    category: "Handicrafts & Textiles",
    schemeUsed: "PM Vishwakarma Toolkit & Concessional Credit",
    initialRevenue: "₹25,000 / month",
    currentRevenue: "₹1,45,000 / month",
    growth: "+480%",
    story: "Received modern electric jacquard loom and ₹3 Lakhs 5% subvented working capital loan, tripling daily weaving output and selling via ONDC e-commerce.",
    keyLesson: "Modern toolkits + digital market access multiply rural artisan productivity.",
  },
];

export function SuccessStoriesClient({ milestones }: { milestones: any[] }) {
  return (
    <div className="h-full flex flex-col pt-16 sm:pt-16 md:pt-16 lg:pt-8 p-4 md:p-6 lg:p-8 overflow-y-auto font-sans text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest dark:text-mint flex items-center gap-2.5">
            <Star className="size-7 text-mint" /> Grassroots Growth Blueprints
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground mt-1">
            Proven blueprints and revenue breakthroughs from real micro-entrepreneurs using government schemes
          </p>
        </div>
      </div>

      {/* Case Studies */}
      <div className="space-y-6 flex-1">
        {CASE_STUDIES.map((study) => (
          <div
            key={study.id}
            className="bg-white dark:bg-card rounded-2xl border border-sage/30 dark:border-border p-6 shadow-xs"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-sage/20 dark:border-border mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-forest dark:text-mint bg-mint-pale dark:bg-mint/20 px-2.5 py-0.5 rounded-full">
                    {study.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3" /> {study.location}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-forest dark:text-foreground">
                  {study.name}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  Founder: {study.owner}
                </span>
              </div>

              {/* Growth Metrics Badge */}
              <div className="flex items-center gap-4 bg-cream/70 dark:bg-muted/40 p-3 rounded-2xl border border-sage/30 dark:border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Initial</span>
                  <span className="text-xs font-bold text-muted-foreground">{study.initialRevenue}</span>
                </div>
                <div className="text-forest dark:text-mint">
                  <ArrowUpRight className="size-5" />
                </div>
                <div>
                  <span className="text-[10px] text-forest dark:text-mint uppercase block font-bold">Current</span>
                  <span className="text-sm font-bold text-forest dark:text-foreground">{study.currentRevenue}</span>
                </div>
                <div className="bg-forest dark:bg-mint text-white dark:text-black font-bold text-xs px-2.5 py-1 rounded-xl shadow-xs">
                  {study.growth}
                </div>
              </div>
            </div>

            {/* Scheme & Narrative */}
            <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
              <div className="flex items-center gap-2 text-forest dark:text-mint font-semibold">
                <Award className="size-4 text-orange" /> Scheme Leveraged: {study.schemeUsed}
              </div>
              <p className="text-foreground/85">{study.story}</p>
              <div className="p-3 bg-mint-pale/40 dark:bg-mint/10 rounded-xl border border-mint/20 text-xs font-medium text-forest dark:text-foreground">
                <strong className="text-forest dark:text-mint">Key Growth Principle:</strong> {study.keyLesson}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
