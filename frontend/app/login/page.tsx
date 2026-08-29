"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Info, ShieldCheck, Smartphone } from "lucide-react";
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
            <div className="md:w-1/2 bg-navy p-8 md:p-12 lg:p-20 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 inline-flex">
                        <div className="w-4 h-4 bg-forest rounded-full" />
                        <span className="font-serif font-bold text-2xl text-white tracking-tight">VyaparSetu</span>
                    </Link>

                    <div className="mt-16 md:mt-24 lg:mt-32 max-w-md">
                        <h1 className="text-4xl md:text-5xl font-serif text-white font-bold leading-tight mb-6">
                            Your <span className="text-mint">Business Growth</span> Partner
                        </h1>
                        <p className="text-sage text-lg leading-relaxed">
                            Sign in to access personalized financial planning, AI-driven advisory, and local market insights tailored for you.
                        </p>
                    </div>
                </div>

                <div className="mt-16 relative z-10 flex gap-4 md:gap-6 flex-wrap">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 min-w-[150px]">
                        <ShieldCheck className="w-8 h-8 text-mint mb-3" />
                        <div className="text-white font-bold mb-1">Secure</div>
                        <div className="text-sage text-sm">Gov-grade security</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 min-w-[150px]">
                        <Info className="w-8 h-8 text-mint mb-3" />
                        <div className="text-white font-bold mb-1">Verified</div>
                        <div className="text-sage text-sm">Verified algorithms</div>
                    </div>
                </div>

                {/* Abstract background shapes */}
                <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-mint/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-forest/20 rounded-full blur-3xl" />
            </div>

            {/* Right panel - Auth Form */}
            <div className="md:w-1/2 bg-cream p-8 md:p-12 lg:p-20 flex items-center justify-center">
                <div className="w-full max-w-md">
                    {step === "phone" ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-3xl font-serif font-bold text-forest mb-3">Welcome Back</h2>
                                <p className="text-ink-muted">Enter your mobile number to get started</p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-semibold text-forest block">Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-ink-muted font-medium">+91</span>
                                        </div>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="9876543210"
                                            className="w-full pl-14 pr-4 py-4 bg-white border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl text-lg font-medium text-ink transition-all outline-none shadow-sm"
                                            required
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-ink-muted">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={phone.length < 10 || isLoading}
                                    className="w-full bg-orange hover:bg-orange-hover text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-[0_4px_14px_rgba(217,142,42,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Sending..." : "Send OTP"}
                                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-ink-muted text-sm">
                                    By continuing, you agree to VyaparSetu's{" "}
                                    <a href="#" className="font-semibold text-forest hover:underline">Terms of Service</a> and{" "}
                                    <a href="#" className="font-semibold text-forest hover:underline">Privacy Policy</a>.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-3xl font-serif font-bold text-forest mb-3">Verify OTP</h2>
                                <div className="flex flex-col md:flex-row md:items-center gap-2">
                                    <p className="text-ink-muted">Code sent to +91 {phone}</p>
                                    <button onClick={() => setStep("phone")} className="text-forest font-semibold hover:underline text-sm">Change number</button>
                                </div>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-8">
                                <div className="flex justify-between gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            className="w-14 h-16 sm:w-16 sm:h-20 bg-white border border-sage/40 focus:border-mint focus:ring-4 focus:ring-mint-light rounded-2xl text-2xl font-bold text-center text-ink transition-all outline-none shadow-sm"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    setOtp(prev => (prev + val).slice(0, 4));
                                                    const next = e.target.nextElementSibling as HTMLInputElement;
                                                    if (next) next.focus();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <span className="text-ink-muted text-sm border-b border-transparent">Didn't receive code?</span>
                                    <button type="button" className="text-forest font-semibold text-sm hover:underline">Resend OTP</button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={otp.length < 4 || isLoading}
                                    className="w-full bg-orange hover:bg-orange-hover text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-[0_4px_14px_rgba(217,142,42,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
