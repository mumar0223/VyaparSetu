# VyaparSetu (व्यापारसेतु)

> **AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs**

VyaparSetu empowers rural traders, farmers, and micro-enterprises with vernacular voice & chat advisory, automated ledger-to-P&L structuring, real-time APMC mandi commodity intelligence, and instant government credit scheme qualification (PM Mudra, PM SVANidhi, Stand-Up India).

---

## 🌟 Key Features

- **Hyper-Local Vernacular Interface**: Speak or chat in regional dialects via WhatsApp, Voice IVR, or Web.
- **Autonomous AI Agent ReAct Loop**: Multi-turn reasoning engine powered by Vercel AI SDK with instant tool execution and real-time event streaming (`INIT`, `AGENT_THOUGHT`, `TOOL_ACTIVE`, `TOOL_RESULT`, `COMPLETED`, `ABORTED`).
- **Real-Time Mandi Pricing**: Live APMC market price tracking and arrival trends across commodities.
- **Automated Financial Structuring**: Converts informal sales records into bank-ready cash flow statements, P&L schedules, and credit scoring.
- **Instant Scheme Eligibility**: Evaluates micro-enterprise qualification for PM Mudra (Shishu, Kishore, Tarun), PM SVANidhi, and credit subsidy linkages.
- **High-Performance Architecture**: Neon PostgreSQL connection pooling, in-memory TTL session caching, and zero-fetch server layout auth.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Motion (Framer Motion) + GSAP ScrollTrigger
- **Database & ORM**: PostgreSQL (Neon Serverless) + Prisma ORM
- **AI & Agent Engine**: [Vercel AI SDK](https://sdk.vercel.ai/) (`@ai-sdk/openai`)
- **Authentication**: In-Memory Cached Session Token Auth + Secure HTTP-only Cookies
- **File & Media Storage**: UploadThing

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd my-app
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | Neon / PostgreSQL connection string |
| `UPLOADTHING_TOKEN` | UploadThing API token for media uploads |
| `OPENAI_API_KEY` | API Key for LLM provider (OpenAI / AWS Bedrock Mantle / OpenRouter) |
| `OPENAI_BASE_URL` | Base URL for LLM endpoint (e.g. `https://bedrock-mantle.us-east-1.api.aws/v1`) |
| `OPENAI_MODEL` | Target model ID (e.g. `deepseek.v3.2`, `gpt-4o`, `gpt-4o-mini`) |

### 3. Database Migration

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Autonomous AI Agents

You can test the autonomous ReAct tool-calling loop locally using the built-in TypeScript test script:

```bash
npx tsx scripts/test-agent.ts
```

This runs a simulated trade advisory session, tests dynamic tool dispatch (`getMandiRates`, `evaluateSchemeEligibility`), and outputs real-time execution events.

---

## 📁 Repository Structure

```
├── app/                  # Next.js App Router (Landing, Auth, Dashboard, API routes)
├── components/           # UI components, brand icons, and visual widgets
├── lib/
│   ├── agent/            # Autonomous AI Agent Engine (Vercel AI SDK Loop)
│   │   ├── agent-executor.ts # ReAct execution loop & stopping conditions
│   │   ├── ai-provider.ts    # Dynamic OpenAI/Bedrock model factory
│   │   ├── ai-models.ts      # Model catalog and metadata
│   │   ├── tools.ts          # Agent domain tools (Mandi, Schemes)
│   │   └── types.ts          # Agent state, lifecycle, and event interfaces
│   ├── auth.ts           # High-speed session cache & auth engine
│   └── prisma.ts         # Persistent DB connection pool
├── prisma/               # Database schema & migrations
├── public/               # Static assets & icons
└── scripts/              # AI Agent test scripts & automation tools
```

---

## 📜 License

This project is licensed under the MIT License.
