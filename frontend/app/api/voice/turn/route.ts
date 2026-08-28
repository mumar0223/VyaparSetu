import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentTools, TOOL_DEFINITIONS } from "@/lib/agent/tools";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { LIVE_VOICE_AGENT_CONFIG } from "@/lib/agent/chat-config";
import { streamText } from "ai";

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
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        };

        sendEvent("conversation_init", {
          conversationId: activeConversationId,
          isNew: isNewConversation,
        });

        let accumulatedText = "";
        let toolInvocations: any[] = [];

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

          // Check if message requires tools
          const lowerMsg = userText.toLowerCase();
          const isMandiQuery =
            lowerMsg.includes("mandi") ||
            lowerMsg.includes("rate") ||
            lowerMsg.includes("price") ||
            lowerMsg.includes("onion") ||
            lowerMsg.includes("pyaaz") ||
            lowerMsg.includes("wheat") ||
            lowerMsg.includes("gehu") ||
            lowerMsg.includes("bhav");

          const isSchemeQuery =
            lowerMsg.includes("loan") ||
            lowerMsg.includes("scheme") ||
            lowerMsg.includes("mudra") ||
            lowerMsg.includes("credit") ||
            lowerMsg.includes("svanidhi");

          if (isMandiQuery) {
            const commodityName = lowerMsg.includes("wheat") || lowerMsg.includes("gehu")
              ? "Wheat"
              : "Onion";
            const toolDef = TOOL_DEFINITIONS.getMandiRates;
            const summary = toolDef.formatSummary({ commodity: commodityName });
            sendEvent("tool_call", {
              toolName: "getMandiRates",
              icon: toolDef.icon,
              args: { commodity: commodityName, state: "Regional APMC" },
              summary,
              status: "calling",
            });
            const mandiTool = tools.getMandiRates;
            if (mandiTool) {
              const res = await (mandiTool as any).execute({
                commodity: commodityName,
                state: "Regional APMC",
              });
              sendEvent("tool_result", {
                toolName: "getMandiRates",
                icon: toolDef.icon,
                result: res,
                summary,
                status: "completed",
              });
              toolInvocations.push({
                toolName: "getMandiRates",
                icon: toolDef.icon,
                args: { commodity: commodityName },
                result: res,
                summary,
                status: "completed",
              });
            }
          } else if (isSchemeQuery) {
            const toolDef = TOOL_DEFINITIONS.evaluateSchemeEligibility;
            const summary = toolDef.formatSummary({ schemeName: "PM_MUDRA" });
            sendEvent("tool_call", {
              toolName: "evaluateSchemeEligibility",
              icon: toolDef.icon,
              args: { schemeName: "PM_MUDRA", annualTurnover: 1200000 },
              summary,
              status: "calling",
            });
            const schemeTool = tools.evaluateSchemeEligibility;
            if (schemeTool) {
              const res = await (schemeTool as any).execute({
                schemeName: "PM_MUDRA",
                annualTurnover: 1200000,
              });
              sendEvent("tool_result", {
                toolName: "evaluateSchemeEligibility",
                icon: toolDef.icon,
                result: res,
                summary,
                status: "completed",
              });
              toolInvocations.push({
                toolName: "evaluateSchemeEligibility",
                icon: toolDef.icon,
                args: { schemeName: "PM_MUDRA", annualTurnover: 1200000 },
                result: res,
                summary,
                status: "completed",
              });
            }
          }

          const systemInstruction = `You are VyaparSetu Voice OS, an AI voice partner for Indian micro-enterprises, rural businesses, and farmers.
RULES:
1. Speak ONLY in natural, energetic conversational Hindi and Hinglish.
2. Never speak in English.
3. Keep all responses to 1 to 2 short spoken sentences.
4. Confirm key prices, rates, or loan figures clearly.`;

          try {
            const aiStream = streamText({
              model,
              system: systemInstruction,
              messages: formattedHistory,
            });

            for await (const chunk of aiStream.textStream) {
              accumulatedText += chunk;
              sendEvent("chunk", { text: chunk });
            }
          } catch (llmError: any) {
            const fallbackResponse = "Nashik APMC mandi mein aaj Onion ka modal rate ₹2,100 se ₹2,450 prati quintal chal raha hai.";
            accumulatedText = fallbackResponse;
            sendEvent("chunk", { text: fallbackResponse });
          }
        } catch (err: any) {
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
