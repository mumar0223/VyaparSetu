# <img width="788" height="197" alt="VyaparSetu_redesign_darkbg" src="https://github.com/user-attachments/assets/c9a84f3a-07f7-4fdd-9846-9bc508ccd357" />


**AI-driven hyper-local business advisory and financial structuring assistant for rural micro-entrepreneurs.**

VyaparSetu helps rural traders, farmers, and micro-enterprises track income and expenses, structure informal records into bank-ready financial statements, check government credit scheme eligibility, and get AI-powered business advice.

This repository is a **two-service monorepo**:

```
VyaparSetu/
├── frontend/   Next.js 16 app — UI, auth, AI agent, its own Postgres DB
└── backend/    Express + TypeScript API — business/financial data, its own Postgres DB
```

---

## 1. Architecture overview

The diagram above shows the shape of the system. In words:

- **Browser / mobile client** — the only thing end users touch. Talks exclusively to the Next.js frontend.
- **Next.js frontend** (`/frontend`) — a full‑stack Next.js 16 (App Router) application. It:
  - Serves the landing page, login, and the authenticated dashboard (`app/app/...`).
  - Owns **its own Postgres database** (via Prisma, `frontend/prisma/schema.prisma`) for `User`, `Session`, `AuditLog`, `Conversation`/`ConversationMessage` (AI chat history), `Settings`, `PrivacyConsent`, and `Notification`. Auth is cookie/session based, implemented in `frontend/lib/auth-types.ts` and related lib code — not shared JWTs with the backend.
  - Contains the **autonomous AI agent** (`frontend/lib/agent/`) built on the Vercel AI SDK: a ReAct-style loop (`agent-executor.ts`) that calls out to a configurable LLM provider (`ai-provider.ts` — OpenAI, OpenAI-compatible gateways, or Google Vertex) and invokes domain tools (`tools.ts`, e.g. mandi price lookups, scheme-eligibility checks, web/GitHub search).
  - Calls the backend for all core financial data through typed API wrappers in `frontend/lib/api/*.ts` (`business.ts`, `transaction.ts`, `expense.ts`, `budget.ts`, `savings.ts`, `debt.ts`, `credit.ts`, `cashflow.ts`, `advisor.ts`, `schemes.ts`, `settings.ts`), all funneled through a single fetch wrapper `frontend/lib/api/client.ts`.
- **Express backend API** (`/backend`) — a REST API (`/api/v1/...`) built with Express + TypeScript + Prisma. It owns a **second Postgres database** (`backend/prisma/schema.prisma`) holding the actual business domain data: `User`, `Business`, `Transaction`, `Expense`, `SavingGoal`/`SavingContribution`, `Budget`/`BudgetItem`, `Debt`, `BusinessMilestone`, `Settings`, `PrivacyConsent`, `Notification`. Each domain has a `routes/ → controllers/ → services/` layering, documented via Swagger at `/api-docs`.
- **LLM provider** — an external service (OpenAI, an OpenAI-compatible gateway, or Google Vertex AI) that the frontend's AI agent calls; it is not part of this repo.

**Important architectural note:** the frontend and backend maintain two independent Postgres databases with overlapping (but not identical) schemas for `Business`, `Transaction`, `Expense`, etc. The frontend's copy of these models exists mainly so its Prisma client can type-check; the actual source of truth for business/financial records is the **backend** database, reached over HTTP. There is currently no shared authentication between the two services — the backend's user-scoped endpoints default to a placeholder `dev-user` unless a `userId` is explicitly passed, so treat the backend as a trusted-network internal service rather than a public API in its current state.

### Request flow example (e.g. viewing the dashboard)

1. User logs in on the frontend → frontend creates a `Session` row in its own DB and sets a cookie.
2. User opens `/app` → server component reads the session, renders the dashboard shell.
3. Dashboard client components call `frontend/lib/api/*` → `apiClient` → `Express backend` (`API_BASE_URL`, default `http://localhost:5000/api`).
4. Backend controller → service → Prisma → backend Postgres DB → JSON response back up the chain.
5. If the user opens the AI chat, the frontend's agent loop calls the configured LLM provider, optionally invoking tools, and persists the conversation in the frontend's own `Conversation`/`ConversationMessage` tables.

---

## 2. Tech stack

| Layer | Frontend | Backend |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | Express 4, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Motion, GSAP | — |
| Data | PostgreSQL (Neon) + Prisma 7 | PostgreSQL + Prisma 5 |
| Auth | Cookie/session-based, in-memory session cache | None built-in (dev-user placeholder) |
| AI | Vercel AI SDK (`ai`), `@ai-sdk/openai`, `@ai-sdk/google-vertex` | — |
| Docs | — | Swagger/OpenAPI at `/api-docs` |
| Testing | — | Jest + Supertest |
| File uploads | UploadThing | — |

---

## 3. Prerequisites     

- Node.js 20+ and npm
- Two PostgreSQL databases (can be two local databases, two Neon projects, or one Postgres server with two schemas/databases) — **frontend and backend must each get their own `DATABASE_URL`**
- An API key for at least one LLM provider (OpenAI, an OpenAI-compatible gateway, or Google Vertex) if you want the AI agent to work
- (Optional) An UploadThing token if you need file/media uploads

---

## 4. Setting up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vyaparsetu?schema=public"
JWT_SECRET="replace-with-a-strong-secret"
JWT_REFRESH_SECRET="replace-with-a-strong-secret"
PORT=3000
```

Run migrations and generate the Prisma client:

```bash
npx prisma migrate dev --name init
# or, for quick prototyping without migration history:
npx prisma db push
```

Start the API:

```bash
npm run dev        # ts-node/nodemon, auto-reload
# or
npm run build && npm start
```

- API base: `http://localhost:<PORT>/api/v1`
- Swagger docs: `http://localhost:<PORT>/api-docs`

Run the backend test suite:

```bash
npm test
```

> **Port note:** the backend's own `.env.example` defaults `PORT=3000`, but the frontend's API client defaults to `http://localhost:5000/api`. Pick one port and make sure both `backend/.env` (`PORT`) and `frontend/.env` (`NEXT_PUBLIC_API_URL`) agree — see step 5.

---

## 5. Setting up the frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
# Frontend's own database (separate from the backend's database)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require&channel_binding=require"

# Points at the backend API you started in step 4 — match its actual port
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"

# File uploads
UPLOADTHING_TOKEN=""

# LLM provider for the AI agent (OpenAI / OpenAI-compatible gateway)
OPENAI_API_KEY="your-api-key-here"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"

# Optional: Google Vertex AI instead of / alongside OpenAI
# GOOGLE_VERTEX_PROJECT=""
# GOOGLE_VERTEX_LOCATION="us-central1"
# GOOGLE_CLIENT_EMAIL=""
# GOOGLE_PRIVATE_KEY=""
```

Push the frontend's own Prisma schema to its database:

```bash
npx prisma db push
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:3000**.

---

## 6. Running both services together

You need two terminals (backend and frontend run as separate processes/ports):

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Make sure `frontend/.env`'s `NEXT_PUBLIC_API_URL` points at whatever port the backend actually started on (see the port note in step 4).

---

## 7. Using the app

1. Visit `http://localhost:3000`, create an account on the login page.
2. Fill in your business profile (`/app/profile/business`) — this is stored via the backend API.
3. Log transactions, expenses, savings goals, budgets, and debts from the respective dashboard pages (`/app/transactions`, `/app/expenses`, `/app/savings`, `/app/budget`, `/app/debt`).
4. Check `/app/cashflow`, `/app/credit`, and `/app/dashboard` for computed financial summaries.
5. Check `/app/schemes` / `/app/schemes-for-you` for government credit-scheme eligibility.
6. Use the AI advisor chat (`/app/advisor`) to ask business questions — this runs the ReAct agent loop against your configured LLM provider and can call domain tools (mandi rates, scheme eligibility, web/GitHub search).
7. Manage notifications, privacy consent, and settings under `/app/notifications`, `/app/privacy-consent`, and `/app/settings`.

### Testing the AI agent directly (no UI)

If a `frontend/scripts/test-agent.ts` script is present:

```bash
cd frontend
npx tsx scripts/test-agent.ts
```

This runs a simulated advisory session and prints the agent's tool calls and reasoning events (`INIT`, `AGENT_THOUGHT`, `TOOL_ACTIVE`, `TOOL_RESULT`, `COMPLETED`).

### Exploring the backend API directly

With the backend running, open `http://localhost:<PORT>/api-docs` for the full Swagger/OpenAPI reference, or hit endpoints directly, e.g.:

```bash
curl http://localhost:3000/api/v1/businesses
curl http://localhost:3000/api/v1/transactions
curl http://localhost:3000/api/v1/dashboard
```

---

## 8. Repository structure reference

```
backend/
├── prisma/schema.prisma        # Backend's data model (source of truth for business data)
└── src/
    ├── app.ts                  # Express app, middleware, route mounting
    ├── index.ts                # Server entrypoint
    ├── config/                 # env, prisma client, swagger config
    ├── routes/                 # one file per domain (business, transaction, expense, ...)
    ├── controllers/            # request/response handling per domain
    ├── services/                # business logic + Prisma queries per domain
    ├── middleware/              # error handling
    └── __tests__/                # Jest test suites per domain

frontend/
├── prisma/schema.prisma        # Frontend's data model (auth/session/chat + a mirrored business schema)
├── app/
│   ├── page.tsx, login/        # public landing + auth pages
│   └── app/                    # authenticated dashboard routes (one folder per feature)
├── components/                 # shared UI components (ui/, chat/)
├── lib/
│   ├── agent/                  # AI agent engine (executor, provider, tools, types)
│   ├── api/                    # typed fetch wrappers calling the backend REST API
│   ├── i18n/                   # English/Hindi dictionaries
│   └── auth-types.ts, store.ts, utils.ts
└── public/                     # static assets
```

---

## 9. Known gaps / things to verify before production use

- **No shared auth between services**: the backend does not currently verify a token from the frontend session; user-scoped endpoints fall back to a `dev-user` placeholder. Add authentication middleware (e.g. verifying the frontend's session or a shared JWT) before exposing the backend publicly.
- **Duplicated schema**: the frontend's Prisma schema re-declares `Business`, `Transaction`, `Expense`, etc. even though the backend is the real owner of that data — keep both schemas in sync manually if you change one, or consider removing the duplication and having the frontend read/write everything through the backend API only.
- **Port mismatch in the example env files**: reconcile `backend/.env`'s `PORT` with `frontend/.env`'s `NEXT_PUBLIC_API_URL` (see step 4).
- **Secrets**: replace all placeholder secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, API keys) before deploying anywhere beyond local development.
