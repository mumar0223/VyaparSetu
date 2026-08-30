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

    const systemInstruction = `You are VyaparSetu's AI Business Advisor & Trade Partner for Indian micro-enterprises, traders, farmers, and shopkeepers.
You provide clear, accurate market rates, actionable financial structuring, credit scheme eligibility, and operational advice.

CAPABILITIES & TOOL USAGE:
1. When asked about APMC Mandi commodity rates or crop prices, autonomously call the \`getMandiRates\` tool.
2. When asked to visualize data, plot numbers, or generate a graph/chart, autonomously call \`stageChart\` with appropriate data points, types, and labels.
3. When asked about govt credit schemes or loans (Mudra, SVANidhi, PMEGP), call \`getGovtSchemes\` or \`checkEligibility\`.
4. When asked to create or structure a budget or record an expense, call \`stageBudget\` or \`stageExpense\`.
5. When asked about live policies, notifications, or current news, call \`webSearch\`.

PRESENTATION & SYNTHESIS RULES:
1. ALWAYS provide a comprehensive, detailed markdown response to the user AFTER executing any tools.
2. Present prices, market names, or financial breakdowns in clean Markdown tables.
3. Highlight key trade insights, price spreads, and actionable recommendations.
4. Respond in clear, professional English, Hindi, or Hinglish matching the user's inquiry language.`;

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
                icon: "sparkles",
                formatSummary: (args: any) => `Executing ${part.toolName}...`,
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs)
                  : `Executing ${part.toolName}...`;

              sendEvent("tool_call", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "sparkles",
                args: toolArgs,
                summary,
                status: "calling",
              });
            } else if (part.type === "tool-result") {
              const toolArgs = part.args ?? part.input ?? {};
              const toolResult = part.result ?? part.output ?? {};
              const def = (TOOL_DEFINITIONS as any)[part.toolName] || {
                icon: "sparkles",
                formatSummary: () => "Action completed",
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs)
                  : "Action completed";

              toolInvocations.push({
                toolName: part.toolName,
                icon: def.icon || "sparkles",
                args: toolArgs,
                result: toolResult,
                summary,
                status: "completed",
              });

              sendEvent("tool_result", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "sparkles",
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
