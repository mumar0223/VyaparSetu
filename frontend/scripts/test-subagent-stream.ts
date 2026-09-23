import dotenv from "dotenv";
dotenv.config();

import { getAgentTools, TOOL_DEFINITIONS } from "../lib/agent/tools";
import { getLanguageModel } from "../lib/agent/ai-provider";
import { DASHBOARD_CHAT_CONFIG } from "../lib/agent/chat-config";
import { streamText, isStepCount } from "ai";

async function testSubAgentSSELogic() {
  console.log("================================================================================");
  console.log("   Testing Sub-Agent Autonomous Research & SSE Tool Streaming (Gemini 3.7 Flash)");
  console.log("================================================================================\n");

  const query = "एसबीआई पीएमईजीपी लोन का फॉर्म बना दो";
  const actionType = "form";

  const tools = getAgentTools({
    userId: "test-user-id",
    conversationId: "test-conv-id",
  });

  const model = getLanguageModel(
    DASHBOARD_CHAT_CONFIG.provider,
    DASHBOARD_CHAT_CONFIG.model
  );

  console.log(`Model: ${DASHBOARD_CHAT_CONFIG.provider} -> ${DASHBOARD_CHAT_CONFIG.model}`);
  console.log(`Query: "${query}"\n`);

  const events: any[] = [];
  const sendEvent = (event: string, data: any) => {
    events.push({ event, data });
    console.log(`📡 [SSE Event: "${event}"] ->`, typeof data === "object" ? JSON.stringify(data).slice(0, 150) + "..." : data);
  };

  sendEvent("status", {
    status: "working",
    activeTool: "research",
    description: `Starting autonomous execution for: "${query}"`,
    spokenHint: "Maine aapka task shuru kar diya hai, screen par dekhte rahiye.",
    progressPhase: "starting",
  });

  const wrappedTools: Record<string, any> = {};
  for (const [name, t] of Object.entries(tools)) {
    wrappedTools[name] = {
      ...t,
      execute: async (toolArgs: any, context: any) => {
        if (name === "webSearch") {
          sendEvent("status", {
            status: "working",
            activeTool: "webSearch",
            description: `Searching official guidelines for: ${toolArgs.query || query}`,
            spokenHint: "Main abhi official portal par niyam aur zaroori documents search kar raha hoon, bas thoda intezar kijiye.",
            progressPhase: "researching",
          });
        } else if (name === "stageForm") {
          sendEvent("status", {
            status: "working",
            activeTool: "stageForm",
            description: `Generating dynamic MSME form: "${toolArgs.title || query}"`,
            spokenHint: "Form ke chaar sections aur zaroori fields screen par assemble ho rahe hain, lagbhag taiyar hai.",
            progressPhase: "building_form",
          });
        }

        const def = (TOOL_DEFINITIONS as any)[name] || {
          icon: "bot",
          formatSummary: () => `Executing ${name}...`,
        };
        const summary =
          typeof def.formatSummary === "function"
            ? def.formatSummary(toolArgs)
            : `Executing ${name}...`;

        sendEvent("tool_call", {
          toolName: name,
          args: toolArgs,
          summary,
        });

        let toolOut: any = null;
        try {
          toolOut = await (t as any).execute(toolArgs, context);
        } catch (execErr: any) {
          toolOut = { success: false, error: execErr?.message || "Execution error" };
        }

        sendEvent("tool_result", {
          toolName: name,
          result: toolOut,
          status: "completed",
        });

        if (toolOut?.isArtifact) {
          sendEvent("artifact", {
            artifactId: toolOut.artifactId || toolOut.data?.artifactId,
            title: toolOut.title,
            summary: toolOut.summary,
          });

          sendEvent("status", {
            status: "completed",
            activeTool: "completed",
            description: `Completed: ${toolOut.title || "Item ready"}`,
            spokenHint: `${toolOut.title || "Aapka form"} bilkul taiyar hai aur screen par open ho chuka hai.`,
            progressPhase: "completed",
          });
        }

        return toolOut;
      },
    };
  }

  const systemInstruction = `You are VyaparSetu's specialized Autonomous Chat AI Sub-Agent running on Google Cloud Vertex AI (Gemini 3.7 Flash).
User Action Request: "${query}"
Target Action Category: "${actionType}"

AUTONOMOUS EXECUTION PROTOCOL (MANDATORY):
1. FOR LOAN & GOVT SCHEME FORMS:
   • Step 1: FIRST invoke 'webSearch' to find official guidelines, eligibility requirements, and documents.
   • Step 2: NEXT invoke 'stageForm' with complete, real-world sections based on search results.
Execute now.`;

  const startTime = Date.now();
  const aiStream = streamText({
    model,
    system: systemInstruction,
    messages: [{ role: "user", content: `Please research and stage the requested item on screen: "${query}". Execute the appropriate tools now.` }],
    tools: wrappedTools as any,
    stopWhen: isStepCount(4),
  });

  for await (const part of (aiStream as any).fullStream) {
    if (part.type === "text-delta" || part.type === "text") {
      const text = part.textDelta ?? part.text ?? "";
      if (text) {
        process.stdout.write(text.slice(0, 30));
      }
    }
  }

  console.log(`\n\nStream finished in ${Date.now() - startTime}ms. Total events dispatched: ${events.length}`);
  const hasArtifact = events.some((e) => e.event === "artifact");
  const hasWebSearch = events.some((e) => e.event === "tool_call" && e.data.toolName === "webSearch");
  const hasStageForm = events.some((e) => e.event === "tool_call" && e.data.toolName === "stageForm");

  console.log(`- WebSearch executed: ${hasWebSearch ? "YES ✅" : "NO ❌"}`);
  console.log(`- StageForm executed: ${hasStageForm ? "YES ✅" : "NO ❌"}`);
  console.log(`- Artifact generated: ${hasArtifact ? "YES ✅" : "NO ❌"}`);
}

testSubAgentSSELogic().catch(console.error);
