import dotenv from "dotenv";
dotenv.config();

import { executeAgent } from "../lib/agent";

async function main() {
  console.log("==================================================");
  console.log("  VyaparSetu Autonomous AI Agent Loop Test");
  console.log("==================================================\n");

  const prompt = `I am a rural trader in Maharashtra with an annual turnover of ₹12,00,000. 
Can you check what is today's mandi price for Onion, and evaluate which PM Mudra loan category I qualify for to expand my storage warehouse?`;

  console.log(`[User Prompt]:\n"${prompt}"\n`);
  console.log("--- Starting Agent Execution Loop ---");

  const startTime = Date.now();

  const result = await executeAgent({
    sessionId: "test-session-001",
    provider: "vertex",
    model: process.env.GOOGLE_VERTEX_MODEL || "gemini-3.7-flash",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    sendEvent: (type, payload) => {
      const timeOffset = ((Date.now() - startTime) / 1000).toFixed(2);
      if (type === "AGENT_THOUGHT") {
        console.log(`\n[+${timeOffset}s EVENT: ${type}] (Iteration ${payload.iteration}):\n${payload.textContent}`);
      } else if (type === "TOOL_ACTIVE") {
        console.log(`\n[+${timeOffset}s EVENT: ${type}]: Invoking "${payload.toolName}" with args:`, JSON.stringify(payload.args));
      } else if (type === "TOOL_RESULT") {
        console.log(`[+${timeOffset}s EVENT: ${type}]: Tool "${payload.toolName}" returned:`, JSON.stringify(payload.result, null, 2));
      } else {
        console.log(`[+${timeOffset}s EVENT: ${type}]:`, JSON.stringify(payload));
      }
    },
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n==================================================");
  console.log(`  Agent Execution Finished in ${duration}s`);
  console.log(`  Final Status: ${result.finalState.status}`);
  console.log(`  Total Iterations: ${result.finalState.iterations}`);
  console.log("==================================================\n");

  console.log("[Final Text Response]:\n");
  console.log(result.text);
  console.log("\n==================================================");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
