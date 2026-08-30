"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
    Calculator, Building2, Sparkles, CheckCircle2, TrendingUp, Target, 
    ShieldCheck, ArrowRight, ArrowLeft, Building, Wallet, LineChart
} from "lucide-react";
import { MoneyInputField } from "@/components/ui/money-input-field";
import { cn } from "@/lib/utils";

export default function BorrowingPage() {
    const [loanAmount, setLoanAmount] = useState<number | undefined>();
    const [purpose, setPurpose] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [revenue, setRevenue] = useState("");

    const [showResults, setShowResults] = useState(false);

    const matchMutation = useMutation({
        mutationFn: async () => {
            if (!loanAmount || !purpose || !businessType || !revenue) {
                throw new Error("All fields required");
            }
            // Simulate AI Matchmaking process
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    setShowResults(true);
                    resolve();
                }, 1500);
            });
        }
    });

    const handleReset = () => {
        setShowResults(false);
        matchMutation.reset();
    };

    if (showResults) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-2">
                            <Sparkles className="size-6 text-orange" />
                            AI Loan Marketplace
                        </h1>
                        <p className="text-ink-muted font-medium">We scanned 40+ lenders and analyzed your cash flow.</p>
                    </div>
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 text-sm font-bold text-ink-muted hover:text-forest transition-colors bg-white px-4 py-2 rounded-xl border border-sage/40 shadow-sm"
                    >
                        <ArrowLeft className="size-4" /> Edit Parameters
                    </button>
                </div>

                {/* Hero: Best Match */}
                <div className="bg-forest rounded-[2rem] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-mint/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    {/* Primary Recommendation */}
                    <div className="relative z-10 flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-mint/20 border border-mint/30 rounded-full text-mint text-sm font-bold uppercase tracking-wider">
                            🏆 Top Recommendation
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white flex items-center gap-4">
                                State Bank of India
                            </h2>
                            <p className="text-xl text-mint font-medium">95% Eligibility Match</p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="bg-white/10 rounded-2xl px-5 py-4 border border-white/20">
                                <p className="text-xs text-white/70 uppercase tracking-wider font-bold mb-1">Interest Rate</p>
                                <p className="text-2xl font-bold text-white">8.9%</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl px-5 py-4 border border-white/20">
                                <p className="text-xs text-white/70 uppercase tracking-wider font-bold mb-1">Lowest EMI</p>
                                <p className="text-2xl font-bold text-white">₹10,240<span className="text-sm font-medium text-white/70">/mo</span></p>
                            </div>
                        </div>
                        
                        <button className="bg-mint hover:bg-mint-dark text-forest font-bold py-3 px-8 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
                            Proceed with SBI <ArrowRight className="size-5" />
                        </button>
                    </div>

                    {/* AI Reasoning & Probability */}
                    <div className="relative z-10 md:w-[380px] space-y-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="size-4 text-mint" /> Why SBI?
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Strong revenue history matches criteria",
                                    "Loan amount within preferred tier",
                                    "Existing debt ratio is highly favorable",
                                    "Business operating for 5+ years"
                                ].map((reason, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-white/90">
                                        <CheckCircle2 className="size-5 text-mint shrink-0" />
                                        <span>{reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-white text-lg">92% Approval</h3>
                                <p className="text-xs text-white/70 uppercase tracking-wider mt-1">AI Probability Score</p>
                            </div>
                            <div className="size-12 shrink-0 relative flex items-center justify-center">
                                <svg className="transform -rotate-90 size-12 absolute inset-0">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/20" />
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="125" strokeDashoffset="10" className="text-mint" strokeLinecap="round" />
                                </svg>
                                <ShieldCheck className="size-5 text-mint" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integration Dashboards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Affordability & Impact */}
                    <div className="bg-white border border-sage/40 rounded-2xl p-6 shadow-sm space-y-6">
                        <h3 className="font-bold text-forest text-lg border-b border-sage/30 pb-3 flex items-center gap-2">
                            <LineChart className="size-5 text-orange" /> Loan Affordability Impact
                        </h3>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-1">Affordability Score</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-forest">86</span>
                                    <span className="text-lg font-bold text-ink-muted pb-0.5">/100</span>
                                </div>
                            </div>
                            <div className="bg-mint/20 text-mint font-bold px-4 py-2 rounded-xl text-sm border border-mint/30">
                                Safe to Borrow
                            </div>
                        </div>

                        <div className="bg-cream rounded-xl p-4 border border-sage/30 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-ink-muted">Current Monthly Profit</span>
                                <span className="font-bold text-forest">₹40,000</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-ink-muted">Expected EMI (SBI)</span>
                                <span className="font-bold text-orange">- ₹9,500</span>
                            </div>
                            <div className="h-px w-full bg-sage/40" />
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-forest">Net Profit After EMI</span>
                                <span className="font-bold text-mint text-lg">₹30,500</span>
                            </div>
                        </div>
                    </div>

                    {/* EMI Comparison & Docs */}
                    <div className="bg-white border border-sage/40 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col">
                        <h3 className="font-bold text-forest text-lg border-b border-sage/30 pb-3 flex items-center gap-2">
                            <Calculator className="size-5 text-mint" /> EMI Tenure Comparison
                        </h3>
                        
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-cream rounded-xl p-3 border border-sage/30 text-center">
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">3 Years</p>
                                <p className="font-bold text-forest text-lg">₹15,700<span className="text-[10px] text-ink-muted">/mo</span></p>
                            </div>
                            <div className="bg-mint-pale rounded-xl p-3 border border-mint/30 text-center relative shadow-sm">
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-mint text-forest text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">Recommended</div>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 mt-1">5 Years</p>
                                <p className="font-bold text-forest text-lg">₹10,400<span className="text-[10px] text-ink-muted">/mo</span></p>
                            </div>
                            <div className="bg-cream rounded-xl p-3 border border-sage/30 text-center">
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">7 Years</p>
                                <p className="font-bold text-forest text-lg">₹8,300<span className="text-[10px] text-ink-muted">/mo</span></p>
                            </div>
                        </div>

                        <div className="mt-auto pt-4">
                            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Required Documents (Pre-checked)</h4>
                            <div className="flex flex-wrap gap-2">
                                {["Aadhaar", "PAN", "Bank Statements", "GST Certificate", "Udyam Reg"].map((doc) => (
                                    <span key={doc} className="text-xs font-bold bg-sage/20 text-forest px-2.5 py-1 rounded-md flex items-center gap-1 border border-sage/40">
                                        <CheckCircle2 className="size-3 text-mint" /> {doc}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alternative Banks */}
                <div className="space-y-4">
                    <h3 className="font-bold text-forest text-lg">Alternative Bank Offers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: "Bank of Baroda", rate: "8.7%", emi: "10,100", match: 92 },
                            { name: "Canara Bank", rate: "9.1%", emi: "10,450", match: 89 },
                            { name: "HDFC Bank", rate: "12.2%", emi: "12,100", match: 78 },
                        ].map((bank) => (
                            <div key={bank.name} className="bg-white border border-sage/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cream rounded-xl border border-sage/30"><Building className="size-5 text-forest" /></div>
                                        <div>
                                            <h4 className="font-bold text-forest leading-none">{bank.name}</h4>
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider mt-1 inline-block px-2 py-0.5 rounded-md", 
                                                bank.match > 85 ? "bg-mint/20 text-mint" : "bg-orange/10 text-orange"
                                            )}>
                                                {bank.match}% Match
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-0.5">Rate</p>
                                        <p className="font-bold text-forest">{bank.rate}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-0.5">EMI</p>
                                        <p className="font-bold text-forest">₹{bank.emi}</p>
                                    </div>
                                </div>
                                <button className="w-full text-center text-sm font-bold text-forest bg-sage/20 hover:bg-sage/40 py-2.5 rounded-xl transition-colors">
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-serif font-bold text-forest flex items-center gap-3">
                    <Sparkles className="size-7 text-orange" /> AI Loan Matchmaker
                </h1>
                <p className="text-ink-muted">Enter your requirements and our AI will scan 40+ lenders to find your perfect loan fit.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Loan Calculator Form */}
                <div className="bg-white p-8 rounded-[2rem] border border-sage/30 shadow-sm">
                    <h2 className="text-xl font-bold text-forest mb-8 flex items-center gap-2">
                        <Target className="size-5 text-mint" />
                        Loan Parameters
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-ink-muted mb-2">Total Project / Loan Amount Required</label>
                            <MoneyInputField
                                value={loanAmount}
                                onChange={setLoanAmount}
                                placeholder="5,00,000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-ink-muted mb-2">Primary Purpose</label>
                            <select
                                className="w-full bg-cream border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl px-4 py-4 text-ink font-bold outline-none transition-all appearance-none"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                            >
                                <option value="" disabled>Select purpose...</option>
                                <option value="working_capital">Working Capital</option>
                                <option value="equipment">Machinery & Equipment</option>
                                <option value="expansion">Business Expansion</option>
                                <option value="inventory">Inventory Purchase</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-ink-muted mb-2">Business Type</label>
                                <select
                                    className="w-full bg-cream border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl px-4 py-4 text-ink font-bold outline-none transition-all appearance-none"
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                >
                                    <option value="" disabled>Select...</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="retail">Retail & Wholesale</option>
                                    <option value="services">Services</option>
                                    <option value="agriculture">Agri-Allied</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-ink-muted mb-2">Annual Revenue</label>
                                <select
                                    className="w-full bg-cream border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl px-4 py-4 text-ink font-bold outline-none transition-all appearance-none"
                                    value={revenue}
                                    onChange={(e) => setRevenue(e.target.value)}
                                >
                                    <option value="" disabled>Select...</option>
                                    <option value="<10L">Below ₹10 Lakhs</option>
                                    <option value="10L-50L">₹10L - ₹50L</option>
                                    <option value="50L-1Cr">₹50L - ₹1 Crore</option>
                                    <option value=">1Cr">Above ₹1 Crore</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => matchMutation.mutate()}
                                disabled={!loanAmount || !purpose || !businessType || !revenue || matchMutation.isPending}
                                className="w-full bg-orange hover:bg-orange-hover disabled:bg-sage disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                {matchMutation.isPending ? (
                                    <>Analyzing 40+ lenders...</>
                                ) : (
                                    <><Sparkles className="size-5" /> Run AI Matchmaking</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State Instructions */}
                <div className="hidden lg:flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-sage/50 rounded-[2rem] bg-white/50 text-ink-muted">
                    <div className="w-24 h-24 bg-cream rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 border border-mint rounded-full animate-ping opacity-20" />
                        <Sparkles className="size-10 text-mint" />
                    </div>
                    <h3 className="text-2xl font-bold text-forest mb-3 font-serif">AI is standing by</h3>
                    <p className="max-w-md mx-auto text-lg">Enter your exact requirements on the left. VyaparSetu will analyze your cash flow, cross-reference 40+ banks, and find the most affordable loan for your business.</p>
                </div>
            </div>
        </div>
    );
}
