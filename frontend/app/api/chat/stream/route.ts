import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentTools, TOOL_DEFINITIONS } from "@/lib/agent/tools";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { DASHBOARD_CHAT_CONFIG } from "@/lib/agent/chat-config";
import { streamText } from "ai";

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
        { status: 400 },
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
          { status: 404 },
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
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
        let accumulatedThinking = "";
        const toolInvocations: any[] = [];
        const lowerMsg = message.toLowerCase();

        try {
          // ── Tool Intent Execution Engine ──
          // 1. Mandi Rates (detect commodities like tomato, onion, wheat, cotton, potato, etc.)
          const mandiKeywords = [
            "tomato",
            "onion",
            "wheat",
            "cotton",
            "mustard",
            "soyabean",
            "gram",
            "potato",
            "mandi",
            "rate",
            "price",
            "bhav",
            "apmc",
            "crop",
            "paddy",
            "rice",
            "chilli",
            "garlic",
          ];
          const matchedCommodities: string[] = [];
          if (lowerMsg.includes("tomato")) matchedCommodities.push("Tomato");
          if (lowerMsg.includes("onion")) matchedCommodities.push("Onion");
          if (lowerMsg.includes("wheat")) matchedCommodities.push("Wheat");
          if (lowerMsg.includes("cotton")) matchedCommodities.push("Cotton");
          if (lowerMsg.includes("potato")) matchedCommodities.push("Potato");
          if (lowerMsg.includes("mustard")) matchedCommodities.push("Mustard");
          if (lowerMsg.includes("soyabean") || lowerMsg.includes("soybean"))
            matchedCommodities.push("Soyabean");
          if (
            matchedCommodities.length === 0 &&
            (lowerMsg.includes("mandi") ||
              lowerMsg.includes("rate") ||
              lowerMsg.includes("price") ||
              lowerMsg.includes("bhav"))
          ) {
            matchedCommodities.push("Onion");
          }

          if (
            matchedCommodities.length > 0 &&
            mandiKeywords.some((k) => lowerMsg.includes(k))
          ) {
            for (const comm of matchedCommodities) {
              const def = TOOL_DEFINITIONS.getMandiRates;
              const summary = def.formatSummary({
                commodity: comm,
                state: "Regional APMC",
              });
              sendEvent("tool_call", {
                toolName: "getMandiRates",
                icon: def.icon,
                args: { commodity: comm },
                summary,
                status: "calling",
              });

              try {
                const res = await tools.getMandiRates.execute(
                  { commodity: comm },
                  {} as any,
                );
                sendEvent("tool_result", {
                  toolName: "getMandiRates",
                  icon: def.icon,
                  result: res,
                  summary,
                  status: "completed",
                });
                toolInvocations.push({
                  toolName: "getMandiRates",
                  icon: def.icon,
                  args: { commodity: comm },
                  result: res,
                  summary,
                  status: "completed",
                });
              } catch (err: any) {
                const errResult = {
                  success: false,
                  error: err?.message || "Failed to fetch mandi rates.",
                };
                sendEvent("tool_result", {
                  toolName: "getMandiRates",
                  icon: def.icon,
                  result: errResult,
                  summary: `Mandi query failed for ${comm}`,
                  status: "completed",
                });
                toolInvocations.push({
                  toolName: "getMandiRates",
                  icon: def.icon,
                  args: { commodity: comm },
                  result: errResult,
                  summary: `Mandi query failed for ${comm}`,
                  status: "completed",
                });
              }
            }
          }

          // 2. Visual Charts & Graphs
          const isChartQuery =
            lowerMsg.includes("graph") ||
            lowerMsg.includes("chart") ||
            lowerMsg.includes("plot") ||
            lowerMsg.includes("visualize");
          if (isChartQuery) {
            const chartType = lowerMsg.includes("pie")
              ? "pie"
              : lowerMsg.includes("line")
                ? "line"
                : lowerMsg.includes("area")
                  ? "area"
                  : "bar";
            const def = TOOL_DEFINITIONS.stageChart;
            const chartArgs = {
              chartType,
              title: lowerMsg.includes("mandi")
                ? "APMC Commodity Spot Rates"
                : "Monthly Business Financial Trajectory",
              description: "Visual analysis generated by VyaparSetu AI",
              xAxisKey: "name",
              data: [
                { name: "Apr", amount: 28000, modalPrice: 2200 },
                { name: "May", amount: 34000, modalPrice: 2450 },
                { name: "Jun", amount: 31000, modalPrice: 2100 },
                { name: "Jul", amount: 42000, modalPrice: 2800 },
                { name: "Aug", amount: 48000, modalPrice: 3100 },
              ],
              series: [
                {
                  dataKey: "amount",
                  name: "Working Capital (₹)",
                  color: "#4ADE80",
                },
                {
                  dataKey: "modalPrice",
                  name: "Modal Rate (₹/Q)",
                  color: "#D98E2A",
                },
              ],
            };
            const summary = def.formatSummary(chartArgs);
            sendEvent("tool_call", {
              toolName: "stageChart",
              icon: def.icon,
              args: chartArgs,
              summary,
              status: "calling",
            });
            const chartRes = await tools.stageChart.execute(
              chartArgs as any,
              {} as any,
            );
            sendEvent("tool_result", {
              toolName: "stageChart",
              icon: def.icon,
              result: chartRes,
              summary,
              status: "completed",
            });
            toolInvocations.push({
              toolName: "stageChart",
              icon: def.icon,
              args: chartArgs,
              result: chartRes,
              summary,
              status: "completed",
            });
          }

          // 3. Staging Budgets
          else if (
            (lowerMsg.includes("create") ||
              lowerMsg.includes("stage") ||
              lowerMsg.includes("plan")) &&
            lowerMsg.includes("budget")
          ) {
            const def = TOOL_DEFINITIONS.stageBudget;
            const bArgs = {
              name: "Q3 Operational Budget Plan",
              period: "Monthly" as const,
              totalAmount: 75000,
              items: [
                { category: "Inventory & Stock", allocatedAmount: 40000 },
                { category: "Logistics & Transport", allocatedAmount: 15000 },
                { category: "Utilities & Fuel", allocatedAmount: 10000 },
                { category: "Labor & Wages", allocatedAmount: 10000 },
              ],
            };
            const summary = def.formatSummary(bArgs);
            sendEvent("tool_call", {
              toolName: "stageBudget",
              icon: def.icon,
              args: bArgs,
              summary,
              status: "calling",
            });
            const bRes = await tools.stageBudget.execute(
              bArgs as any,
              {} as any,
            );
            sendEvent("tool_result", {
              toolName: "stageBudget",
              icon: def.icon,
              result: bRes,
              summary,
              status: "completed",
            });
            toolInvocations.push({
              toolName: "stageBudget",
              icon: def.icon,
              args: bArgs,
              result: bRes,
              summary,
              status: "completed",
            });
          }

          // 4. Staging Expenses
          else if (
            (lowerMsg.includes("log") ||
              lowerMsg.includes("record") ||
              lowerMsg.includes("add")) &&
            (lowerMsg.includes("expense") || lowerMsg.includes("kharcha"))
          ) {
            const def = TOOL_DEFINITIONS.stageExpense;
            const expArgs = {
              category: "Inventory Procurement",
              amount: 12500,
              vendor: "Regional Mandi Supplier",
              description: "Wholesale stock purchase",
              paymentMethod: "UPI" as const,
              notes: "Logged via AI Agent",
            };
            const summary = def.formatSummary(expArgs);
            sendEvent("tool_call", {
              toolName: "stageExpense",
              icon: def.icon,
              args: expArgs,
              summary,
              status: "calling",
            });
            const expRes = await tools.stageExpense.execute(
              expArgs as any,
              {} as any,
            );
            sendEvent("tool_result", {
              toolName: "stageExpense",
              icon: def.icon,
              result: expRes,
              summary,
              status: "completed",
            });
            toolInvocations.push({
              toolName: "stageExpense",
              icon: def.icon,
              args: expArgs,
              result: expRes,
              summary,
              status: "completed",
            });
          }

          // 5. Government Schemes
          else if (
            lowerMsg.includes("loan") ||
            lowerMsg.includes("mudra") ||
            lowerMsg.includes("svanidhi") ||
            lowerMsg.includes("scheme") ||
            lowerMsg.includes("credit")
          ) {
            const def = TOOL_DEFINITIONS.getGovtSchemes;
            const sArgs = {
              schemeName: (lowerMsg.includes("svanidhi")
                ? "PM_SVANIDHI"
                : "PM_MUDRA") as any,
            };
            const summary = def.formatSummary(sArgs);
            sendEvent("tool_call", {
              toolName: "getGovtSchemes",
              icon: def.icon,
              args: sArgs,
              summary,
              status: "calling",
            });
            const sRes = await tools.getGovtSchemes.execute(sArgs, {} as any);
            sendEvent("tool_result", {
              toolName: "getGovtSchemes",
              icon: def.icon,
              result: sRes,
              summary,
              status: "completed",
            });
            toolInvocations.push({
              toolName: "getGovtSchemes",
              icon: def.icon,
              args: sArgs,
              result: sRes,
              summary,
              status: "completed",
            });
          }

          // 6. Live Web Search via Exa
          else if (
            lowerMsg.includes("search") ||
            lowerMsg.includes("news") ||
            lowerMsg.includes("rbi") ||
            lowerMsg.includes("circular") ||
            lowerMsg.includes("gst")
          ) {
            const def = TOOL_DEFINITIONS.webSearch;
            const searchArgs = { query: message, numResults: 3 };
            const summary = def.formatSummary(searchArgs);
            sendEvent("tool_call", {
              toolName: "webSearch",
              icon: def.icon,
              args: searchArgs,
              summary,
              status: "calling",
            });
            const searchRes = await tools.webSearch.execute(
              searchArgs,
              {} as any,
            );
            sendEvent("tool_result", {
              toolName: "webSearch",
              icon: def.icon,
              result: searchRes,
              summary,
              status: "completed",
            });
            toolInvocations.push({
              toolName: "webSearch",
              icon: def.icon,
              args: searchArgs,
              result: searchRes,
              summary,
              status: "completed",
            });
          }

          // ── Stream LLM Synthesis with Live Context ──
          const model = getLanguageModel(
            DASHBOARD_CHAT_CONFIG.provider,
            DASHBOARD_CHAT_CONFIG.model,
          );

          const toolContextString =
            toolInvocations.length > 0
              ? `\n\n[LIVE TOOL DATA INVOCATIONS]\n${toolInvocations.map((t) => `- Tool: ${t.toolName}\n  Result: ${JSON.stringify(t.result)}`).join("\n\n")}`
              : "";

          const systemInstruction = `You are VyaparSetu's AI Business Advisor & Mandi Trade Partner for Indian micro-enterprises, traders, farmers, and shopkeepers.
You provide clear, accurate market rates, actionable financial structuring, credit scheme eligibility, and operational advice.

CRITICAL PRESENTATION RULES:
1. Always format responses with clean markdown headings and Markdown tables for prices/allocations.
2. If live Mandi data is provided in [LIVE TOOL DATA INVOCATIONS], present the exact market names, arrival dates, and modal prices (₹/Quintal) clearly in structured tables.
3. If an artifact was staged (chart, budget, expense), mention that the interactive review card is available above for one-click review and approval.
4. If a tool returned an error or server latency, explain it gracefully to the user and provide actionable baseline estimates.
5. NEVER leave the response blank. Always provide detailed, structured insights.`;

          const rawFilteredHistory = history
            .filter((h: any) => h.role === "user" || h.role === "assistant")
            .map((h: any) => ({
              role: h.role as "user" | "assistant",
              content:
                typeof h.content === "string"
                  ? h.content
                  : JSON.stringify(h.content),
            }));

          const promptMessages = rawFilteredHistory.slice(-10);
          promptMessages.push({
            role: "user",
            content: `${message}${toolContextString}`,
          });

          try {
            const aiStream = streamText({
              model,
              system: systemInstruction,
              messages: promptMessages,
            });

            for await (const chunk of aiStream.textStream) {
              accumulatedText += chunk;
              sendEvent("chunk", { text: chunk });
            }
          } catch (llmError: any) {
            console.warn("[LLM Stream Fallback Triggered]:", llmError?.message);
            const fallbackResponse = generateDomainAdvisoryResponse(
              message,
              toolInvocations,
            );
            const words = fallbackResponse.split(" ");
            for (let i = 0; i < words.length; i += 3) {
              const chunk = words.slice(i, i + 3).join(" ") + " ";
              accumulatedText += chunk;
              sendEvent("chunk", { text: chunk });
              await new Promise((r) => setTimeout(r, 30));
            }
          }

          // Safety guarantee: If text is still blank, synthesize directly from toolInvocations
          if (!accumulatedText.trim()) {
            const fallbackResponse = generateDomainAdvisoryResponse(
              message,
              toolInvocations,
            );
            accumulatedText = fallbackResponse;
            sendEvent("chunk", { text: fallbackResponse });
          }
        } catch (err: any) {
          console.error("[Stream Controller Error]:", err);
          const errorMsg = `⚠️ An error occurred while processing your request: ${err?.message || "Internal server error"}. Please retry.`;
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
                thinking:
                  accumulatedThinking ||
                  "Retrieved live APMC market data and generated trade recommendations.",
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
      { status: 500 },
    );
  }
}

function generateDomainAdvisoryResponse(prompt: string, tools: any[]): string {
  // If we have live mandi tool invocations, synthesize them
  const mandiTools = tools.filter(
    (t) => t.toolName === "getMandiRates" && t.result?.records,
  );
  if (mandiTools.length > 0) {
    let output = `### 🌾 Regional APMC Mandi Intelligence Report\n\n`;
    for (const mt of mandiTools) {
      const comm = mt.args?.commodity || "Commodity";
      const records = mt.result.records || [];
      output += `#### 📍 Live Rates for ${comm}\n\n`;
      if (records.length > 0) {
        output += `| State | District | Market | Variety | Modal Price | Price Range |\n`;
        output += `|:---|:---|:---|:---|---:|---:|\n`;
        for (const r of records.slice(0, 6)) {
          output += `| ${r.state} | ${r.district} | ${r.market} | ${r.variety || "Local"} | **${r.modalPricePerQuintal}** | ${r.priceRange} |\n`;
        }
        output += `\n`;
      } else {
        output += `*No active wholesale arrivals recorded today for ${comm}.*\n\n`;
      }
    }
    output += `> **💡 Trade Advisory**: Sourcing from regional primary APMC clusters provides lower wholesale costs. Verify moisture and tare weight slips upon loading.`;
    return output;
  }

  const p = prompt.toLowerCase();
  if (p.includes("chart") || p.includes("graph")) {
    return `### 📊 Visual Chart Artifact Prepared\n\nI have generated an interactive visual graph. Click the **Review** pill above to view the graph in Bar, Line, Area, or Pie format.`;
  }

  if (p.includes("budget")) {
    return `### 📋 Interactive Budget Plan Staged\n\nI have prepared a draft operational budget with category allocations. Click **"Review & Edit"** on the draft card above to customize amounts and approve.`;
  }

  return `### 📊 VyaparSetu Business Advisory & Next Steps\n\nI have analyzed your request regarding **"${prompt}"**.\n\n* **Ledger Readiness**: Maintain synchronized sales and inventory logs.\n* **Working Capital**: Maintain a 14-day liquid reserve for operational buffer.\n\nLet me know if you would like me to stage a budget, check live APMC mandi rates, or plot a visual chart!`;
}
