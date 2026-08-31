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
    const { message, audio, conversationId, history = [] } = body;

    const userText =
      (typeof message === "string" && message.trim()) ||
      (audio ? "Spoken Voice Query" : "");

    if (!userText && !audio) {
      return NextResponse.json(
        { error: "Audio or message is required" },
        { status: 400 }
      );
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
          if (accumulatedText.trim()) {
            await prisma.conversationMessage.create({
              data: {
                conversationId: activeConversationId,
                role: "assistant",
                content: accumulatedText.trim(),
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

