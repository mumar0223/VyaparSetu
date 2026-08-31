"use client";

import { motion, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Bot,
  Network,
  Code2,
  ShieldCheck,
  MessageSquare,
  Terminal,
  CheckCircle2,
  XCircle,
  FileCode2,
  Zap,
  Globe,
  BookOpen,
  TrendingUp,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Hyper-Local Voice & Chat Input",
    desc: "Speak or message in your regional language via WhatsApp or voice notes. VyaparSetu captures your daily turnover, inventory needs, and business challenges naturally.",
    icon: MessageSquare,
  },
  {
    title: "Intelligent Financial Structuring",
    desc: "Automatically converts informal transaction records, handwritten notes, and sales logs into structured cash-flow ledgers and bank-ready balance sheets.",
    icon: Code2,
  },
  {
    title: "Scheme & Credit Matching",
    desc: "Instantly checks eligibility across government credit programs (PM Mudra Yojana, PM SVANidhi, rural SHG loans) and pre-fills applications without middlemen.",
    icon: Bot,
  },
  {
    title: "Hyper-Local Market Advisory",
    desc: "Delivers real-time regional commodity price trends, wholesale supplier connections, and seasonal demand predictions to maximize profit margins.",
    icon: ShieldCheck,
  },
];

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(1440);
  const [visualScrollProgress, setVisualScrollProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const HOW_IT_WORKS_SCALE_CONSTANT = 0.0007;
  const calculatedHowItWorksScale = Math.min(
    1.15,
    Math.max(0.7, windowWidth * HOW_IT_WORKS_SCALE_CONSTANT),
  );
  // Shift leftward from 0px to -80px as screen width shrinks from 1440px to 1024px
  const calculatedHowItWorksTranslateX = Math.min(
    0,
    Math.max(-80, ((windowWidth - 1440) * 80) / (1440 - 1024)),
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !containerRef.current ||
      !cardRef.current
    )
      return;

    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const card = cardRef.current;

    // Reset styles on mount/resize
    gsap.set(card, { clearProps: "all" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        pin: stickyRef.current,
        anticipatePin: 1,
      },
    });

    // 1. Expand the card first (use 100% instead of 100vw to prevent scrollbar overflow)
    tl.to(card, {
      width: "100%",
      maxWidth: "100%",
      height: "100vh",
      borderRadius: "0px",
      borderColor: "transparent",
      padding: window.innerWidth > 768 ? "4rem 6rem" : "1.5rem",
      duration: 1.5,
      ease: "power1.inOut",
    });

    // 2. Animate step progress index and connection lines inside
    const progressObj = { value: 0 };
    tl.to(progressObj, {
      value: 1,
      duration: 3.5,
      ease: "none",
      onUpdate: () => {
        setVisualScrollProgress(progressObj.value);
        const idx = Math.min(
          Math.floor(progressObj.value * steps.length),
          steps.length - 1,
        );
        setActiveIndex(idx);
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative h-[300vh] bg-background overflow-x-clip max-w-full"
    >
      <div
        ref={stickyRef}
        className="w-full h-screen flex flex-col items-center justify-center overflow-hidden max-w-full"
      >
        {/* Main Card Container */}
        <div
          ref={cardRef}
          className="w-[92%] max-w-350 h-[85vh] border border-mint/20 bg-[#081710]/95 backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 flex flex-col shadow-2xl relative overflow-hidden shrink-0"
        >
          {/* Subtle bg glow inside card */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(74,222,128,0.12),transparent_50%)] pointer-events-none" />

          <div className="my-4 md:my-10 shrink-0">
            <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-white">
              <span className="text-mint">How</span> it works
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 flex-1 min-h-0 relative z-10">
            {/* Left: Steps Timeline */}
            <div className="w-full lg:w-5/12 flex flex-col justify-center relative min-h-0">
              {steps.map((step, i) => {
                const isActive = i === activeIndex;
                const isPassed = i < activeIndex;

                return (
                  <div
                    key={i}
                    className={`flex gap-4 md:gap-6 relative transition-all duration-500 py-3 md:py-6
                      ${isActive ? "opacity-100 z-20" : isPassed ? "opacity-50 z-10" : "opacity-30 z-10"}`}
                  >
                    {i !== steps.length - 1 && (
                      <StepLine
                        i={i}
                        visualScrollProgress={visualScrollProgress}
                        totalSteps={steps.length}
                      />
                    )}
                    <div className="relative flex flex-col items-center shrink-0 z-20">
                      <div
                        className={`size-8 md:size-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 border-2 text-sm md:text-base relative bg-[#081710]
                        ${
                          isActive
                            ? "border-mint text-mint shadow-[0_0_15px_rgba(74,222,128,0.4)]"
                            : isPassed
                              ? "border-mint/60 text-mint-light"
                              : "border-white/20 text-white/50"
                        }`}
                      >
                        {i + 1}
                      </div>
                    </div>
                    <div className="pt-1">
                      <h4 className="text-base md:text-xl font-bold mb-1 md:mb-2 text-white">
                        {step.title}
                      </h4>
                      <div
                        className={`grid transition-all duration-500 ease-in-out ${isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                      >
                        <p className="text-white/60 leading-relaxed text-[11px] md:text-sm overflow-hidden">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Dynamic Visualizer */}
            <div
              className="hidden lg:flex w-full lg:w-7/12 h-full items-center justify-center relative"
              style={{
                transform: `translateX(${calculatedHowItWorksTranslateX}px)`,
              }}
            >
              <AnimatePresence mode="wait">
                {activeIndex === 0 && (
                  <motion.div
                    key="step1"
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: calculatedHowItWorksScale,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      backgroundColor: { duration: 0 },
                      borderColor: { duration: 0 },
                      color: { duration: 0 },
                    }}
                    className="w-full h-100 relative origin-center"
                  >
                    {/* Step 1: AI connected to Apps */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Step1Visualizer />
                    </div>
                  </motion.div>
                )}

                {activeIndex === 1 && (
                  <motion.div
                    key="step2"
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: calculatedHowItWorksScale,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      backgroundColor: { duration: 0 },
                      borderColor: { duration: 0 },
                      color: { duration: 0 },
                    }}
                    className="w-full max-w-lg mx-auto origin-center"
                  >
                    <Step2Visualizer />
                  </motion.div>
                )}

                {activeIndex === 2 && (
                  <motion.div
                    key="step3"
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: calculatedHowItWorksScale,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      backgroundColor: { duration: 0 },
                      borderColor: { duration: 0 },
                      color: { duration: 0 },
                    }}
                    className="w-full max-w-lg mx-auto origin-center"
                  >
                    {/* Step 3: Terminal Compile */}
                    <div className="border border-white/10 rounded-2xl bg-[#050505] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] font-mono text-sm relative">
                      <div className="h-10 bg-white/5 flex items-center px-4 border-b border-white/10">
                        <span className="text-white/40 text-xs flex items-center gap-2">
                          <Terminal className="size-3" /> Scheme Verification Terminal
                        </span>
                      </div>
                      <div className="p-6 space-y-3 text-white/70 h-75">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1, color: { duration: 0 } }}
                        >
                          <span className="text-indigo-400">➜</span>{" "}
                          <span className="text-white">vyaparsetu</span> verify-schemes --profile micro
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4, color: { duration: 0 } }}
                        >
                          &gt; Scanning PM Mudra &amp; SVANidhi criteria...
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7, color: { duration: 0 } }}
                          className="text-amber-400"
                        >
                          Missing formal balance sheet.
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8, color: { duration: 0 } }}
                          className="text-amber-400/80 text-xs"
                        >
                          ./ledgers/annual-khata.json
                          <br />
                          Resolving: Auto-formatting unstructured ledger data...
                        </motion.p>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: 1.5,
                            backgroundColor: { duration: 0 },
                            borderColor: { duration: 0 },
                            color: { duration: 0 },
                          }}
                          className="mt-4 pt-4 border-t border-white/10"
                        >
                          <div className="flex items-center gap-2 text-indigo-300 text-xs mb-2">
                            <Zap className="size-3" /> Financial Structuring Engine
                          </div>
                          <p className="text-white/50 text-xs">
                            Generating bank-ready P&amp;L schedule and score (780/900)...
                          </p>
                        </motion.div>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 2.5, color: { duration: 0 } }}
                          className="text-green-400 mt-2"
                        >
                          ✓ PM Mudra &amp; SVANidhi pre-qualification verified.
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeIndex === 3 && (
                  <motion.div
                    key="step4"
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: calculatedHowItWorksScale,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                      scale: calculatedHowItWorksScale * 0.95,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      backgroundColor: { duration: 0 },
                      borderColor: { duration: 0 },
                      color: { duration: 0 },
                    }}
                    className="w-full max-w-lg mx-auto flex items-center justify-center relative h-100 origin-center"
                  >
                    <Step4Visualizer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepLine({
  i,
  visualScrollProgress,
  totalSteps,
}: {
  i: number;
  visualScrollProgress: number;
  totalSteps: number;
}) {
  const start = i / totalSteps;
  const end = (i + 1) / totalSteps;
  const progress = Math.min(
    1,
    Math.max(0, (visualScrollProgress - start) / (end - start)),
  );

  return (
    <div className="absolute top-7 md:top-11 h-full left-3.75 md:left-4.75 w-0.5 bg-white/10 z-0">
      <div
        className="w-full bg-mint shadow-[0_0_10px_rgba(74,222,128,0.8)] origin-top transition-all duration-75"
        style={{ height: `${progress * 100}%` }}
      />
    </div>
  );
}

function Step2Visualizer() {
  return (
    <div className="w-full max-w-lg mx-auto bg-[#080808]/40 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-sm grid grid-cols-2 gap-4 h-80 overflow-hidden">
      {/* Left Column: AI Chat Interface */}
      <div className="flex flex-col border border-white/5 rounded-xl bg-[#080808]/90 overflow-hidden h-full">
        {/* Chat Header */}
        <div className="h-9 border-b border-white/5 bg-white/2 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-mint animate-pulse" />
            <span className="text-[10px] font-bold text-white/80 tracking-wide">
              Khata Copilot
            </span>
          </div>
          <span className="text-[8px] font-mono text-white/40 uppercase">
            Structuring Active
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto text-[10px]">
          {/* User Message */}
          <div className="self-end max-w-[90%] bg-mint/20 border border-mint/30 text-mint-light px-2.5 py-1.5 rounded-xl rounded-tr-none">
            <p className="font-sans leading-normal">
              "Record ₹18,450 sales &amp; generate P&amp;L"
            </p>
          </div>

          {/* AI Response */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.5,
              backgroundColor: { duration: 0 },
              borderColor: { duration: 0 },
              color: { duration: 0 },
            }}
            className="self-start max-w-[90%] bg-white/5 border border-white/10 text-white/80 px-2.5 py-1.5 rounded-xl rounded-tl-none flex flex-col gap-1"
          >
            <p className="font-sans leading-normal">
              Structuring cash flow into <b>statement.pdf</b>...
            </p>
            {/* Fake progress bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
              <motion.div
                className="h-full bg-mint"
                animate={{ width: ["0%", "100%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  backgroundColor: { duration: 0 },
                  color: { duration: 0 },
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Sandbox Preview & Editor */}
      <div className="flex flex-col border border-white/5 rounded-xl bg-[#080808]/90 overflow-hidden h-full relative">
        {/* Sandbox Browser Header */}
        <div className="h-9 border-b border-white/5 bg-white/2 flex items-center px-3 gap-1.5">
          <div className="flex gap-1">
            <div className="size-1.5 rounded-full bg-red-500/60" />
            <div className="size-1.5 rounded-full bg-yellow-500/60" />
            <div className="size-1.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="ml-2 flex-1 bg-black/60 rounded px-2 py-0.5 border border-white/5 text-[8px] text-white/40 text-center truncate">
            khata-statement.pdf
          </div>
        </div>

        {/* Sandbox Content Area */}
        <div className="flex-1 p-3 flex flex-col justify-between relative bg-black/30">
          {/* Mini Rendered Statement */}
          <div className="border border-white/5 rounded-lg bg-black/40 p-2 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center opacity-40">
              <div className="w-10 h-1.5 bg-white rounded-full" />
              <div className="size-3 bg-white/10 rounded-full" />
            </div>

            {/* Hero Text */}
            <div className="space-y-1.5 my-2">
              <div className="w-3/4 h-2 bg-white/10 rounded-full" />
              <div className="w-1/2 h-1.5 bg-white/5 rounded-full" />
            </div>

            {/* Target Button */}
            <div className="flex justify-center mt-2">
              <motion.div
                animate={{
                  backgroundColor: [
                    "rgba(255,255,255,0.1)",
                    "rgba(99,102,241,0.8)",
                    "rgba(255,255,255,0.1)",
                  ],
                  boxShadow: ["none", "0 0 12px rgba(99,102,241,0.6)", "none"],
                }}
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  borderColor: { duration: 0 },
                  color: { duration: 0 },
                }}
                className="px-6 py-2 rounded-lg text-[8px] font-bold text-white tracking-wide"
              >
                P&amp;L Score: 780/900
              </motion.div>
            </div>
          </div>

          {/* Overlapping Editor Code Popup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 1,
              backgroundColor: { duration: 0 },
              borderColor: { duration: 0 },
              color: { duration: 0 },
            }}
            className="absolute right-1 bottom-1 p-2 bg-[#050505] border border-white/10 rounded-lg shadow-xl font-mono text-[7px] w-28 text-white/80 leading-normal"
          >
            <div className="text-white/40 border-b border-white/5 pb-1 mb-1 font-sans flex items-center gap-1">
              <FileCode2 className="size-2 text-indigo-400" />
              <span>ledger.json</span>
            </div>
            <p className="text-pink-400">&lt;CashFlow&gt;</p>
            <p className="text-indigo-300 pl-2">sales: ₹18,450</p>
            <p className="text-emerald-400 pl-2">margin: +61%</p>
            <p className="text-pink-400">&lt;/CashFlow&gt;</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Step4Visualizer() {
  return (
    <div className="w-full max-w-lg mx-auto flex items-center justify-center relative h-95 overflow-hidden">
      {/* Sleek Dark Mobile Frame */}
      <div className="w-50 h-85 border-4 border-[#1f1f1f] rounded-[2rem] bg-[#050505] relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col justify-between">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#1f1f1f] rounded-b-xl z-20" />

        {/* Screen Content */}
        <div className="flex-1 flex flex-col justify-between pt-6 p-3 relative">
          {/* Mock App Page Render */}
          <div className="flex-1 border border-white/5 rounded-xl bg-black/40 p-2.5 flex flex-col justify-between relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center opacity-40">
              <div className="w-8 h-1.5 bg-white rounded-full" />
              <div className="size-3 bg-white/10 rounded-full" />
            </div>

            {/* Core Body */}
            <div className="my-auto space-y-2 text-center py-2 relative z-10">
              <div className="w-5/6 h-2.5 bg-white/10 rounded-full mx-auto" />
              <div className="w-2/3 h-2 bg-white/5 rounded-full mx-auto" />

              {/* Glowing Button preview */}
              <div className="w-22 h-6 bg-forest rounded-md mx-auto flex items-center justify-center text-[7px] font-bold text-white shadow-[0_0_15px_rgba(74,222,128,0.4)] border border-mint/30 mt-4 relative">
                Mandi Price Alert
                {/* Glowing Comment Pin drop right on the button */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    backgroundColor: { duration: 0 },
                    borderColor: { duration: 0 },
                    color: { duration: 0 },
                  }}
                  className="absolute -top-1.5 -right-1.5 size-4 bg-orange rounded-full border border-white flex items-center justify-center text-[7px] font-black text-white shadow-lg"
                >
                  1
                </motion.div>
              </div>
            </div>

            {/* Comment Popover Speech Bubble tooltip */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.8,
                backgroundColor: { duration: 0 },
                borderColor: { duration: 0 },
                color: { duration: 0 },
              }}
              className="absolute left-2.5 top-[28%] right-2.5 p-2 bg-[#064e3b]/90 border border-mint/40 rounded-xl shadow-xl z-20 backdrop-blur-md"
            >
              <div className="flex gap-1.5 items-start">
                <MessageSquare className="size-2.5 text-mint shrink-0 mt-0.5" />
                <p className="text-[7px] text-mint-light leading-normal font-sans">
                  "Wholesale Alert: Save 12% on crates with nearby cluster"
                </p>
              </div>
              {/* Arrow */}
              <div className="absolute -bottom-1 left-[62%] -translate-x-1/2 size-2 bg-[#064e3b] border-r border-b border-mint/40 rotate-45" />
            </motion.div>
          </div>

          {/* Bottom Review Controls Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.4,
              backgroundColor: { duration: 0 },
              borderColor: { duration: 0 },
              color: { duration: 0 },
            }}
            className="mt-2.5 p-2 bg-[#0d0d0d] border border-white/10 rounded-xl shadow-xl flex flex-col gap-1.5"
          >
            <span className="text-[7px] text-white/50 tracking-wider uppercase font-semibold text-center block">
              Advisory Actions
            </span>

            <div className="flex gap-1.5 justify-center">
              {/* Reject */}
              <button className="flex-1 flex items-center justify-center gap-1 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md text-red-400 text-[8px] font-semibold transition-colors">
                <XCircle className="size-2.5" /> Dismiss
              </button>
              {/* Approve */}
              <button className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md text-emerald-400 text-[8px] font-semibold transition-colors">
                <CheckCircle2 className="size-2.5" /> Join Order
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Step1Visualizer() {
  const [promptCycle, setPromptCycle] = useState(0); // 0, 1, 2
  const [subStep, setSubStep] = useState(0); // 0 (Prompt->AI), 1 (AI->Hub), 2 (Hub->AI->Chat), 3 (Success Notification)

  useEffect(() => {
    const subStepInterval = setInterval(() => {
      setSubStep((prev) => {
        if (prev === 3) {
          setPromptCycle((c) => (c + 1) % 3);
          return 0;
        }
        return prev + 1;
      });
    }, 1500); // 1.5s per animation phase

    return () => clearInterval(subStepInterval);
  }, []);

  const prompts = [
    { text: "Aaj mandi mein 5 quintal pyaaz becha ₹1,850 par", target: "site" },
    { text: "Check PM Mudra loan eligibility", target: "social" },
    { text: "Record sales & check tomorrow's mandi rate", target: "both" },
  ];

  const currentPrompt = prompts[promptCycle];

  return (
    <div className="relative w-full max-w-110 aspect-square flex items-center justify-center">
      {/* SVG Connections */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
      >
        {/* Static Background Lines */}
        <g stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" fill="none">
          <path d="M 200 340 L 200 200" />
          <path d="M 60 200 L 200 200" />
          <path d="M 100 80 L 200 200" />
          <path d="M 300 80 L 200 200" />
        </g>

        {/* Animated Pulses */}
        {/* 1. Prompt to AI (Blue) */}
        <motion.path
          d="M 200 340 L 200 200"
          stroke="#6366f1"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={subStep === 0 ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
        />

        {/* 2. AI to Site Hub (Blue) */}
        <motion.path
          d="M 200 200 L 100 80"
          stroke="#6366f1"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={
            subStep === 1 &&
            (currentPrompt.target === "site" || currentPrompt.target === "both")
              ? { pathLength: 1 }
              : { pathLength: 0 }
          }
          transition={{ duration: 1.0, ease: "easeInOut" }}
        />

        {/* 3. AI to Social Hub (Blue) */}
        <motion.path
          d="M 200 200 L 300 80"
          stroke="#6366f1"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={
            subStep === 1 &&
            (currentPrompt.target === "social" ||
              currentPrompt.target === "both")
              ? { pathLength: 1 }
              : { pathLength: 0 }
          }
          transition={{ duration: 1.0, ease: "easeInOut" }}
        />

        {/* 4. Return Site Hub -> AI (Green) */}
        <motion.path
          d="M 100 80 L 200 200"
          stroke="#10b981"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={
            subStep === 2 &&
            (currentPrompt.target === "site" || currentPrompt.target === "both")
              ? { pathLength: 1 }
              : { pathLength: 0 }
          }
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* 5. Return Social Hub -> AI (Green) */}
        <motion.path
          d="M 300 80 L 200 200"
          stroke="#10b981"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={
            subStep === 2 &&
            (currentPrompt.target === "social" ||
              currentPrompt.target === "both")
              ? { pathLength: 1 }
              : { pathLength: 0 }
          }
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {/* 6. Return AI -> Chat Hub (Green) */}
        <motion.path
          d="M 200 200 L 60 200"
          stroke="#10b981"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={subStep === 2 ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
        />
      </svg>

      {/* Nodes */}
      {/* 1. Center AI Model */}
      <div
        className={cn(
          "absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-mint/10 border border-mint/30 rounded-2xl flex items-center justify-center backdrop-blur-sm z-10 transition-all duration-500",
          subStep === 1 &&
            "border-mint shadow-[0_0_25px_rgba(74,222,128,0.5)] scale-105",
        )}
      >
        <Bot className="size-8 text-mint" />
      </div>

      {/* 2. Prompt Card (Bottom) */}
      <div className="absolute top-[85%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-2.5 bg-mint/10 border border-mint/30 rounded-xl shadow-xl backdrop-blur-sm whitespace-nowrap min-w-37.5 text-center">
        <span className="text-[9px] text-mint font-semibold block mb-0.5 uppercase tracking-wider">
          Prompt Input
        </span>
        <AnimatePresence mode="wait">
          <motion.p
            key={promptCycle}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3, color: { duration: 0 } }}
            className="text-[10px] text-mint-light font-medium font-mono"
          >
            "{currentPrompt.text}"
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 3. Chat Hub (Left) */}
      <div
        className={cn(
          "absolute top-[50%] left-[15%] -translate-x-1/2 -translate-y-1/2 p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-xl backdrop-blur-sm transition-all duration-500",
          subStep === 3 &&
            "border-mint shadow-[0_0_20px_rgba(74,222,128,0.5)] bg-mint/10",
        )}
      >
        <div className="flex gap-1.5 relative">
          <MessageSquare className="size-4 text-[#25D366]" />
          <div className="size-4 bg-forest rounded-md flex items-center justify-center text-[8px] font-bold text-white">
            S
          </div>

          {/* Notification Badge */}
          {subStep === 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                backgroundColor: { duration: 0 },
                borderColor: { duration: 0 },
                color: { duration: 0 },
              }}
              className="absolute -top-4 -right-4 size-4.5 bg-mint rounded-full flex items-center justify-center border border-[#081710]"
            >
              <svg
                className="size-2.5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </div>

      {/* 4. Khata Hub (Top Left) */}
      <div
        className={cn(
          "absolute top-[20%] left-[25%] -translate-x-1/2 -translate-y-1/2 p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-xl backdrop-blur-sm transition-all duration-500",
          subStep === 1 &&
            (currentPrompt.target === "site" ||
              currentPrompt.target === "both") &&
            "border-mint shadow-[0_0_20px_rgba(74,222,128,0.4)] bg-mint/10",
          subStep === 2 &&
            (currentPrompt.target === "site" ||
              currentPrompt.target === "both") &&
            "border-mint bg-mint/5",
        )}
      >
        <div className="flex items-center gap-1.5">
          <BookOpen className="size-4 text-mint" />
          <span className="text-[8.5px] font-mono text-white/80">Khata Hub</span>
        </div>
      </div>

      {/* 5. Mandi & Scheme Hub (Top Right) */}
      <div
        className={cn(
          "absolute top-[20%] left-[75%] -translate-x-1/2 -translate-y-1/2 p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-xl backdrop-blur-sm transition-all duration-500",
          subStep === 1 &&
            (currentPrompt.target === "social" ||
              currentPrompt.target === "both") &&
            "border-orange shadow-[0_0_20px_rgba(217,142,42,0.4)] bg-orange/10",
          subStep === 2 &&
            (currentPrompt.target === "social" ||
              currentPrompt.target === "both") &&
            "border-mint bg-mint/5",
        )}
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-4 text-orange" />
          <span className="text-[8.5px] font-mono text-white/80">Mandi Hub</span>
        </div>
      </div>
    </div>
  );
}
