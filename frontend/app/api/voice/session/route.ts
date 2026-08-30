import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIVE_VOICE_AGENT_CONFIG } from "@/lib/agent/chat-config";
import { GoogleAuth } from "google-auth-library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleVoiceSession(req);
}

export async function GET(req: NextRequest) {
  return handleVoiceSession(req);
}

async function handleVoiceSession(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const project = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!project || !clientEmail || !privateKey) {
      return NextResponse.json(
        {
          error:
            "Vertex AI credentials are incomplete. Configure GOOGLE_VERTEX_PROJECT, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY.",
        },
        { status: 500 },
      );
    }

    // Unescape \n in the private key
    privateKey = privateKey.replace(/\\n/g, "\n");

    // Generate short-lived Google OAuth2 access token for Vertex AI Live
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse?.token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to generate Vertex AI access token." },
        { status: 500 },
      );
    }

    const body =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const conversationId =
      body.conversationId ||
      new URL(req.url).searchParams.get("conversationId") ||
      undefined;
    const modelId = (LIVE_VOICE_AGENT_CONFIG.model || "gemini-live-2.5-flash")
      .replace(/^models\//, "")
      .replace(
        /^projects\/[^/]+\/locations\/[^/]+\/publishers\/google\/models\//,
        "",
      );
    const model = `projects/${project}/locations/${location}/publishers/google/models/${modelId}`;

    let systemInstruction = `You are VyaparSetu Voice (व्यापारसेतु), a male AI business advisor and trade partner for Indian micro-enterprises, shopkeepers, traders, and farmers.

MALE PERSONA & GRAMMAR RULES:
1. You are strictly a male persona. In all Indian languages (Hindi, Marathi, Bengali, Punjabi, Gujarati, etc.), always use masculine self-referential verb inflections, pronouns, and adjectives (e.g. in Hindi: "मैं करूँगा", "बता सकता हूँ", "मैं समझता हूँ", never use feminine forms like "करूँगी" or "सकती हूँ").
2. In English, maintain a warm, confident, professional male advisor tone.

MULTILINGUAL SUPPORT (10 Indian Languages):
1. You natively understand and speak: Hindi (हिन्दी), English (India), Bengali (বাংলা), Marathi (मराठी), Telugu (తెలుగు), Tamil (தமிழ்), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), and Punjabi (ਪੰਜਾਬੀ), including Hinglish and colloquial regional business terminology.
2. Always respond directly in the language spoken by the user (or the language the user asks for).
3. Keep spoken replies concise, clear, natural, and respectful. Never read out hidden reasoning.
4. When the user asks for APMC commodity mandi prices, market trends, loan credit schemes (PM Mudra, PM SVANidhi, PMEGP), budgets, expenses, or debt records, execute the relevant tool immediately (e.g. getMandiRates, getBudgets, getExpenses, getGovtSchemes) and speak the key findings naturally.
5. When creating a budget, logging an expense, adding a transaction, or creating a goal, ALWAYS call the corresponding stage tool (stageBudget, stageExpense, stageTransaction, stageSavingsGoal, stageDebt) so an interactive draft artifact is generated for the user on screen.
6. When the user asks for a visual graph, chart, plot, or trend visualization, ALWAYS call stageChart with chartType ('bar', 'line', 'area', 'pie'), title, xAxisKey, data array of points, and series.
7. When the user asks for market news, trade circulars, or web search, execute the webSearch tool.`;

    if (conversationId) {
      const history = await prisma.conversationMessage.findMany({
        where: { conversationId, conversation: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { role: true, content: true },
      });
      if (history.length) {
        systemInstruction += `\n\nConversation context:\n${history
          .reverse()
          .map(
            (message) =>
              `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`,
          )
          .join("\n")}`;
      }
    }

    const tools = [
      {
        functionDeclarations: [
          {
            name: "getMandiRates",
            description:
              "Fetches live wholesale APMC market prices, arrivals, and modal rates from data.gov.in / Agmarknet.",
            parameters: {
              type: "OBJECT",
              properties: {
                commodity: {
                  type: "STRING",
                  description:
                    "Crop or commodity, e.g. Onion, Wheat, Cotton, Tomato",
                },
                state: {
                  type: "STRING",
                  description:
                    "Optional State e.g. Maharashtra, Madhya Pradesh, Gujarat",
                },
                district: {
                  type: "STRING",
                  description: "Optional District e.g. Nashik, Indore, Pune",
                },
                market: {
                  type: "STRING",
                  description: "Optional APMC market e.g. Lasalgaon, Azadpur",
                },
              },
              required: ["commodity"],
            },
          },
          {
            name: "getBudgets",
            description:
              "Retrieves active budgets and department allocations from the enterprise database.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "getExpenses",
            description:
              "Retrieves logged expenses, payment methods, and category sums.",
            parameters: {
              type: "OBJECT",
              properties: {
                category: {
                  type: "STRING",
                  description: "Optional category filter",
                },
                limit: {
                  type: "NUMBER",
                  description: "Number of records to fetch",
                },
              },
            },
          },
          {
            name: "getTransactions",
            description: "Retrieves master ledger transactions.",
            parameters: {
              type: "OBJECT",
              properties: {
                type: {
                  type: "STRING",
                  description:
                    "Optional filter: INCOME, EXPENSE, TRANSFER, DEBT_PAYMENT",
                },
              },
            },
          },
          {
            name: "getSavingsGoals",
            description:
              "Retrieves active savings targets and accumulated funds.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "getDebts",
            description:
              "Retrieves active loans, lenders, interest rates, and EMIs.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "getBusinessProfile",
            description:
              "Retrieves enterprise profile, category, location, and turnover.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "getGovtSchemes",
            description:
              "Evaluates qualification for government subsidy schemes (PM Mudra, PM SVANidhi, PMEGP).",
            parameters: {
              type: "OBJECT",
              properties: {
                schemeName: {
                  type: "STRING",
                  description: "PM_MUDRA, PM_SVANIDHI, PMEGP, STAND_UP_INDIA",
                },
              },
              required: ["schemeName"],
            },
          },
          {
            name: "stageBudget",
            description:
              "Stages an interactive draft budget plan with category allocations for user review.",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "Budget title" },
                period: {
                  type: "STRING",
                  description: "Monthly, Quarterly, Annual, Weekly",
                },
                totalAmount: {
                  type: "NUMBER",
                  description: "Total budget limit in INR",
                },
                items: {
                  type: "ARRAY",
                  description:
                    "List of allocations with category and allocatedAmount",
                  items: {
                    type: "OBJECT",
                    properties: {
                      category: { type: "STRING" },
                      allocatedAmount: { type: "NUMBER" },
                    },
                    required: ["category", "allocatedAmount"],
                  },
                },
              },
              required: ["name", "totalAmount", "items"],
            },
          },
          {
            name: "stageExpense",
            description:
              "Stages an interactive draft expense entry for user review and approval.",
            parameters: {
              type: "OBJECT",
              properties: {
                category: { type: "STRING", description: "Expense category" },
                amount: { type: "NUMBER", description: "Amount in INR" },
                vendor: { type: "STRING", description: "Vendor name" },
                paymentMethod: {
                  type: "STRING",
                  description: "UPI, CASH, BANK_TRANSFER",
                },
                description: { type: "STRING", description: "Description" },
              },
              required: ["category", "amount"],
            },
          },
          {
            name: "stageTransaction",
            description:
              "Stages a master ledger transaction draft for user review.",
            parameters: {
              type: "OBJECT",
              properties: {
                type: {
                  type: "STRING",
                  description: "INCOME, EXPENSE, TRANSFER, DEBT_PAYMENT",
                },
                amount: { type: "NUMBER", description: "Amount in INR" },
                category: { type: "STRING", description: "Category" },
                description: { type: "STRING", description: "Description" },
              },
              required: ["type", "amount"],
            },
          },
          {
            name: "stageSavingsGoal",
            description: "Stages a savings goal target for user review.",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "Goal name" },
                targetAmount: {
                  type: "NUMBER",
                  description: "Target amount in INR",
                },
                targetDate: {
                  type: "STRING",
                  description: "Target date YYYY-MM-DD",
                },
              },
              required: ["name", "targetAmount"],
            },
          },
          {
            name: "stageDebt",
            description: "Stages a loan/debt liability record for user review.",
            parameters: {
              type: "OBJECT",
              properties: {
                lender: {
                  type: "STRING",
                  description: "Lender bank or organization",
                },
                totalAmount: {
                  type: "NUMBER",
                  description: "Total loan amount",
                },
                amountOutStanding: {
                  type: "NUMBER",
                  description: "Outstanding balance",
                },
                interestRate: {
                  type: "NUMBER",
                  description: "Annual interest rate %",
                },
                emiAmount: {
                  type: "NUMBER",
                  description: "Monthly EMI in INR",
                },
              },
              required: ["lender", "amountOutStanding"],
            },
          },
          {
            name: "webSearch",
            description:
              "Searches the live web for trade regulations, market policies, RBI circulars, commodity updates, and tax guidelines.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: { type: "STRING", description: "Search query" },
                numResults: {
                  type: "NUMBER",
                  description: "Number of results",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "stageChart",
            description:
              "Generates an interactive visual chart or graph (bar, line, area, pie) as an artifact for financial metrics, mandi trends, or revenue.",
            parameters: {
              type: "OBJECT",
              properties: {
                chartType: {
                  type: "STRING",
                  description: "bar, line, area, or pie",
                },
                title: { type: "STRING", description: "Title of the chart" },
                description: {
                  type: "STRING",
                  description: "Brief description of the chart metrics",
                },
                xAxisKey: {
                  type: "STRING",
                  description: "Key for X-axis (e.g. month, category)",
                },
                data: {
                  type: "ARRAY",
                  description:
                    "Array of data point objects with key-values, e.g. [{'name': 'Jan', 'amount': 15000}, {'name': 'Feb', 'amount': 18000}]",
                  items: {
                    type: "OBJECT",
                  },
                },
                series: {
                  type: "ARRAY",
                  description:
                    "Array of series objects with dataKey, name, color",
                  items: {
                    type: "OBJECT",
                    properties: {
                      dataKey: { type: "STRING" },
                      name: { type: "STRING" },
                      color: { type: "STRING" },
                    },
                    required: ["dataKey"],
                  },
                },
              },
              required: ["chartType", "title", "data"],
            },
          },
          {
            name: "stageDeleteRecord",
            description:
              "Stages a delete confirmation card for an expense, budget, goal, or debt.",
            parameters: {
              type: "OBJECT",
              properties: {
                entityType: {
                  type: "STRING",
                  description: "expense, budget, savingGoal, debt, transaction",
                },
                entityId: { type: "STRING", description: "ID of the record" },
                entityName: {
                  type: "STRING",
                  description: "Name of the record",
                },
              },
              required: ["entityType", "entityId", "entityName"],
            },
          },
        ],
      },
    ];

    return NextResponse.json({
      accessToken,
      model,
      voiceName: LIVE_VOICE_AGENT_CONFIG.voiceName || "Puck",
      systemInstruction,
      tools,
      conversationId,
    });
  } catch (error) {
    console.error("[voice/session]", error);
    return NextResponse.json(
      { error: "Failed to initialize the Vertex voice session" },
      { status: 500 },
    );
  }
}
