import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, tool } from "ai";
import { z } from "zod";

/**
 * VyaparSetu - Google Cloud Vertex AI Multi-Step Tool Calling & Response Synthesis
 * Uses Service Account Credentials with location = "global" and model = "gemini-3.7-flash"
 */
async function main() {
  console.log("================================================================================");
  console.log("   Google Cloud Vertex AI Tool Calling & Text Response Synthesis (GLOBAL)");
  console.log("================================================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const modelId = process.env.GOOGLE_VERTEX_MODEL || "gemini-3.7-flash";

  console.log(`[Config] Project: ${project}`);
  console.log(`[Config] Location: ${location}`);
  console.log(`[Config] Service Account: ${clientEmail}`);
  console.log(`[Config] Model ID: ${modelId}\n`);

  if (!project || !clientEmail || !privateKey) {
    throw new Error("Missing required Vertex AI credentials in .env");
  }

  // 1. Initialize Google Cloud Vertex AI Provider
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

  // 2. Define Domain Tools
  const tools = {
    getMandiRates: tool({
      description: "Fetches real-time APMC mandi prices and market arrivals for agricultural commodities.",
      parameters: z.object({
        commodity: z.string().describe("Name of commodity e.g. Onion, Wheat"),
        state: z.string().optional().describe("State or region e.g. Maharashtra"),
      }),
      execute: async ({ commodity, state }) => {
        console.log(`\n⚡ [TOOL RUN] getMandiRates("${commodity}", "${state || "Maharashtra"}")`);
        return {
          commodity: commodity || "Onion",
          market: "Nashik APMC Market, Maharashtra",
          modalPrice: "₹1,850 / quintal",
          priceRange: "₹1,650 - ₹2,100 / quintal",
          arrivals: "450 Quintals (Moderate)",
          trend: "+3.8% Bullish this week",
          recommendation: "Current rates are favorable for immediate sale or storing in ventilated units.",
        };
      },
    }),

    stageBudgetDraft: tool({
      description: "Stages a structured financial budget breakdown for micro-enterprise operations.",
      parameters: z.object({
        title: z.string().describe("Budget title e.g. Onion Storage Warehouse Expansion"),
        totalAmount: z.number().describe("Total budget allocation in INR"),
      }),
      execute: async ({ title, totalAmount }) => {
        console.log(`\n⚡ [TOOL RUN] stageBudgetDraft("${title}", ₹${totalAmount})`);
        return {
          status: "STAGED_SUCCESS",
          title: title || "Warehouse Expansion",
          totalAmount: `₹${totalAmount.toLocaleString("en-IN")}`,
          breakdown: [
            { item: "Civil Work & Concrete Flooring", amount: "₹1,10,000" },
            { item: "Ventilation Fans & Storage Racks", amount: "₹60,000" },
            { item: "Sorting Crates & Packaging Units", amount: "₹30,000" },
          ],
          fundingAdvice: "Eligible for PM Mudra Kishore Loan (₹50,000 - ₹5,00,000) at 8.5% interest.",
        };
      },
    }),
  };

  const prompt =
    "Namaste! Meri ₹12,00,000 turnover hai Maharashtra me. Aaj ka Nashik Onion mandi price check kijiye aur ₹2,00,000 ka warehouse storage expansion budget stage karke mujhe detail me Hinglish me samjhaiye.";

  console.log(`💬 [User Prompt]:\n"${prompt}"\n`);
  console.log("⚡ Executing Multi-Step Tool Reasoning on Google Cloud Vertex AI...\n");

  const startTime = Date.now();

  const response = await generateText({
    model,
    prompt,
    tools,
    maxSteps: 5,
    system:
      "You are VyaparSetu's autonomous business advisor for rural micro-entrepreneurs. Speak natural conversational Hinglish. When tools return results, synthesize the information thoroughly and provide clear, actionable guidance to the entrepreneur.",
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n================================================================================`);
  console.log(`  ✅ SUCCESS! Response Received from Vertex AI in ${duration}s`);
  console.log(`================================================================================\n`);

  console.log("🎙️ [GEMINI'S FINAL TEXT RESPONSE TO ENTREPRENEUR]:\n");
  console.log(response.text);
  console.log("\n================================================================================\n");

  if (response.steps && response.steps.length > 0) {
    console.log(`Total Steps Executed: ${response.steps.length}`);
    response.steps.forEach((step, idx) => {
      if (step.toolCalls && step.toolCalls.length > 0) {
        console.log(`Step ${idx + 1}: Invoked ${step.toolCalls.map((t) => t.toolName).join(", ")}`);
      }
    });
  }
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("\n❌ Vertex AI Execution Failed:", err);
  process.exit(1);
});
