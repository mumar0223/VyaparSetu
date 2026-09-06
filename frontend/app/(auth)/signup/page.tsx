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
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-icons";
import { startRegistration } from "@simplewebauthn/browser";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegisterPasskey = async () => {
    // Hardware sensor availability check
    if (
      typeof window === "undefined" ||
      !window.PublicKeyCredential ||
      !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
    ) {
      toast.error("Fingerprint sensor not found on this device.");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    try {
      const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        toast.error("Fingerprint sensor not found on this device.");
        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch {
      toast.error("Fingerprint sensor not found on this device.");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setBiometricLoading(true);

    try {
      // 1. Get registration options
      const optionsRes = await fetch("/api/auth/passkey/register-options", {
        method: "POST",
      });

      if (!optionsRes.ok) {
        throw new Error("Failed to initialize fingerprint registration.");
      }

      const options = await optionsRes.json();

      // 2. Trigger native device biometric enrollment
      const regResp = await startRegistration({ optionsJSON: options });

      // 3. Verify and save passkey to database
      const verifyRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResp),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || "Failed to register fingerprint.");
      }

      toast.success("Fingerprint login enabled successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Registration cancelled";
      if (
        e?.name === "NotAllowedError" ||
        msg.includes("cancelled") ||
        msg.includes("timed out") ||
        msg.includes("abort")
      ) {
        toast.info("Fingerprint setup skipped. You can enable it anytime in Settings.");
      } else {
        toast.error(msg);
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to create account");
        toast.error("Registration failed: " + (data.error || "Please try again"));
        return;
      }

      toast.success("Account created successfully!");

      // If device supports biometrics, offer instant fingerprint setup with skip option
      if (
        typeof window !== "undefined" &&
        window.PublicKeyCredential &&
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      ) {
        try {
          const isAvail = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (isAvail) {
            setShowBiometricPrompt(true);
            return;
          }
        } catch {
          // Fall through to dashboard
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-cream text-ink font-sans flex flex-col lg:flex-row selection:bg-mint-light selection:text-forest">
      {/* Left panel - Branding & Value Prop (Desktop only >= 1024px) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest via-[#0a2318] to-[#04120a] p-8 lg:p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo iconSize={32} textClassName="text-white text-xl sm:text-2xl" />
          </Link>

          <div className="mt-6 sm:mt-8 lg:mt-10 max-w-md">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white font-bold leading-tight mb-2 sm:mb-3">
              Empowering <span className="text-mint">Rural Enterprise</span>
              <br />
              with Intelligent Finance
            </h1>
            <p className="text-sage text-xs sm:text-sm lg:text-base leading-relaxed font-normal">
              Join grassroots entrepreneurs unlocking government schemes, hyper-local intelligence, and structured credit.
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
      <div className="w-full lg:w-1/2 h-full bg-cream p-6 sm:p-8 lg:p-10 xl:p-12 flex items-center justify-center relative overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {showBiometricPrompt ? (
              <div className="p-6 rounded-2xl border border-mint/40 bg-white/85 backdrop-blur-md text-center shadow-md animate-in fade-in-50 zoom-in-95">
                <div className="size-14 rounded-2xl bg-mint-pale text-forest mx-auto flex items-center justify-center mb-3.5 shadow-2xs">
                  <Fingerprint className="size-8 text-mint animate-pulse" />
                </div>
                <h3 className="text-xl font-serif font-bold text-forest mb-1.5">
                  Set Up Fingerprint Login?
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed max-w-sm mx-auto">
                  Enable 1-tap fingerprint sign-in on this device so you can access your business ledger instantly next time without typing passwords.
                </p>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    disabled={biometricLoading}
                    className="w-full bg-forest hover:bg-forest-light text-white font-semibold text-sm py-3 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {biometricLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-mint" />
                        Setting Up Biometrics...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="size-4 text-mint" />
                        Enable Fingerprint Login
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toast.info("You can enable fingerprint login anytime in Settings.");
                      router.push("/dashboard");
                      router.refresh();
                    }}
                    disabled={biometricLoading}
                    className="w-full bg-transparent hover:bg-sage/10 text-ink-muted hover:text-forest font-medium text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-5 text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest mb-1">Create an Account</h2>
                  <p className="text-ink-muted text-xs sm:text-sm">Enter your details to get started with VyaparSetu</p>
                </div>

                {error && (
                  <div className="mb-3.5 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 text-xs sm:text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-forest uppercase tracking-wider block" htmlFor="name">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        required
                        disabled={loading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-4 py-2.5 bg-white border border-sage/50 focus:border-mint focus:ring-2 focus:ring-mint-light rounded-xl text-sm font-medium text-forest transition-all outline-none shadow-xs placeholder:text-sage/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
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
                        className="w-full px-4 py-2.5 bg-white border border-sage/50 focus:border-mint focus:ring-2 focus:ring-mint-light rounded-xl text-sm font-medium text-forest transition-all outline-none shadow-xs placeholder:text-sage/70"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
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
                        className="w-full pl-4 pr-11 py-2.5 bg-white border border-sage/50 focus:border-mint focus:ring-2 focus:ring-mint-light rounded-xl text-sm font-medium text-forest transition-all outline-none shadow-xs placeholder:text-sage/70"
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
                    className="w-full bg-orange hover:bg-orange-hover text-white font-semibold text-sm sm:text-base py-2.5 sm:py-3 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Creating Account...
                      </>
                    ) : (
                      <>
                        Sign Up
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 sm:mt-5 text-center lg:text-left">
                  <p className="text-ink-muted text-xs sm:text-sm font-medium">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-forest hover:text-mint transition-colors underline decoration-mint/40 underline-offset-4">
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
