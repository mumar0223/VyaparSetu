"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Smartphone, Landmark, Sparkles, HandCoins } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"phone" | "otp">("phone");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return;
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setStep("otp");
        }, 1000);
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 4) return;
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push("/app");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-cream text-ink font-sans flex flex-col md:flex-row selection:bg-mint-light selection:text-forest">
            {/* Left panel - Branding & Value Prop */}
            <div className="md:w-1/2 bg-gradient-to-br from-forest via-[#0a2318] to-[#04120a] p-8 md:p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 inline-flex">
                        <div className="w-5 h-5 bg-mint rounded-full shadow-[0_0_15px_rgba(33,184,124,0.5)]" />
                        <span className="font-serif font-bold text-2xl text-white tracking-tight">VyaparSetu</span>
                    </Link>

                    <div className="mt-16 md:mt-20 max-w-lg">
                        <h1 className="text-4xl md:text-5xl font-serif text-white font-bold leading-tight mb-6">
                            From <span className="text-mint">Local Business</span><br />
                            to National Growth
                        </h1>
                        <p className="text-sage text-lg leading-relaxed font-medium">
                            Helping rural entrepreneurs access finance, government schemes, and business intelligence.
                        </p>
                    </div>
                </div>

                <div className="mt-12 relative z-10 flex flex-col gap-4 max-w-md">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-4 items-start group hover:bg-white/10 transition-colors">
                        <div className="p-2.5 bg-mint/10 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <Landmark className="w-6 h-6 text-mint" />
                        </div>
                        <div>
                            <div className="text-white font-bold mb-1">Govt. Scheme Ready</div>
                            <div className="text-sage text-sm leading-snug">Discover schemes and subsidies relevant to your business profile.</div>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-4 items-start group hover:bg-white/10 transition-colors">
                        <div className="p-2.5 bg-mint/10 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6 text-mint" />
                        </div>
                        <div>
                            <div className="text-white font-bold mb-1">AI Financial Advisor</div>
                            <div className="text-sage text-sm leading-snug">Personalized guidance for growth, credit, and cash flow stability.</div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-4 items-start group hover:bg-white/10 transition-colors">
                        <div className="p-2.5 bg-mint/10 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <HandCoins className="w-6 h-6 text-mint" />
                        </div>
                        <div>
                            <div className="text-white font-bold mb-1">Credit & Loan Access</div>
                            <div className="text-sage text-sm leading-snug">Find suitable loans from banks based on your true business readiness.</div>
                        </div>
                    </div>
                </div>

                {/* Abstract background shapes */}
                <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-mint/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] bg-forest/40 rounded-full blur-[120px] pointer-events-none" />
            </div>

            {/* Right panel - Auth Form */}
            <div className="md:w-1/2 bg-cream p-8 md:p-12 lg:p-20 flex items-center justify-center relative overflow-hidden">
                {/* Subtle background grain/pattern could go here */}
                
                <div className="w-full max-w-md relative z-10">
                    {step === "phone" ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-4xl font-serif font-bold text-forest mb-3">Welcome Back</h2>
                                <p className="text-ink-muted text-lg">Enter your mobile number to get started</p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-bold text-forest uppercase tracking-wider block">Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <span className="text-ink-muted font-bold text-lg">+91</span>
                                            <div className="w-px h-6 bg-sage/40 mx-3" />
                                        </div>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="98765 43210"
                                            className="w-full pl-[5.5rem] pr-5 py-4 bg-white border-2 border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-[1.25rem] text-xl font-bold text-forest transition-all outline-none shadow-sm placeholder:text-sage"
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-sage">
                                            <Smartphone className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={phone.length < 10 || isLoading}
                                    className="w-full bg-orange hover:bg-orange-hover text-white font-bold text-lg py-4.5 px-8 rounded-[1.25rem] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                >
                                    {isLoading ? "Sending OTP..." : "Send OTP"}
                                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                                </button>
                            </form>

                            <div className="mt-10 text-center">
                                <p className="text-ink-muted text-sm font-medium">
                                    By continuing, you agree to VyaparSetu's{" "}
                                    <a href="#" className="font-bold text-forest hover:text-mint transition-colors underline decoration-mint/40 underline-offset-4">Terms of Service</a> and{" "}
                                    <a href="#" className="font-bold text-forest hover:text-mint transition-colors underline decoration-mint/40 underline-offset-4">Privacy Policy</a>.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-4xl font-serif font-bold text-forest mb-3">Verify OTP</h2>
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <p className="text-ink-muted text-lg">Code sent to +91 {phone}</p>
                                    <button onClick={() => setStep("phone")} className="text-mint font-bold hover:text-forest transition-colors text-sm underline decoration-mint/40 underline-offset-4">Change number</button>
                                </div>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-8">
                                <div className="flex justify-between gap-3 sm:gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            className="w-16 h-20 sm:w-20 sm:h-24 bg-white border-2 border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl text-4xl font-bold text-center text-forest transition-all outline-none shadow-sm"
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                e.target.value = val;
                                                if (val) {
                                                    setOtp(prev => (prev + val).slice(0, 4));
                                                    const next = e.target.nextElementSibling as HTMLInputElement;
                                                    if (next) next.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Backspace" && !e.currentTarget.value) {
                                                    const prev = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    if (prev) {
                                                        prev.focus();
                                                        setOtp(o => o.slice(0, -1));
                                                    }
                                                }
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="flex justify-between items-center px-2">
                                    <span className="text-ink-muted text-sm font-medium">Didn't receive code?</span>
                                    <button type="button" className="text-forest font-bold text-sm hover:text-mint transition-colors">Resend OTP</button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={otp.length < 4 || isLoading}
                                    className="w-full bg-orange hover:bg-orange-hover text-white font-bold text-lg py-4.5 px-8 rounded-[1.25rem] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Verifying..." : "Verify & Continue"}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
