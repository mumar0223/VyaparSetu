import dotenv from "dotenv";
dotenv.config();

import { getAgentTools } from "../lib/agent/tools";
import { getLanguageModel } from "../lib/agent/ai-provider";
import { DASHBOARD_CHAT_CONFIG } from "../lib/agent/chat-config";
import { generateText, isStepCount } from "ai";

async function testSubAgentLogic() {
  console.log("Testing subagent execution with real credentials...");
  const tools = getAgentTools({
    userId: "test-user-id",
    conversationId: "test-conv-id",
  });

  const toolName = "stageForm";
  const args = {
    actionType: "form",
    query: "एसबीआई पीएमईजीपी लोन का फॉर्म बना दो",
  };

  console.log("DASHBOARD_CHAT_CONFIG:", DASHBOARD_CHAT_CONFIG);

  try {
    const model = getLanguageModel(
      DASHBOARD_CHAT_CONFIG.provider,
      DASHBOARD_CHAT_CONFIG.model,
    );

    console.log("Model instantiated:", Boolean(model));

    const wrappedTools: Record<string, any> = {};
    let capturedResult: any = null;
    for (const [name, t] of Object.entries(tools)) {
      wrappedTools[name] = {
        ...t,
        execute: async (toolArgs: any, context: any) => {
          console.log(`Tool ${name} called by Sub-Agent!`);
          const out = await (t as any).execute(toolArgs, context);
          if (out && (out.isArtifact || out.success)) {
            capturedResult = out;
          }
          return out;
        },
      };
    }

    const prompt = `You are VyaparSetu's specialized Chat AI Sub-Agent running on Google Cloud Vertex AI (Gemini 3.7 Flash).
A voice user asked to create, display, or modify an on-screen item: "${args.query}".
Target tool category: "${toolName}".
User parameters passed: ${JSON.stringify(args)}.

CRITICAL TASK:
You MUST invoke the appropriate tool with complete, authentic, professional Indian MSME / banking / trade fields.
Execute the tool now.`;

    const start = Date.now();
    console.log("Invoking generateText...");
    await generateText({
      model,
      messages: [{ role: "user", content: prompt }],
      tools: wrappedTools as any,
      stopWhen: isStepCount(3),
    });

    console.log(`generateText finished in ${Date.now() - start}ms`);
    console.log("capturedResult:", capturedResult ? "SUCCESS" : "NULL");
  } catch (err: any) {
    console.error("Caught error during Sub-Agent execution:", err);
  }
}

testSubAgentLogic().catch(console.error);
