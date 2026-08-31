import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentTools, TOOL_DEFINITIONS } from "@/lib/agent/tools";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { DASHBOARD_CHAT_CONFIG } from "@/lib/agent/chat-config";
import { streamText, isStepCount } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { message, conversationId, history = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // 1. Find or create conversation
    let activeConversationId = conversationId;
    let isNewConversation = false;
    let conversationTitle = "New Conversation";

    if (!activeConversationId) {
      const fallback = message
        .trim()
        .replace(/\n+/g, " ")
        .split(" ")
        .slice(0, 6)
        .join(" ");
      conversationTitle =
        fallback.length > 40
          ? fallback.slice(0, 37) + "..."
          : fallback || "New Conversation";

      const conv = await prisma.conversation.create({
        data: {
          title: conversationTitle,
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
      conversationTitle = existing.title;
    }

    // 2. Persist User Message
    await prisma.conversationMessage.create({
      data: {
        conversationId: activeConversationId,
        role: "user",
        content: message.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() },
    });

    // 3. Prepare AI execution and tools
    const tools = getAgentTools({
      userId: user.id,
      conversationId: activeConversationId,
    });

    const model = getLanguageModel(
      DASHBOARD_CHAT_CONFIG.provider,
      DASHBOARD_CHAT_CONFIG.model
    );

    const systemInstruction = `You are VyaparSetu's AI Business Advisor & Trade Partner for Indian micro-enterprises, shopkeepers, traders, and farmers.
You provide clear, accurate market rates, actionable financial structuring, credit scheme eligibility, and operational advice.

CAPABILITIES & TOOL USAGE (CRITICAL — YOU MUST USE TOOLS AUTONOMOUSLY):
You have access to powerful tools. When the user's query relates to any of the following, you MUST autonomously call the appropriate tool — do NOT say "I can't do that" and do NOT output static text forms:

1. **Interactive Dynamic Forms & Applications (CRITICAL)**:
   - When the user asks for ANY form (e.g. "give me a form", "loan form", "loan application form", "MSME loan form", "supplier onboarding form", "subsidy registration form", "expense entry form", "form to fill", "form bana do", etc.), NEVER output a static text or markdown table form in chat!
   - You MUST autonomously call the \`stageForm\` tool to generate a rich, multi-section, interactive editable form artifact.
   - Structure rich sections (e.g. "1. Personal / Applicant Details", "2. Business & Enterprise Details", "3. Loan / Facility Request", "4. Banking & Financial Details") with appropriate field types (text, number, select with options, date, textarea, checkbox) and smart pre-filled defaults.
   - The user will NOT say "generate an interactive form" — any request for "a form", "application", or "form filling" must trigger \`stageForm\` directly!

2. **Inspecting & In-Place Editing Existing Forms / Artifacts (CRITICAL)**:
   - When the user asks to modify, update, change fields in, or add sections to an already generated form, chart, budget, or other artifact (e.g. "change loan amount to 15 lakhs", "add guarantor section to the form", "update interest rate to 9%"):
   - Step 1: Call \`getArtifacts({ artifactType: "..." })\` to inspect the existing artifact's structure, sections, and \`artifactId\` (or index #1, #2).
   - Step 2: Modify the schema/values as requested, keeping other sections/fields intact.
   - Step 3: Call the staging tool (e.g. \`stageForm\`, \`stageChart\`, \`stageBudget\`) passing \`targetArtifactId: "<artifactId>"\` (e.g. \`targetArtifactId: "art_1"\` or matching ID) so the original artifact updates in place without creating duplicate cards.

3. **APMC Mandi Commodity Prices**: Call \`getMandiRates\` with commodity name (Onion, Wheat, Cotton, Tomato, Soyabean, etc.) and optional state/district/market.
4. **Visual Charts & Graphs**: Call \`stageChart\` with chartType (bar/line/area/pie), title, data points, and series.
5. **Government Schemes & Subsidies**: Call \`getGovtSchemes\` with the relevant scheme name (PM_MUDRA, PM_SVANIDHI, PMEGP, STAND_UP_INDIA, PM_VISHWAKARMA).
6. **Budgets**: Call \`getBudgets\` to query, or \`stageBudget\` to create/update an interactive budget plan.
7. **Expenses**: Call \`getExpenses\` to query, or \`stageExpense\` to log/update an expense draft.
8. **Ledger Transactions**: Call \`getTransactions\` to query, or \`stageTransaction\` to create/update a transaction draft.
9. **Savings Goals**: Call \`getSavingsGoals\` to query, or \`stageSavingsGoal\` to create/update a savings target draft.
10. **Debts & Loans**: Call \`getDebts\` to query active liabilities, or \`stageDebt\` / \`stageForm\` for loan applications.
11. **Web Search**: Call \`webSearch\` for live policies, trade circulars, and tax news.
12. **Delete Records**: Call \`stageDeleteRecord\` to safely confirm deletion of a record.

PRESENTATION & SYNTHESIS RULES:
1. ALWAYS provide a comprehensive, clear markdown response to the user AFTER executing any tools.
2. When an interactive form or chart is staged or updated, explain the changes and invite the user to review the live form on screen.
3. Present rates, comparisons, and financial breakdowns in clean Markdown tables with key actionable insights.
4. Respond in clear, professional English, Hindi, or Hinglish matching the user's language.`;

    const rawFilteredHistory = history
      .filter((h: any) => h.role === "user" || h.role === "assistant")
      .map((h: any) => ({
        role: h.role as "user" | "assistant",
        content:
          typeof h.content === "string"
            ? h.content
            : JSON.stringify(h.content),
      }));

    const formattedMessages = rawFilteredHistory.slice(-10);
    formattedMessages.push({
      role: "user",
      content: message.trim(),
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
          title: conversationTitle,
          isNew: isNewConversation,
        });

        let accumulatedText = "";
        const toolInvocations: any[] = [];

        try {
          // Native Autonomous Multi-Step Tool Execution via Vertex AI Gemini 3.7 Flash
          const aiStream = streamText({
            model,
            system: systemInstruction,
            messages: formattedMessages,
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
                icon: "bot",
                formatSummary: (args: any) => `Executing ${part.toolName}...`,
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs)
                  : `Executing ${part.toolName}...`;

              sendEvent("tool_call", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "bot",
                args: toolArgs,
                summary,
                status: "calling",
              });
            } else if (part.type === "tool-result") {
              const toolArgs = part.args ?? (part as any).input ?? {};
              const toolResult = part.result ?? (part as any).output ?? {};
              const def = (TOOL_DEFINITIONS as any)[part.toolName] || {
                icon: "bot",
                formatSummary: () => "Action completed",
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs, toolResult)
                  : "Action completed";

              toolInvocations.push({
                toolName: part.toolName,
                icon: def.icon || "bot",
                args: toolArgs,
                result: toolResult,
                summary,
                status: "completed",
              });

              sendEvent("tool_result", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "bot",
                result: toolResult,
                summary,
                status: "completed",
              });
            }
          }
        } catch (err: any) {
          console.error("[Stream Controller Error]:", err);
          const errorMsg = `⚠️ An error occurred while processing your request: ${err?.message || "Execution error"}. Please retry.`;
          accumulatedText = errorMsg;
          sendEvent("chunk", { text: errorMsg });
        } finally {
          // In-Place Update DB Sync: If an existing artifact was modified in place, update previous message toolCalls
          for (const inv of toolInvocations) {
            const res = inv.result as any;
            if (res?.isUpdated && (res?.targetArtifactId || res?.artifactId)) {
              const targetId = res.targetArtifactId || res.artifactId;
              try {
                const pastMsgs = await prisma.conversationMessage.findMany({
                  where: { conversationId: activeConversationId },
                  orderBy: { createdAt: "desc" },
                  take: 25,
                });
                for (const pastMsg of pastMsgs) {
                  if (!pastMsg.toolCalls || !Array.isArray(pastMsg.toolCalls)) continue;
                  let modified = false;
                  const updatedCalls = (pastMsg.toolCalls as any[]).map((tc) => {
                    const tcRes = tc.result as any;
                    const match =
                      tcRes?.artifactId === targetId ||
                      tcRes?.data?.artifactId === targetId ||
                      (targetId === "1" && tcRes?.isArtifact) ||
                      (targetId === "art_1" && tcRes?.isArtifact);
                    if (match) {
                      modified = true;
                      return {
                        ...tc,
                        result: {
                          ...tcRes,
                          title: res.title || tcRes.title,
                          summary: res.summary || tcRes.summary,
                          data: res.data || res,
                        },
                      };
                    }
                    return tc;
                  });
                  if (modified) {
                    await prisma.conversationMessage.update({
                      where: { id: pastMsg.id },
                      data: { toolCalls: updatedCalls },
                    });
                    break;
                  }
                }
              } catch (dbErr) {
                console.warn("[Artifact in-place DB sync error]:", dbErr);
              }
            }
          }

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
            text: accumulatedText,
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
    console.error("[POST /api/chat/stream error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
