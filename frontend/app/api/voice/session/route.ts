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
    const rawLang =
      body.language ||
      new URL(req.url).searchParams.get("language") ||
      "en";
    const languageCode = rawLang.split("-")[0]; // "hi-IN" -> "hi"

    const LANGUAGE_MAP: Record<string, { name: string; native: string }> = {
      en: { name: "English", native: "English" },
      hi: { name: "Hindi", native: "हिन्दी" },
      hinglish: { name: "Hinglish", native: "Hinglish (Hindi in Roman script)" },
      mr: { name: "Marathi", native: "मराठी" },
      bn: { name: "Bengali", native: "বাংলা" },
      gu: { name: "Gujarati", native: "ગુજરાતી" },
      ta: { name: "Tamil", native: "தமிழ்" },
      te: { name: "Telugu", native: "తెలుగు" },
      pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ" },
      kn: { name: "Kannada", native: "ಕನ್ನಡ" },
      ml: { name: "Malayalam", native: "മലയാളം" },
    };

    const targetLang = LANGUAGE_MAP[languageCode] || LANGUAGE_MAP.en;
    const isHinglish = languageCode === "hinglish";
    const isRegional = languageCode && languageCode !== "en" && !isHinglish;

    let languageInstruction = "";
    if (isHinglish) {
      languageInstruction = `\nPREFERRED CONVERSATIONAL DIALECT: Hinglish (Conversational Hindi + English)
1. Speak and respond in natural conversational HINGLISH (spoken Hindi mixed with common English trade & business terms).
2. Keep spoken replies concise, friendly, and natural.`;
    } else if (isRegional) {
      languageInstruction = `\nPREFERRED CONVERSATIONAL LANGUAGE: ${targetLang.name} (${targetLang.native})
1. The user's preferred language setting is ${targetLang.name}. When appropriate or when the user speaks in ${targetLang.name}, speak and respond primarily in ${targetLang.name}.
2. Always match the user's natural conversational flow and tone.`;
    } else {
      languageInstruction = `\nCONVERSATIONAL LANGUAGE:
1. You are an adaptive multilingual Indian assistant. Automatically detect the user's spoken language (Hindi, Hinglish, English, or regional languages) and respond naturally in that same language.`;
    }

    const modelId = (LIVE_VOICE_AGENT_CONFIG.model || "gemini-live-2.5-flash")
      .replace(/^models\//, "")
      .replace(
        /^projects\/[^/]+\/locations\/[^/]+\/publishers\/google\/models\//,
        "",
      );
    const model = `projects/${project}/locations/${location}/publishers/google/models/${modelId}`;

    let systemInstruction = `You are VyaparSetu Voice (व्यापारसेतु), a male AI business advisor and trade partner for Indian micro-enterprises, shopkeepers, traders, and farmers.
${languageInstruction}

MALE PERSONA & GRAMMAR RULES:
1. You are strictly a male persona. In all Indian languages (Hindi, Marathi, Bengali, Punjabi, Gujarati, etc.), always use masculine self-referential verb inflections, pronouns, and adjectives (e.g. in Hindi: "मैं करूँगा", "बता सकता हूँ", "मैं समझता हूँ", never use feminine forms like "करूँगी" or "सकती हूँ").
2. In English, maintain a warm, confident, professional male advisor tone.

LANGUAGE MATCHING & TRANSCRIPTION MATRIX (MANDATORY — MIRROR THE USER'S EXACT LANGUAGE):
Detect the language of the speaker dynamically on every single utterance and strictly adhere to this matrix:

1. IF ENGLISH:
   • User Input Transcript (inputAudioTranscription): Output clean, accurate English text.
   • Spoken AI Response: Speak back in clear, natural, professional English.

2. IF HINDI:
   • User Input Transcript (inputAudioTranscription): Output authentic Hindi in Devanagari script (e.g. "नमस्ते भाई, मुझे एसबीआई मुद्रा लोन का फॉर्म चाहिए", "मंडी भाव बताओ").
   • STRICT ANTI-CORRUPTION RULE: Under NO circumstances should you force Hindi speech into English words or syllables!
     - NEVER transcribe "भाई" as "VI".
     - NEVER transcribe "आवेदन" as "order".
     - NEVER transcribe "लोन" as "alone".
     - NEVER distort Hindi sounds into phonetically similar English words.
   • Spoken AI Response: Speak back in polite, respectful, natural Hindi.

3. IF HINGLISH (Conversational Hindi + English):
   • User Input Transcript (inputAudioTranscription): Output in natural conversational Hinglish (e.g. "Mera SBI loan form bana do", "Aaj ka mandi bhav check karo").
   • Spoken AI Response: Speak back in friendly, natural conversational Hinglish.

4. IF OTHER REGIONAL LANGUAGES (Marathi, Gujarati, Bengali, Tamil, Telugu, Punjabi, Kannada, Malayalam):
   • User Input Transcript (inputAudioTranscription): Output in that specific regional language and native script (मराठी, ગુજરાતી, বাংলা, etc.).
   • Spoken AI Response: Speak back in that same regional language.

NEVER TRANSLATE USER INPUT:
- When writing the user transcript (inputAudioTranscription), transcribe what was actually spoken in its native language/script. Never translate Hindi to English, and never phonetically convert Hindi words into English vocabulary.
- Keep spoken replies concise, clear, natural, and respectful — 1 to 3 short spoken sentences.
- Never read out hidden reasoning or tool schema details.

CAPABILITIES & TOOL USAGE (CRITICAL — YOU MUST USE TOOLS WHEN RELEVANT):
You have access to powerful tools. When the user's query relates to any of the following, you MUST call the appropriate tool immediately — do NOT say "I can't do that" or "I don't have access":

0. **Inspect & In-Place Edit Forms & Artifacts** → Call getArtifacts to inspect previously staged forms/charts (#1, #2...). When the user asks to modify or change an existing form/chart, retrieve it via getArtifacts, modify the requested fields, and pass targetArtifactId to stageForm or other staging tools to update it in place.
1. **APMC Mandi Commodity Prices** → Call getMandiRates with the commodity name (Onion, Wheat, Cotton, Tomato, Soyabean, Mustard, Potato, Gram, etc.) and optional state/district/market filters.
2. **Budgets** (view, create) → Call getBudgets to retrieve active budgets, or stageBudget to create/update a budget plan.
3. **Expenses** (view, log) → Call getExpenses to retrieve logged expenses, or stageExpense to log/update an expense entry.
4. **Transactions** (view, add) → Call getTransactions to retrieve ledger transactions, or stageTransaction to add/update a ledger entry.
5. **Savings Goals** (view, create) → Call getSavingsGoals to retrieve goals, or stageSavingsGoal to create/update a savings target.
6. **Debts & Loans** (view, add) → Call getDebts to retrieve loan liabilities, or stageDebt to record/update a loan/liability.
7. **Business Profile** → Call getBusinessProfile to retrieve enterprise details, category, location, and turnover.
8. **Government Schemes** (PM Mudra, PM SVANidhi, PMEGP, Stand-Up India, PM Vishwakarma) → Call getGovtSchemes with the relevant scheme name.
9. **Visual Charts & Graphs** → Call stageChart with chartType (bar, line, area, pie), title, data array, and series for visualizations.
10. **Web Search** (trade news, policies, RBI circulars, market updates) → Call webSearch with the search query.
11. **Dynamic Interactive Forms & Applications** → Call stageForm when user asks for any form (loan application, subsidy registration, supplier KYC, survey, registration) with rich sections and fields.
12. **Delete Records** → Call stageDeleteRecord when the user wants to remove a budget, expense, goal, or debt.
13. **Local Competitors & Market Feasibility** → Call searchCompetitors when user asks about starting/opening a shop, local business feasibility, market competition, rival businesses, or customer footfall in their area.
14. **ONDC Digital Commerce & Wholesale Sourcing** → Call getOndcIntelligence when user asks about reducing inventory cost, wholesale buying on ONDC B2B, selling online without paying 25-30% aggregator commission, onboarding on ONDC, or e-commerce expansion.

STRICT TOOL CALLING RULE (ENGLISH-ONLY PARAMETERS):
1. Even when conversing, speaking, or chatting with the user in Hindi, Hinglish, Marathi, Bengali, Gujarati, or any Indian regional language:
2. All TOOL CALL ARGUMENTS & PARAMETERS (commodity, district, state, market, query, schemeName, category, etc.) MUST ALWAYS be passed in standard ENGLISH:
   - User says: "गोरखपुर में गेहूं का भाव बताओ" ➜ Call: getMandiRates({ commodity: "Wheat", district: "Gorakhpur", state: "Uttar Pradesh" })
   - User says: "सरसों का मंडी रेट" ➜ Call: getMandiRates({ commodity: "Mustard" })
   - User says: "इंदौर में सोयाबीन" ➜ Call: getMandiRates({ commodity: "Soyabean", district: "Indore", state: "Madhya Pradesh" })
   - User says: "प्याज का नासिक भाव" ➜ Call: getMandiRates({ commodity: "Onion", district: "Nashik", state: "Maharashtra" })
3. NEVER pass Devanagari or Hindi text inside tool parameters.
4. You speak to the user in their language (Hindi/Hinglish), but talk to internal tools and APIs strictly in English.

STRICT SCOPE BOUNDARY (CRITICAL):
You are exclusively VyaparSetu (व्यापारसेतु), dedicated to Indian micro-enterprises, small businesses, shopkeepers, traders, and farmers.

Allowed Domains:
1. Real-time APMC Mandi rates, agricultural commodities, crop arrivals, and spot market trends.
2. Indian Government credit & MSME loan schemes (PM Mudra, PM SVANidhi, PMEGP, KCC, Stand-Up India, CGTMSE).
3. Business finance & ledgers (cash flow runways, daily income/expenses, budgeting, debt repayment, savings goals, working capital).
4. Trade compliance & business registration (GST, Udyam Aadhar, PAN, trade licenses).

Out-of-Scope Rule:
If the user asks about topics outside of Indian trade, agriculture, mandi rates, business finance, or government schemes (e.g. movies, gaming, entertainment, celebrity gossip, software coding, casual chat, politics, non-business medical advice):
- DO NOT answer the off-topic query.
- Politely decline and redirect them back to business topics.
- English response: "I am VyaparSetu, dedicated to assisting Indian small businesses, mandi traders, and farmers. I can help you with live APMC mandi prices, government loans (PM Mudra/SVANidhi), expense ledgers, and business financial planning. How may I assist your business today?"
- Hindi response: "माफ़ कीजिए, मैं व्यापारसेतु हूँ — भारतीय छोटे व्यापारियों, दुकानदारों और किसानों का व्यापार सहायक। मैं केवल मंडी भाव, सरकारी योजनाओं (मुद्रा/स्वनिधि ऋण), व्यापारिक बहीखाता, और वित्तीय योजना से जुड़े प्रश्नों में आपकी मदद कर सकता हूँ। आपके व्यवसाय या मंडी से संबंधित क्या प्रश्न है?"

CRITICAL TOOL EXECUTION ORDER (STRICT & HIGHEST PRIORITY):
1. TOOL FIRST, AUDIO SECOND: When the user asks to create, view, or update ANY form, chart, graph, mandi rate, budget, or expense, YOU MUST DISPATCH THE RELEVANT TOOL CALL FIRST BEFORE SPEAKING A SINGLE WORD.
2. SPOKEN WORDS CANNOT RENDER UI: Spoken voice alone CANNOT put anything on the user's screen. Only executing tools (stageForm, stageChart, stageBudget, stageExpense, getMandiRates) renders interactive cards and data on screen.
3. NEVER PREDICT OR FAKE COMPLETION: YOU ARE STRICTLY FORBIDDEN from saying "मैंने स्क्रीन पर बना दिया है", "स्क्रीन पर देख सकते हैं", "I have created the form/chart", or "Here is the form" UNLESS you actually executed the tool in this exact turn.
4. ON-DEMAND VERIFICATION ("WHERE IS IT? / FORM NAHI DIKH RAHA"): If the user asks "फॉर्म कहाँ है?", "मुझे नहीं दिख रहा", "Did you make the form?", or asks to make it again:
   - NEVER say "यह तो पहले से बना हुआ है" / "It is already done".
   - If the user says they do not see it, it means NO tool was called or the screen is empty.
   - You MUST IMMEDIATELY call stageForm, stageChart, or the requested tool in this turn without arguing!

RESPONSE RULES:
1. After executing a tool, speak the key findings naturally and concisely in the user's language (1 to 2 short spoken sentences).
2. Confirm key prices, rates, amounts, or loan figures clearly.
3. For staging tools (stageForm, stageBudget, stageExpense, stageChart), confirm that the interactive draft card has been created for the user to review and edit on screen.`;


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
              "Fetches live real-time APMC wholesale mandi rates, daily arrivals, and modal prices across all Indian districts (Gorakhpur, Varanasi, Indore, Nashik, Pune, Lucknow, Kanpur, Patna, Jaipur, etc.) for any crop.",
            parameters: {
              type: "OBJECT",
              properties: {
                commodity: {
                  type: "STRING",
                  description:
                    "Crop or commodity in Hindi or English, e.g. Wheat (गेहूं), Mustard (सरसों), Onion (प्याज), Paddy (धान), Potato (आलू), Soybean, Tomato, Gram (चना), Cotton (कपास), Sugarcane (गन्ना)",
                },
                state: {
                  type: "STRING",
                  description:
                    "State e.g. Uttar Pradesh, Madhya Pradesh, Maharashtra, Gujarat, Punjab, Rajasthan, Haryana, Bihar",
                },
                district: {
                  type: "STRING",
                  description: "District or city e.g. Gorakhpur, Varanasi, Indore, Nashik, Pune, Lucknow, Kanpur, Prayagraj, Patna",
                },
                market: {
                  type: "STRING",
                  description: "Specific APMC Mandi e.g. Gorakhpur Mandi, Lasalgaon, Azadpur, Indore APMC",
                },
              },
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
              "Stages an interactive draft budget plan with category allocations for user review. Call this tool when the user wants to create or plan a budget.",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "Budget title" },
                query: {
                  type: "STRING",
                  description: "Full user budget request, purpose, and amount details",
                },
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
                    "Optional list of allocations with category and allocatedAmount",
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
              required: ["name"],
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
            name: "getArtifacts",
            description:
              "Retrieves previously staged artifacts (forms, charts, budgets, expenses) from the current conversation in stack order (#1, #2...). Use before editing or updating any existing form or chart on user demand.",
            parameters: {
              type: "OBJECT",
              properties: {
                artifactType: {
                  type: "STRING",
                  description: "form, chart, budget, expense, transaction, saving_goal, debt, or all",
                },
                limit: {
                  type: "NUMBER",
                  description: "Max number of artifacts to retrieve (defaults to 10)",
                },
              },
            },
          },
          {
            name: "stageChart",
            description:
              "Generates or updates an interactive visual chart (bar, line, area, pie) as an artifact on screen. Call this tool whenever the user asks for a chart, graph, visual comparison, or price trend.",
            parameters: {
              type: "OBJECT",
              properties: {
                targetArtifactId: {
                  type: "STRING",
                  description: "Optional ID or index of an existing chart to update in place",
                },
                chartType: {
                  type: "STRING",
                  description: "bar, line, area, or pie",
                },
                title: { type: "STRING", description: "Title of the chart" },
                query: {
                  type: "STRING",
                  description: "Specific metric or trend to visualize e.g. 'Last 6 months onion modal price trend in Nashik'",
                },
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
                    "Optional array of data point objects with key-values",
                  items: {
                    type: "OBJECT",
                  },
                },
                series: {
                  type: "ARRAY",
                  description:
                    "Optional array of series objects with dataKey, name, color",
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
              required: ["title", "chartType"],
            },
          },
          {
            name: "stageForm",
            description:
              "Generates or updates a dynamic interactive multi-field form artifact on screen (loan applications, subsidy forms, vendor KYC, registration). Call this tool whenever the user asks to create, show, or edit any form.",
            parameters: {
              type: "OBJECT",
              properties: {
                targetArtifactId: {
                  type: "STRING",
                  description: "Optional ID or index of an existing form to update in place",
                },
                title: {
                  type: "STRING",
                  description: "Title of the form (e.g. 'SBI MSME Loan Application Form')",
                },
                query: {
                  type: "STRING",
                  description: "Specific form request, applicant details, business type, loan amount, or requested fields",
                },
                description: {
                  type: "STRING",
                  description: "Subtitle or instructions",
                },
                submitLabel: {
                  type: "STRING",
                  description: "Label for the submit button",
                },
                formType: {
                  type: "STRING",
                  description: "Form category e.g. loan_application, subsidy, vendor_kyc, registration",
                },
                sections: {
                  type: "ARRAY",
                  description: "Optional list of form sections containing fields",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      description: { type: "STRING" },
                      fields: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            id: { type: "STRING" },
                            label: { type: "STRING" },
                            type: {
                              type: "STRING",
                              description: "text, number, select, date, textarea, checkbox",
                            },
                            defaultValue: { type: "STRING" },
                            placeholder: { type: "STRING" },
                            options: {
                              type: "ARRAY",
                              items: { type: "STRING" },
                            },
                            required: { type: "BOOLEAN" },
                            helpText: { type: "STRING" },
                          },
                          required: ["id", "label"],
                        },
                      },
                    },
                    required: ["fields"],
                  },
                },
              },
              required: ["title"],
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
          {
            name: "searchCompetitors",
            description:
              "Searches for nearby competitor shops, rival outlets, or businesses for any commercial category within a catchment radius to analyze local competition and market feasibility.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: {
                  type: "STRING",
                  description:
                    "Search query or specific business description or trade sector to search",
                },
                category: {
                  type: "STRING",
                  description:
                    "Business sector e.g. Biryani & Food, Kirana, Garments, Mobile Repair, Hardware",
                },
                radiusKm: {
                  type: "NUMBER",
                  description: "Search radius in km e.g. 1, 2, 5",
                },
                location: {
                  type: "STRING",
                  description: "Specific city, area, or landmark if specified by user",
                },
              },
            },
          },
          {
            name: "getOndcIntelligence",
            description:
              "Discovers ONDC (Open Network for Digital Commerce) opportunities including B2B wholesale procurement at 8-12% discounts, B2C digital seller apps (Mystore, Magicpin) at 3% commission, and hyper-local delivery partners for any enterprise.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: {
                  type: "STRING",
                  description:
                    "Specific ONDC inquiry e.g. 'How to sell on ONDC' or 'Wholesale procurement'",
                },
                category: {
                  type: "STRING",
                  description:
                    "Business sector e.g. Biryani & Food, Kirana, Garments, Mobile Repair, Hardware",
                },
                location: {
                  type: "STRING",
                  description: "Specific city, area, or state",
                },
                intent: {
                  type: "STRING",
                  description: "Focus: procure, sell, logistics, or general",
                },
              },
            },
          },
          {
            name: "predictDistrictBusinesses",
            description:
              "Researches and predicts the Top 4 high-ROI, low-saturation business opportunities in any Indian district for a given budget using live web search, APMC Mandi trends, and Udyam MSME subsidies (PMEGP 35%, PMFME, Mudra).",
            parameters: {
              type: "OBJECT",
              properties: {
                district: {
                  type: "STRING",
                  description: "District or city name (e.g. Lucknow, Varanasi, Pune, Kanpur, Indore)",
                },
                state: {
                  type: "STRING",
                  description: "State name (e.g. Uttar Pradesh, Maharashtra, Madhya Pradesh)",
                },
                budget: {
                  type: "NUMBER",
                  description: "Capital investment budget in INR (e.g. 200000, 500000)",
                },
                category: {
                  type: "STRING",
                  description: "Sector of interest (e.g. Food Processing, Packaging, Manufacturing, Retail)",
                },
              },
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
