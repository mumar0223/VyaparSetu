import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, tool, isStepCount } from "ai";
import { z } from "zod";

async function main() {
  console.log("================================================================================");
  console.log("   VyaparSetu Multi-Turn Single-Tool Architecture Accuracy Test (v2)");
  console.log("================================================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const modelId = "gemini-3.7-flash";

  if (!project || !clientEmail || !privateKey) {
    throw new Error("Missing Google Vertex credentials in .env");
  }

  const vertex = createVertex({
    project,
    location,
    googleAuthOptions: {
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    },
  });

  const model = vertex(modelId as any);

  // ── THE SINGLE TOOL DEFINITION ──
  let lastDispatchedAction: any = null;

  const tools = {
    triggerScreenAction: tool({
      description: `Call this tool ONLY when the user genuinely asks to display, create, or modify an on-screen item (loan form, mandi rate, expense, budget, or chart).
DO NOT call this tool for casual greetings, casual praise, or when you are asking the user for missing details.
Pass simple plain text in the query parameter.`,
      parameters: z.object({
        actionType: z.enum([
          "form",
          "mandi_rates",
          "chart",
          "budget",
          "expense",
          "debt",
          "competitors",
          "other",
        ]).describe("Category of action to show on screen"),
        query: z.string().describe("Concise plain-text details: bank, crop, amount, location, or requested modification"),
      }),
      execute: async ({ actionType, query }) => {
        lastDispatchedAction = { actionType, query };
        console.log(`\n   ⚡ [TOOL EXECUTED: triggerScreenAction]`);
        console.log(`      • actionType: "${actionType}"`);
        console.log(`      • query:      "${query}"`);
        return {
          success: true,
          status: "dispatched_to_subagent",
          renderedArtifact: `${actionType.toUpperCase()}: ${query}`,
        };
      },
    }),
  };

  const systemInstruction = `You are VyaparSetu Voice (व्यापारसेतु), a male AI business advisor for Indian shopkeepers, traders, and farmers.
You converse naturally in friendly Hindi/Hinglish.

CRITICAL RULES FOR "triggerScreenAction" TOOL CALLING:
1. ONLY call "triggerScreenAction" when the user gives you a concrete, actionable request to display or create something on their screen (e.g. creating a loan form, fetching mandi rates, modifying an amount, logging an expense).
2. DO NOT call "triggerScreenAction" when:
   - The user is just saying hello, thank you, or chit-chatting.
   - The user's request is too vague and you need to ask clarifying questions first (e.g. if user asks for a loan form but doesn't mention which bank or how much, first ask them politely: "Aap kis bank me chahte hain aur kitna loan amount?").
   - The user is giving casual feedback (e.g. "form achha lag raha hai", "badhiya hai").
3. When the user asks to modify an existing item (e.g. "change amount to 8 lakhs"), call "triggerScreenAction" with actionType: "form" and the modification query.
4. Keep all spoken responses concise (1 to 2 short natural spoken sentences).`;

  // ── 5-Turn Test Conversation Definition ──
  const conversationTurns = [
    {
      turn: 1,
      name: "Turn 1: Incomplete / Vague Request",
      userQuery: "Namaste bhai, mujhe ek loan form chahiye dhandhe ke liye.",
      expectedToolCall: false,
      reason: "User didn't specify bank or amount; agent should ask clarifying questions without calling tool.",
    },
    {
      turn: 2,
      name: "Turn 2: Concrete Action with Bank & Amount",
      userQuery: "Canara bank me khata hai mera, 5 lakh ka Mudra loan form bana do.",
      expectedToolCall: true,
      expectedActionType: "form",
      reason: "User provided bank and amount; agent must call triggerScreenAction.",
    },
    {
      turn: 3,
      name: "Turn 3: Casual Praise / Feedback (Token Waste Trap)",
      userQuery: "Haan form to achha lag raha hai, badhiya banaya hai.",
      expectedToolCall: false,
      reason: "Casual feedback; agent should say thank you and NOT call tool.",
    },
    {
      turn: 4,
      name: "Turn 4: In-Place Modification Request",
      userQuery: "Isme loan amount badal kar 8 lakh kar do bhai.",
      expectedToolCall: true,
      expectedActionType: "form",
      reason: "User asked to modify existing form amount; agent must call triggerScreenAction.",
    },
    {
      turn: 5,
      name: "Turn 5: Switch to Mandi Commodity Query",
      userQuery: "Aur Gorakhpur me gehun ka mandi rate kya chal raha hai?",
      expectedToolCall: true,
      expectedActionType: "mandi_rates",
      reason: "User asked for mandi rates; agent must call triggerScreenAction.",
    },
  ];

  let conversationHistory: any[] = [];
  const results: Array<{
    turn: number;
    name: string;
    userQuery: string;
    assistantReply: string;
    toolCalled: boolean;
    toolCallDetails: any;
    expectedToolCall: boolean;
    pass: boolean;
    latencyMs: number;
  }> = [];

  for (const t of conversationTurns) {
    console.log("--------------------------------------------------------------------------------");
    console.log(`💬 [${t.name}]`);
    console.log(`   User: "${t.userQuery}"`);
    console.log(`   Expected: Tool Call = ${t.expectedToolCall ? "✅ YES" : "❌ NO"}`);

    conversationHistory.push({ role: "user", content: t.userQuery });

    const turnStart = Date.now();
    lastDispatchedAction = null;

    try {
      const response = await generateText({
        model,
        system: systemInstruction,
        messages: conversationHistory,
        tools,
        stopWhen: isStepCount(5),
      });

      const latencyMs = Date.now() - turnStart;
      const turnToolCalled = lastDispatchedAction !== null;
      const turnToolDetails = lastDispatchedAction;

      const replyText = response.text?.trim() || "Action completed";
      console.log(`\n   🗣️ Assistant Response (${latencyMs}ms):`);
      console.log(`      "${replyText}"`);

      // Update conversation history using standard message objects
      conversationHistory.push({ role: "assistant", content: replyText });

      // Evaluate Pass / Fail
      let pass = turnToolCalled === t.expectedToolCall;
      if (t.expectedToolCall && t.expectedActionType) {
        if (turnToolDetails?.actionType !== t.expectedActionType) {
          pass = false;
        }
      }

      console.log(`\n   Evaluation: ${pass ? "🎯 PASS" : "❌ FAIL"}`);
      if (!pass) {
        console.log(`      Reason: Expected toolCall=${t.expectedToolCall} (${t.expectedActionType || "none"}), got=${turnToolCalled} (${turnToolDetails?.actionType || "none"})`);
      }

      results.push({
        turn: t.turn,
        name: t.name,
        userQuery: t.userQuery,
        assistantReply: replyText,
        toolCalled: turnToolCalled,
        toolCallDetails: turnToolDetails,
        expectedToolCall: t.expectedToolCall,
        pass,
        latencyMs,
      });
    } catch (err: any) {
      console.error(`   ❌ Error in turn ${t.turn}:`, err?.message);
      results.push({
        turn: t.turn,
        name: t.name,
        userQuery: t.userQuery,
        assistantReply: "Error",
        toolCalled: false,
        toolCallDetails: null,
        expectedToolCall: t.expectedToolCall,
        pass: false,
        latencyMs: Date.now() - turnStart,
      });
    }

    console.log();
  }

  // ── FINAL SUMMARY REPORT ──
  console.log("================================================================================");
  console.log("   MULTI-TURN SINGLE-TOOL ACCURACY SCORECARD");
  console.log("================================================================================");

  const passedCount = results.filter((r) => r.pass).length;
  const accuracy = Math.round((passedCount / results.length) * 100);

  for (const r of results) {
    const statusIcon = r.pass ? "✅ PASS" : "❌ FAIL";
    const toolInfo = r.toolCalled
      ? `Tool called: [${r.toolCallDetails?.actionType}] "${r.toolCallDetails?.query}"`
      : "No tool called (pure conversational)";
    console.log(`Turn ${r.turn}: ${statusIcon} | ${r.name}`);
    console.log(`        Result: ${toolInfo} (${r.latencyMs}ms)`);
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`Overall Accuracy: ${passedCount} / ${results.length} (${accuracy}%)`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("❌ Test Script Failed:", err);
  process.exit(1);
});
