import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, tool } from "ai";
import { z } from "zod";

async function inspect() {
  const vertex = createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT,
    location: "global",
    googleAuthOptions: {
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
    },
  });

  const model = vertex("gemini-2.5-flash");

  const mandiTool = tool({
    description: "Returns commodity mandi prices",
    parameters: z.object({ commodity: z.string() }),
    execute: async ({ commodity }) => ({ price: "₹1,850/quintal", status: "ok" }),
  });

  // Test 1: Single turn with tools
  const res = await generateText({
    model,
    prompt: "What is the price of Onion? Use tool and then explain.",
    tools: { mandiTool },
    maxSteps: 2,
  });

  console.log("res.text:", res.text);
  console.log("res.toolCalls:", res.toolCalls);
  console.log("res.toolResults:", res.toolResults);
  console.log("res.steps length:", res.steps.length);
  res.steps.forEach((s, idx) => {
    console.log(`Step ${idx + 1} text: "${s.text}", toolCalls:`, s.toolCalls);
  });
}

inspect().catch(console.error);
