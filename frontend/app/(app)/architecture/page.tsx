import {
  Workflow,
  Mic,
  Cpu,
  Database,
  ShieldCheck,
  Zap,
  Server,
  Layers,
  Radio,
  FileCode,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function ArchitecturePage() {
  const architectureTiers = [
    {
      title: "1. User Input & Client Modalities",
      icon: Mic,
      badge: "Input Layer",
      color: "from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-400",
      details: [
        "16kHz Linear PCM Little-Endian microphone capture via PCMRecorder",
        "Zero-latency browser Web Speech STT interim captioning",
        "Multilingual input in 10 Indian vernacular languages & Hinglish",
        "UploadThing secure S3 pipeline for receipts, khata bills, and KYC documents",
      ],
    },
    {
      title: "2. Next.js 16 App Router & Gateway",
      icon: Server,
      badge: "Gateway Layer",
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400",
      details: [
        "Dynamic SSE stream handler (/api/chat/stream) with 25-turn context window",
        "Vertex Live Session gateway (/api/voice/session) minting OAuth2 tokens",
        "Live WebSocket tool execution dispatcher (/api/voice/execute-tool)",
        "PBKDF2 100k iters hashing & <0.01ms in-memory TTL session caching",
      ],
    },
    {
      title: "3. Dual AI Engine & Multimodal Mesh",
      icon: Cpu,
      badge: "AI Core",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      details: [
        "Google Vertex AI Live Bidi WebSocket (gemini-live-2.5-flash) for instant voice",
        "Vercel AI SDK ReAct autonomous reasoning engine (agent-executor.ts)",
        "AWS Bedrock Mantle / Kimi K2.5 OpenAI-compatible endpoint with tool schema interceptor",
        "Real-time server-side VAD and instant gapless 24kHz Web Audio timeline playback",
      ],
    },
    {
      title: "4. VyaparSetu Remote Services & Tools",
      icon: Layers,
      badge: "Service Mesh",
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
      details: [
        "getMandiRates: Real-time APMC mandi modal rates, arrivals, & trend signals",
        "evaluateSchemeEligibility: PM Mudra, PM SVANidhi, & Stand-Up India rules",
        "Financial Structuring & Ledger: Automated cashflow P&L statements & Khata balance",
        "Dynamic Artifact Generator: On-the-fly editable loan applications & DPR reports",
      ],
    },
    {
      title: "5. Database & Persistence Layer",
      icon: Database,
      badge: "Storage Layer",
      color: "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400",
      details: [
        "Neon Serverless PostgreSQL with @prisma/adapter-pg connection pooling",
        "User, Session, Conversation, ConversationMessage, and Artifact models",
        "JSON-structured thinking chains and tool invocation traces",
        "Immutable AuditLog for security, loan submissions, and financial actions",
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="p-6 md:p-8 rounded-2xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Workflow className="size-7 text-primary" /> VyaparSetu Master Architecture
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              End-to-End System Topology: Multimodal Live Voice OS, AWS Bedrock Mantle ReAct Engine, Next.js 16 Gateway, and Neon PostgreSQL.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Radio className="size-3 animate-pulse" /> Live WSS Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="size-3" /> ReAct Agent Enabled
            </span>
          </div>
        </div>

        {/* Architecture Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {architectureTiers.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl border bg-card/60 backdrop-blur-sm flex flex-col justify-between transition-all hover:border-primary/40 ${
                  idx === 0 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${tier.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-foreground mb-3">{tier.title}</h3>
                  <ul className="space-y-2">
                    {tier.details.map((detail, dIdx) => (
                      <li key={dIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Documentation Banner */}
        <div className="p-6 rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-card to-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <FileCode className="size-6" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Full Mermaid Architecture Specifications</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete technical diagrams and specifications are available in the root <code className="px-1.5 py-0.5 bg-muted rounded text-primary">architecture/</code> directory.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
