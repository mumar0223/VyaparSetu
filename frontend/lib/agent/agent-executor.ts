import { generateText } from "ai";
import { getLanguageModel } from "./ai-provider";
import { getAgentTools } from "./tools";
import type {
  AgentState,
  ExecutorConfig,
  ExecutionResult,
  AgentMessage,
  SendEvent,
} from "./types";

// ─── Default System Prompt ────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `You are VyaparSetu's Autonomous AI Agent.
You provide hyper-local business advisory, financial structuring, scheme eligibility, and operational assistance for rural micro-entrepreneurs.
Reason through the user's problem step-by-step, invoke relevant tools when needed, and deliver precise, actionable solutions.`;

// ─── Direct ReAct Agent Loop ─────────────────────────────

export async function executeAgent(
  config: ExecutorConfig,
): Promise<ExecutionResult> {
  const {
    ctx = {},
    sessionId,
    systemInstruction = DEFAULT_SYSTEM_PROMPT,
    messages,
    sendEvent = () => {},
    isAborted,
    abortSignal,
    maxIterations = 10,
    provider = "openai",
    model,
    temperature,
  } = config;

  let agentState: AgentState = {
    status: "RUNNING",
    iterations: 0,
    notes: [],
  };

  let currentMessages: AgentMessage[] = [...messages];
  let finalText = "";
  let waitingForInput = false;

  console.log(
    `[AGENT-LOOP] Starting agent execution loop (Session: ${sessionId || "default"})`,
  );

  // Early abort check
  if (isAborted?.() || abortSignal?.aborted) {
    console.log(`[AGENT-LOOP] Execution aborted before start.`);
    agentState.status = "ABORTED";
    sendEvent("ABORTED", { sessionId });
    return {
      finalState: agentState,
      messages: currentMessages,
      text: "",
      waitingForInput: false,
    };
  }

  sendEvent("INIT", { sessionId, status: "RUNNING" });

  const tools = getAgentTools(ctx);
  const modelInstance = getLanguageModel(provider, model);
  const hasTools = Object.keys(tools).length > 0;

  while (agentState.iterations < maxIterations) {
    // 1. Check Abort Signal
    if (isAborted?.() || abortSignal?.aborted) {
      console.log(
        `[AGENT-LOOP] Execution aborted at iteration ${agentState.iterations}`,
      );
      agentState.status = "ABORTED";
      sendEvent("ABORTED", { sessionId, iteration: agentState.iterations });
      break;
    }

    agentState.iterations++;
    console.log(
      `[AGENT-LOOP] Iteration ${agentState.iterations}/${maxIterations}`,
    );

    try {
      // 2. Call Language Model with Vercel AI SDK (with instant abort support)
      const result = await generateText({
        model: modelInstance,
        system: systemInstruction,
        messages: currentMessages as any,
        tools: hasTools ? (tools as any) : undefined,
        temperature,
        abortSignal,
      });

      const textContent = result.text || "";
      const toolCalls = result.toolCalls || [];
      const toolResults = result.toolResults || [];

      if (textContent) {
        finalText = textContent;
        sendEvent("AGENT_THOUGHT", {
          textContent,
          iteration: agentState.iterations,
        });
      }

      // 3. Append response messages using modern non-deprecated responseMessages
      if (result.responseMessages && result.responseMessages.length > 0) {
        currentMessages.push(
          ...(result.responseMessages as any[] as AgentMessage[]),
        );
      } else if (textContent) {
        currentMessages.push({
          role: "assistant",
          content: textContent,
        });
      }

      // 4. Process Tool Results
      if (toolResults.length > 0) {
        for (const tr of toolResults as any[]) {
          const toolArgs = tr.input || tr.args;
          const toolResultValue = tr.output !== undefined ? tr.output : tr.result;

          sendEvent("TOOL_ACTIVE", {
            toolName: tr.toolName,
            args: toolArgs,
            iteration: agentState.iterations,
          });

          sendEvent("TOOL_RESULT", {
            toolName: tr.toolName,
            args: toolArgs,
            result: toolResultValue,
            iteration: agentState.iterations,
          });

          // Check for human-in-the-loop pause requirement
          if (toolResultValue && typeof toolResultValue === "object" && toolResultValue.pauseExecution) {
            agentState.status = "WAITING_INPUT";
            sendEvent("WAITING_INPUT", {
              toolName: tr.toolName,
              data: toolResultValue,
            });
            return {
              finalState: agentState,
              messages: currentMessages,
              waitingForInput: true,
              text: finalText,
            };
          }
        }
      }

      // 5. Stopping Condition: No tools called (Model finished response)
      if (toolCalls.length === 0) {
        console.log(
          `[AGENT-LOOP] Model finished naturally (no further tool calls).`,
        );
        break;
      }
    } catch (err: any) {
      if (err.name === "AbortError" || isAborted?.() || abortSignal?.aborted) {
        console.log(
          `[AGENT-LOOP] Execution aborted during generation at iteration ${agentState.iterations}`,
        );
        agentState.status = "ABORTED";
        sendEvent("ABORTED", {
          sessionId,
          iteration: agentState.iterations,
        });
        return {
          finalState: agentState,
          messages: currentMessages,
          text: finalText,
          waitingForInput: false,
        };
      }

      console.error(
        `[AGENT-LOOP] Error in iteration ${agentState.iterations}:`,
        err,
      );
      agentState.status = "ERROR";
      agentState.error = err.message;
      sendEvent("ERROR", {
        message: err.message,
        iteration: agentState.iterations,
      });
      return {
        finalState: agentState,
        messages: currentMessages,
        text: finalText,
        waitingForInput: false,
        error: err.message,
      };
    }
  }

  // Final status update
  if (agentState.status !== "ABORTED" && agentState.status !== "ERROR") {
    agentState.status = "COMPLETED";
    sendEvent("COMPLETED", {
      sessionId,
      text: finalText,
      iterations: agentState.iterations,
    });
  }

  return {
    finalState: agentState,
    messages: currentMessages,
    text: finalText,
    waitingForInput,
  };
}

// ─── Alias Export for Loop ───────────────────────────────

export const runAgentLoop = executeAgent;
