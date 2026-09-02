import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentTools, TOOL_DEFINITIONS } from "@/lib/agent/tools";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { LIVE_VOICE_AGENT_CONFIG } from "@/lib/agent/chat-config";
import { streamText, isStepCount } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { userTranscript, conversationId, history = [], language = "en" } = body;
    const userText = (userTranscript || "").trim();

    if (!userText) {
      return NextResponse.json(
        { error: "userTranscript is required" },
        { status: 400 }
      );
    }

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

    const targetLang = LANGUAGE_MAP[language] || LANGUAGE_MAP.en;
    const isHinglish = language === "hinglish";
    const isRegional = language && language !== "en" && !isHinglish;

    let languageInstruction = "";
    if (isHinglish) {
      languageInstruction = `\nUSER SELECTED LANGUAGE: Hinglish (Conversational Hindi + English)
LANGUAGE & SPOKEN STYLE RULES (STRICT & HIGHEST PRIORITY):
1. The user selected "Hinglish". Speak and respond in natural conversational HINGLISH (spoken Hindi mixed with common English trade & business terms).
2. For text transcripts, use clean Romanized/English script rather than heavy Devanagari script.
3. Keep spoken replies concise, friendly, and natural.`;
    } else if (isRegional) {
      languageInstruction = `\nUSER SELECTED LANGUAGE: ${targetLang.name} (${targetLang.native})
LANGUAGE & DYNAMIC SCRIPT / SPOKEN STYLE RULES (CRITICAL):
1. The user selected "${targetLang.name}". Speak and respond primarily in ${targetLang.name}.
2. DYNAMIC TRANSLITERATION & SCRIPT OBSERVATION:
   - If the user writes or speaks in Romanized text / Latin alphabet (e.g. "Mera naam ye hai", "Mandi bhav batao", "Kasa ahes"): Respond in natural conversational ${targetLang.name} using the ROMAN/ENGLISH ALPHABET (Romanized ${targetLang.name}). Do NOT force native script (${targetLang.native}) when the user types in Romanized letters!
   - If the user writes in native script (${targetLang.native}): Respond in native script (${targetLang.native}).
   - Always match the user's natural conversational flow, script, and tone.`;
    } else {
      languageInstruction = `\nLANGUAGE & SCRIPT RULES:
1. Speak in clear, natural, professional English, or adapt to the user's spoken dialect (Hindi, Hinglish, Marathi, Gujarati, etc.) based on their input.
2. Match the user's conversational pattern naturally.`;
    }

    // 1. Resolve or Create Conversation
    let activeConversationId = conversationId;
    let isNewConversation = false;

    if (!activeConversationId) {
      const conv = await prisma.conversation.create({
        data: {
          title: "Live Voice Session",
          userId: user.id,
          pinned: false,
        },
      });
      activeConversationId = conv.id;
      isNewConversation = true;
    } else {
      const existing = await prisma.conversation.findFirst({
        where: { id: activeConversationId, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    // 2. Persist User Voice Message to Database
    await prisma.conversationMessage.create({
      data: {
        conversationId: activeConversationId,
        role: "user",
        content: userText,
      },
    });

    await prisma.conversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() },
    });

    // 3. Prepare Tools and Language Model
    const tools = getAgentTools({
      userId: user.id,
      conversationId: activeConversationId,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
              )
            );
          } catch (e) {
            // controller closed
          }
        };

        sendEvent("conversation_init", {
          conversationId: activeConversationId,
          isNew: isNewConversation,
        });

        const turnStartTime = Date.now();
        let accumulatedText = "";
        const toolInvocations: any[] = [];

        try {
          const model = getLanguageModel(
            LIVE_VOICE_AGENT_CONFIG.provider,
            LIVE_VOICE_AGENT_CONFIG.model
          );

          const rawFilteredHistory = history
            .filter((h: any) => h.role === "user" || h.role === "assistant")
            .map((h: any) => ({
              role: h.role as "user" | "assistant",
              content:
                typeof h.content === "string"
                  ? h.content
                  : JSON.stringify(h.content),
            }));

          const formattedHistory = rawFilteredHistory.slice(-20);
          formattedHistory.push({ role: "user", content: userText });

          // System instruction with full tool awareness and multilingual support
          const systemInstruction = `You are VyaparSetu Voice OS (व्यापारसेतु), a male AI business advisor and trade partner for Indian micro-enterprises, shopkeepers, traders, and farmers.
${languageInstruction}

MALE PERSONA & GRAMMAR RULES:
1. You are strictly a male persona. In all Indian languages (Hindi, Marathi, Bengali, Punjabi, Gujarati, etc.), always use masculine self-referential verb inflections, pronouns, and adjectives (e.g. in Hindi: "मैं करूँगा", "बता सकता हूँ", "मैं समझता हूँ", never use feminine forms like "करूँगी" or "सकती हूँ").
2. In English, maintain a warm, confident, professional male advisor tone.

MULTILINGUAL SUPPORT:
1. You natively understand and speak: Hindi, English, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Hinglish, and colloquial regional business terminology.
2. Always respond directly in the language spoken by the user (or the language the user asks for).
3. Keep spoken replies concise, clear, natural, and respectful — 1 to 3 short spoken sentences.
4. Never read out hidden reasoning or tool schema details.

CAPABILITIES & TOOL USAGE (CRITICAL — YOU MUST USE TOOLS):
You have access to powerful tools. When the user's query relates to any of the following, you MUST autonomously call the appropriate tool — do NOT say "I can't do that" or "I don't have access":

0. **Inspect & In-Place Edit Forms & Artifacts** → Call \`getArtifacts\` to inspect previously staged forms/charts (#1, #2...). When the user asks to modify or change an existing form/chart, retrieve it via \`getArtifacts\`, modify the requested fields, and pass \`targetArtifactId\` to \`stageForm\` or other staging tools to update it in place.
1. **APMC Mandi Commodity Prices** → Call \`getMandiRates\` with the commodity name (Onion, Wheat, Cotton, Tomato, Soyabean, etc.) and optional state/district/market filters.
2. **Budgets** (view, create) → Call \`getBudgets\` to retrieve, or \`stageBudget\` to create/update a budget plan.
3. **Expenses** (view, log) → Call \`getExpenses\` to retrieve, or \`stageExpense\` to log/update an expense.
4. **Transactions** (view, add) → Call \`getTransactions\` to retrieve, or \`stageTransaction\` to add/update a ledger entry.
5. **Savings Goals** (view, create) → Call \`getSavingsGoals\` to retrieve, or \`stageSavingsGoal\` to create/update a goal.
6. **Debts & Loans** (view, add) → Call \`getDebts\` to retrieve, or \`stageDebt\` to record/update a loan/liability.
7. **Business Profile** → Call \`getBusinessProfile\` to retrieve enterprise details.
8. **Government Schemes** (PM Mudra, PM SVANidhi, PMEGP, Stand-Up India, PM Vishwakarma) → Call \`getGovtSchemes\` with the relevant scheme name.
9. **Visual Charts & Graphs** → Call \`stageChart\` with chartType, title, data, and series for bar/line/area/pie visualizations.
10. **Web Search** (trade news, policies, RBI circulars) → Call \`webSearch\` with the search query.
11. **Dynamic Interactive Forms & Applications** → Call \`stageForm\` when user asks for any form (loan application, subsidy registration, supplier KYC, survey) with rich sections and fields.
12. **Delete Records** → Call \`stageDeleteRecord\` when user wants to remove a budget, expense, goal, or debt.

STRICT TOOL CALLING RULE (ENGLISH-ONLY PARAMETERS):
1. Even when conversing, speaking, or replying in Hindi, Hinglish, Marathi, Bengali, Gujarati, or any Indian regional language:
2. All TOOL CALL ARGUMENTS & PARAMETERS (commodity, district, state, market, query, schemeName, category, etc.) MUST ALWAYS be passed in standard ENGLISH:
   - User says: "गोरखपुर में गेहूं का भाव" ➜ Call: getMandiRates({ commodity: "Wheat", district: "Gorakhpur", state: "Uttar Pradesh" })
   - User says: "सरसों का रेट" ➜ Call: getMandiRates({ commodity: "Mustard" })
3. NEVER pass Devanagari script or regional words inside tool parameters.

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

RESPONSE RULES:
1. After executing a tool, speak the key findings naturally and concisely in the user's language.
2. Confirm key prices, rates, amounts, or loan figures clearly.
3. For staging tools (stageForm, stageBudget, stageExpense, stageChart, etc.), confirm that an interactive draft card has been created or updated for the user to review and edit on screen.`;

          // AI-Driven Autonomous Multi-Step Tool Execution
          // Tools are passed directly to the AI model — NO hardcoded keyword matching.
          // The AI autonomously decides which tools to call based on the user's query.
          const aiStream = streamText({
            model,
            system: systemInstruction,
            messages: formattedHistory,
            tools: tools as any,
            stopWhen: isStepCount(5),
          });

          for await (const rawPart of (aiStream as any).fullStream) {
            const part = rawPart as any;
            if (part.type === "text-delta" || part.type === "text") {
              const textChunk = part.textDelta ?? part.text ?? "";
              if (textChunk) {
                accumulatedText += textChunk;
                sendEvent("chunk", { text: textChunk });
              }
            } else if (part.type === "tool-call") {
              const toolArgs = part.args ?? part.input ?? {};
              const def = (TOOL_DEFINITIONS as any)[part.toolName] || {
                icon: "terminal",
                formatSummary: (args: any) => `Executing ${part.toolName}...`,
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs)
                  : `Executing ${part.toolName}...`;

              sendEvent("tool_call", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "terminal",
                args: toolArgs,
                summary,
                status: "calling",
              });
            } else if (part.type === "tool-result") {
              const toolArgs = part.args ?? part.input ?? {};
              const toolResult = part.result ?? part.output ?? {};
              const def = (TOOL_DEFINITIONS as any)[part.toolName] || {
                icon: "terminal",
                formatSummary: () => "Action completed",
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs)
                  : "Action completed";

              toolInvocations.push({
                toolName: part.toolName,
                icon: def.icon || "terminal",
                args: toolArgs,
                result: toolResult,
                summary,
                status: "completed",
              });

              sendEvent("tool_result", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "terminal",
                result: toolResult,
                summary,
                status: "completed",
              });
            }
          }
        } catch (err: any) {
          console.error("[Voice Turn Stream Error]:", err);
          const errorMsg = `⚠️ ${err?.message || "Execution error"}`;
          if (!accumulatedText.trim()) {
            accumulatedText = "Maaf kijiye, abhi kuch technical dikkat aa rahi hai. Kripya dobara try karein.";
            sendEvent("chunk", { text: accumulatedText });
          }
          sendEvent("error", { message: err?.message || "Execution error" });
        } finally {
          // 4. Persist Assistant Response to Database
          const thoughtDurationSeconds = Math.max(
            1,
            Math.round((Date.now() - turnStartTime) / 1000)
          );

          if (accumulatedText.trim()) {
            await prisma.conversationMessage.create({
              data: {
                conversationId: activeConversationId,
                role: "assistant",
                content: accumulatedText.trim(),
                thinking: JSON.stringify({ durationSeconds: thoughtDurationSeconds }),
                toolCalls:
                  toolInvocations.length > 0
                    ? (toolInvocations as any)
                    : undefined,
              },
            });
          }

          sendEvent("done", {
            conversationId: activeConversationId,
            text: accumulatedText.trim(),
            thoughtDurationSeconds,
            userText,
            toolCalls: toolInvocations,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[POST /api/voice/turn error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

