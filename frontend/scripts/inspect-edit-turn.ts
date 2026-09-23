import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, tool, isStepCount } from "ai";
import { z } from "zod";

async function main() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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

  const model = vertex("gemini-3.7-flash" as any);

  const tools = {
    triggerScreenAction: tool({
      description: "Call this tool whenever an on-screen item (form, mandi rate, chart, expense) needs to be displayed or updated.",
      parameters: z.object({
        action: z.string().describe("What action e.g. 'update_loan_form', 'create_loan_form', 'mandi_rates'"),
        query: z.string().describe("Details: bank, amount, changes, location, or crop"),
      }),
      execute: async (args: any) => {
        console.log("⚡ RAW ARGS RECEIVED:", JSON.stringify(args));
        return { success: true, result: "Updated on screen" };
      },
    }),
  };

  const messages = [
    { role: "user", content: "Canara bank me 5 lakh ka mudra loan form bana do" },
    { role: "assistant", content: "Canara bank ka 5 lakh ka mudra loan form screen par bana diya hai." },
    { role: "user", content: "Isme loan amount badal kar 8 lakh kar do bhai." },
  ];

  console.log("Testing Turn 4 (In-place edit)...");
  const res = await generateText({
    model,
    system: "You are VyaparSetu Voice. When user asks to change or update a form on screen, call triggerScreenAction.",
    messages: messages as any,
    tools,
    stopWhen: isStepCount(2),
  });

  console.log("Assistant Response:", res.text);
  console.log("Tool Calls:", JSON.stringify(res.toolCalls, null, 2));
}

main().catch(console.error);
