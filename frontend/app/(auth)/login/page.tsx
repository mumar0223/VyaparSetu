"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Landmark,
  Bot,
  HandCoins,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-cream text-ink font-sans flex flex-col md:flex-row selection:bg-mint-light selection:text-forest">
      {/* Left panel - Branding & Value Prop */}
      <div className="md:w-1/2 bg-gradient-to-br from-forest via-[#0a2318] to-[#04120a] p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-mint rounded-full shadow-[0_0_12px_rgba(33,184,124,0.6)]" />
            <span className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight">VyaparSetu</span>
          </Link>

          <div className="mt-6 sm:mt-8 lg:mt-10 max-w-md">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white font-bold leading-tight mb-2 sm:mb-3">
              From <span className="text-mint">Local Business</span>
              <br />
              to National Growth
            </h1>
            <p className="text-sage text-xs sm:text-sm lg:text-base leading-relaxed font-normal">
              Helping rural entrepreneurs access finance, government schemes, and business intelligence.
            </p>
          </div>
        </div>

        <div className="my-6 sm:my-8 relative z-10 flex flex-col gap-2.5 sm:gap-3 max-w-md">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-3.5 flex gap-3.5 items-center group hover:bg-white/10 transition-colors">
            <div className="p-2 sm:p-2.5 bg-mint/10 rounded-lg shrink-0 group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5 text-mint" />
            </div>
            <div>
              <div className="text-white font-semibold text-xs sm:text-sm">Govt. Scheme Ready</div>
              <div className="text-sage/90 text-xs leading-snug">Discover schemes and subsidies relevant to your business.</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-3.5 flex gap-3.5 items-center group hover:bg-white/10 transition-colors">
            <div className="p-2 sm:p-2.5 bg-mint/10 rounded-lg shrink-0 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-mint" />
            </div>
            <div>
              <div className="text-white font-semibold text-xs sm:text-sm">AI Financial Advisor</div>
              <div className="text-sage/90 text-xs leading-snug">Personalized guidance for growth, credit, and cash flow.</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-3.5 flex gap-3.5 items-center group hover:bg-white/10 transition-colors">
            <div className="p-2 sm:p-2.5 bg-mint/10 rounded-lg shrink-0 group-hover:scale-105 transition-transform">
              <HandCoins className="w-5 h-5 text-mint" />
            </div>
            <div>
              <div className="text-white font-semibold text-xs sm:text-sm">Credit & Loan Access</div>
              <div className="text-sage/90 text-xs leading-snug">Find suitable loans from banks based on business readiness.</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sage/70 text-xs hidden sm:block">
          © {new Date().getFullYear()} VyaparSetu. All rights reserved.
        </div>

        {/* Abstract background shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] bg-mint/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[450px] h-[450px] bg-forest/40 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Right panel - Auth Form */}
      <div className="md:w-1/2 bg-cream p-6 sm:p-8 lg:p-10 xl:p-12 flex items-center justify-center relative overflow-hidden">
        <div className="w-full max-w-sm sm:max-w-md relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-6 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest mb-1.5">Welcome Back</h2>
              <p className="text-ink-muted text-xs sm:text-sm">Sign in to your VyaparSetu account to continue</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 sm:p-3 text-xs sm:text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forest uppercase tracking-wider block" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-2.5 sm:py-3 bg-white border border-sage/50 focus:border-mint focus:ring-2 focus:ring-mint-light rounded-xl text-sm font-medium text-forest transition-all outline-none shadow-xs placeholder:text-sage/70"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forest uppercase tracking-wider block" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-11 py-2.5 sm:py-3 bg-white border border-sage/50 focus:border-mint focus:ring-2 focus:ring-mint-light rounded-xl text-sm font-medium text-forest transition-all outline-none shadow-xs placeholder:text-sage/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-forest focus:outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange hover:bg-orange-hover text-white font-semibold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 sm:mt-6 text-center md:text-left">
              <p className="text-ink-muted text-xs sm:text-sm font-medium">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-semibold text-forest hover:text-mint transition-colors underline decoration-mint/40 underline-offset-4">
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
