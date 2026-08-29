"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Sparkles, MapPin, TrendingUp, Target, FileText, Globe, MessageSquare, ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function LandingClient() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-ink font-sans flex flex-col selection:bg-mint-light selection:text-forest">
      {/* 1. Nav bar */}
      <nav className="sticky top-0 z-50 w-full bg-cream border-b border-sage/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-3 xl:w-4 h-3 xl:h-4 bg-forest rounded-full" />
              <span className="font-serif font-bold text-xl sm:text-2xl text-forest tracking-tight">VyaparSetu</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-ink-muted hover:text-forest font-medium transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-ink-muted hover:text-forest font-medium transition-colors">How It Works</Link>
              <Link href="#success-stories" className="text-ink-muted hover:text-forest font-medium transition-colors">Success Stories</Link>
              <Link href="#schemes" className="text-ink-muted hover:text-forest font-medium transition-colors">Schemes</Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              <Link href="/login" className="bg-orange hover:bg-orange-hover text-white text-sm font-semibold py-2.5 px-6 rounded-full transition-transform active:scale-95 shadow-md">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-forest p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="md:hidden bg-cream border-b border-sage/30 px-4 pt-2 pb-6 space-y-4">
            <Link href="#features" className="block text-ink-muted hover:text-forest font-medium py-2">Features</Link>
            <Link href="#how-it-works" className="block text-ink-muted hover:text-forest font-medium py-2">How It Works</Link>
            <Link href="#success-stories" className="block text-ink-muted hover:text-forest font-medium py-2">Success Stories</Link>
            <Link href="#schemes" className="block text-ink-muted hover:text-forest font-medium py-2">Schemes</Link>
            <div className="pt-4 border-t border-sage/30 flex flex-col gap-4">
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
              <Link href="/login" className="bg-orange hover:bg-orange-hover text-white text-center font-semibold py-3 px-6 rounded-full transition-colors shadow-sm">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* 2. Hero */}
      <section className="bg-navy pt-16 pb-24 sm:pt-28 sm:pb-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl font-serif text-white font-bold leading-tight sm:leading-[1.15]"
          >
            AI-Powered <span className="text-mint">Business Guidance</span><br className="hidden sm:block" /> for Rural Entrepreneurs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Discover high-demand local opportunities, structure your finances properly, and access government schemes with a data-driven assistant tailored for your village.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <Link href="/login" className="w-full sm:w-auto bg-orange hover:bg-orange-hover text-white font-bold text-lg py-4 px-8 rounded-full shadow-[0_0_20px_rgba(217,142,42,0.3)] transition-all transform hover:-translate-y-1">
              Get Started
            </Link>
            <button className="w-full sm:w-auto bg-transparent border border-white/30 hover:border-mint hover:text-mint text-white font-semibold text-lg py-4 px-8 rounded-full transition-colors">
              Explore Opportunities
            </button>
          </motion.div>
        </div>
      </section>

      {/* 3. Features grid */}
      <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center md:text-left mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-forest mb-4">Everything You Need to Grow</h2>
            <p className="text-ink-muted text-lg sm:text-xl max-w-2xl">VyaparSetu brings enterprise-level business intelligence to micro-entrepreneurs.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage/20 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-mint-light rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-forest" />
              </div>
              <h3 className="text-xl font-bold text-forest mb-3">AI Business Advisor</h3>
              <p className="text-ink-muted leading-relaxed">Get personalized business ideas based on your budget and location.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage/20 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-mint-light rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-forest" />
              </div>
              <h3 className="text-xl font-bold text-forest mb-3">Opportunity Explorer</h3>
              <p className="text-ink-muted leading-relaxed">Interactive heatmap of high-demand business needs in your cluster.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage/20 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-mint-light rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-forest" />
              </div>
              <h3 className="text-xl font-bold text-forest mb-3">Financial Assistant</h3>
              <p className="text-ink-muted leading-relaxed">Calculate ROI, break-even timelines, and plan your capital.</p>
            </div>
            {/* Feature 4 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage/20 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-mint-light rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-forest" />
              </div>
              <h3 className="text-xl font-bold text-forest mb-3">Government Schemes</h3>
              <p className="text-ink-muted leading-relaxed">Auto-match with PMEGP, MUDRA Yojana, and other subsidies you qualify for.</p>
            </div>
            {/* Feature 5 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage/20 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-mint-light rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-forest" />
              </div>
              <h3 className="text-xl font-bold text-forest mb-3">Business Health</h3>
              <p className="text-ink-muted leading-relaxed">Track your readiness score and operational KPIs in real-time.</p>
            </div>
            {/* Feature 6 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-sage/20 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-mint-light rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-forest" />
              </div>
              <h3 className="text-xl font-bold text-forest mb-3">Smart Reporting</h3>
              <p className="text-ink-muted leading-relaxed">Generate complete PDF business reports for loan applications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How VyaparSetu Works */}
      <section id="how-it-works" className="py-20 sm:py-32 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:items-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-forest text-center md:text-left mb-16 sm:mb-24">How VyaparSetu Works</h2>
          <div className="relative w-full">
            {/* Line connecting steps */}
            <div className="absolute top-8 sm:top-10 left-10 md:left-[10%] right-10 md:right-[10%] h-1 bg-sage/30 hidden md:block" />

            <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-4 relative z-10 w-full">
              {/* Step 1 */}
              <div className="flex flex-row md:flex-col items-center gap-6 md:gap-6 w-full md:w-1/4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-mint-pale text-forest font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-mint shrink-0">1</div>
                <div className="text-left md:text-center text-lg sm:text-xl font-bold text-forest max-w-[200px]">Tell us about your business</div>
              </div>
              {/* Step 2 */}
              <div className="flex flex-row md:flex-col items-center gap-6 md:gap-6 w-full md:w-1/4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-mint-pale text-forest font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-mint shrink-0">2</div>
                <div className="text-left md:text-center text-lg sm:text-xl font-bold text-forest max-w-[200px]">Get AI recommendations</div>
              </div>
              {/* Step 3 */}
              <div className="flex flex-row md:flex-col items-center gap-6 md:gap-6 w-full md:w-1/4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-mint-pale text-forest font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-mint shrink-0">3</div>
                <div className="text-left md:text-center text-lg sm:text-xl font-bold text-forest max-w-[200px]">Build your financial plan</div>
              </div>
              {/* Step 4 (locked) */}
              <div className="flex flex-row md:flex-col items-center gap-6 md:gap-6 w-full md:w-1/4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sage/20 text-sage font-bold text-2xl flex items-center justify-center shrink-0">4</div>
                <div className="text-left md:text-center text-lg sm:text-xl font-bold text-sage max-w-[200px]">Track your growth</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Success Stories */}
      <section id="success-stories" className="py-20 sm:py-32 px-4 sm:px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6 border-b border-sage/40 pb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-forest mb-4">Success Stories</h2>
              <p className="text-ink-muted text-lg">Real rural entrepreneurs growing their businesses.</p>
            </div>
            <Link href="#all-stories" className="text-forest font-bold hover:text-forest-deep flex items-center gap-2 group">
              See all stories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 no-scrollbar">
            {/* Story 1 */}
            <div className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-3xl overflow-hidden shadow-sm border border-sage/20 flex flex-col">
              <div className="h-52 relative bg-navy flex items-end p-6">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1621252179022-8149842cffeb?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="block absolute inset-0 bg-gradient-to-t from-navy to-transparent opacity-80" />
                <div className="relative z-10 w-full">
                  <h3 className="text-2xl font-bold text-white mb-1">Sunita Devi</h3>
                  <p className="text-sage text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Rampur, UP</p>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <p className="italic text-ink-muted mb-8 leading-relaxed text-lg">
                  "Started with a micro-loan for two sewing machines. Now employs 5 local women and supplies school uniforms to three neighboring districts."
                </p>
                <div className="bg-cream rounded-2xl p-5 border border-sage/30">
                  <div className="text-xs font-bold text-forest uppercase tracking-wider mb-2 opacity-80">Monthly Revenue</div>
                  <div className="flex items-center gap-3 text-xl font-bold text-forest">
                    <span className="text-ink-muted line-through opacity-60">₹4,000</span>
                    <ArrowRight className="w-5 h-5 text-mint" />
                    <span className="text-2xl">₹35,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story 2 */}
            <div className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-3xl overflow-hidden shadow-sm border border-sage/20 flex flex-col">
              <div className="h-52 relative bg-navy flex items-end p-6">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1594951460309-183d2a3ea427?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="block absolute inset-0 bg-gradient-to-t from-navy to-transparent opacity-80" />
                <div className="relative z-10 w-full">
                  <h3 className="text-2xl font-bold text-white mb-1">Ramesh Patil</h3>
                  <p className="text-sage text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Shirpur, MH</p>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <p className="italic text-ink-muted mb-8 leading-relaxed text-lg">
                  "Transitioned from traditional wheat farming to high-density guava orchards using the AI advisor's crop-rotation plan and local demand metrics."
                </p>
                <div className="bg-cream rounded-2xl p-5 border border-sage/30">
                  <div className="text-xs font-bold text-forest uppercase tracking-wider mb-2 opacity-80">Annual Profit</div>
                  <div className="flex items-center gap-3 text-xl font-bold text-forest">
                    <span className="text-ink-muted line-through opacity-60">₹1.2L</span>
                    <ArrowRight className="w-5 h-5 text-mint" />
                    <span className="text-2xl">₹4.8L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story 3 */}
            <div className="snap-center shrink-0 w-[85vw] sm:w-auto bg-white rounded-3xl overflow-hidden shadow-sm border border-sage/20 flex flex-col">
              <div className="h-52 relative bg-navy flex items-end p-6">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1627993077309-8069d6fb350d?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="block absolute inset-0 bg-gradient-to-t from-navy to-transparent opacity-80" />
                <div className="relative z-10 w-full">
                  <h3 className="text-2xl font-bold text-white mb-1">Abdul Kareem</h3>
                  <p className="text-sage text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Munger, BR</p>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <p className="italic text-ink-muted mb-8 leading-relaxed text-lg">
                  "Used VyaparSetu to secure a Mudra loan for his pottery business, allowing him to buy an electric kiln and sell premium terracotta online."
                </p>
                <div className="bg-cream rounded-2xl p-5 border border-sage/30">
                  <div className="text-xs font-bold text-forest uppercase tracking-wider mb-2 opacity-80">Production Capacity</div>
                  <div className="flex items-center gap-3 text-xl font-bold text-forest">
                    <span className="text-ink-muted line-through opacity-60 text-[1rem]">200 units/mo</span>
                    <ArrowRight className="w-5 h-5 text-mint" />
                    <span className="text-[1.2rem]">1500 units/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Schemes CTA band */}
      <section id="schemes" className="bg-forest-deep py-20 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10">
            <span className="bg-white/10 text-white font-medium py-2 px-6 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">PMEGP</span>
            <span className="bg-white/10 text-white font-medium py-2 px-6 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">MUDRA Yojana</span>
            <span className="bg-white/10 text-white font-medium py-2 px-6 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">NABARD</span>
            <span className="bg-white/10 text-white font-medium py-2 px-6 rounded-full border border-white/20 shadow-sm backdrop-blur-sm">Startup India</span>
          </div>
          <Link href="/login" className="bg-orange hover:bg-orange-hover text-white font-bold text-lg py-4 px-8 rounded-full shadow-lg transition-transform active:scale-95 w-full sm:w-auto">
            Explore Government Schemes
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-navy-dark pt-20 pb-10 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8 mb-16 border-b border-white/10 pb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-forest rounded-full" />
                <span className="font-serif font-bold text-2xl text-white tracking-tight">VyaparSetu</span>
              </div>
              <p className="text-sage font-light leading-relaxed">
                AI-Driven Hyper-Local Business Advisory & Financial Structuring Assistant for Rural Entrepreneurs.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="#features" className="text-sage hover:text-white transition-colors">AI Advisor</Link></li>
                <li><Link href="#features" className="text-sage hover:text-white transition-colors">Opportunity Explorer</Link></li>
                <li><Link href="#features" className="text-sage hover:text-white transition-colors">Financial Planner</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Resources</h4>
              <ul className="space-y-4">
                <li><Link href="#schemes" className="text-sage hover:text-white transition-colors">Government Schemes</Link></li>
                <li><Link href="#success-stories" className="text-sage hover:text-white transition-colors">Success Stories</Link></li>
                <li><Link href="#" className="text-sage hover:text-white transition-colors">Mentor Network</Link></li>
                <li><Link href="#" className="text-sage hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Contact</h4>
              <ul className="space-y-4">
                <li className="text-sage">support@vyaparsetu.in</li>
                <li className="pt-4">
                  <LanguageSwitcher variant="solid" className="w-full sm:w-auto" />
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center text-sage text-sm flex flex-col items-center">
            &copy; {new Date().getFullYear()} VyaparSetu. All rights reserved.
          </div>
        </div>

        {/* Chat Bubble */}
        <button className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-16 h-16 bg-mint text-forest rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(74,222,128,0.3)] hover:bg-white transition-colors z-50">
          <MessageSquare className="w-7 h-7" />
        </button>
      </footer>
    </div>
  );
}
