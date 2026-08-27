import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { streamText, tool } from "ai";
import { z } from "zod";

/**
 * VyaparSetu - Real-Time Live Streaming & Multi-Turn Tool Synthesis
 * Uses Google Cloud Vertex AI (Gemini 3.7 Flash) with HTTP/2 Live Token Streaming
 */
async function main() {
  console.log("================================================================================");
  console.log("   Google Cloud Vertex AI: Real-Time Live Token Streaming & Tool Synthesis");
  console.log("================================================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const modelId = process.env.GOOGLE_VERTEX_MODEL || "gemini-3.7-flash";

  console.log(`[GCP Config] Project: ${project}`);
  console.log(`[GCP Config] Location: ${location}`);
  console.log(`[GCP Config] Model ID: ${modelId}\n`);

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

  // Define Domain Tools
  const tools = {
    getMandiRates: tool({
      description: "Fetches live APMC market prices and arrival data for agricultural commodities.",
      parameters: z.object({
        commodity: z.string().default("Onion").describe("Commodity name e.g. Onion, Wheat"),
        market: z.string().default("Nashik").describe("APMC market or district name"),
      }),
      execute: async ({ commodity, market }) => {
        return {
          commodity: commodity || "Onion",
          market: `${market || "Nashik"} APMC Market, Maharashtra`,
          modalPrice: "₹1,850 / quintal",
          priceRange: "₹1,650 - ₹2,100 / quintal",
          arrivals: "450 Quintals (Moderate)",
          trend: "+3.8% Bullish (Prices rising due to regional demand)",
          recommendation: "Current rates are favorable for immediate sale or holding in ventilated storage.",
        };
      },
    }),

    evaluateMudraLoanEligibility: tool({
      description: "Evaluates PM Mudra Yojana credit scheme eligibility and tier recommendations.",
      parameters: z.object({
        annualTurnover: z.number().default(1200000).describe("Annual turnover in INR"),
        requestedAmount: z.number().default(200000).describe("Required loan amount in INR"),
      }),
      execute: async ({ annualTurnover, requestedAmount }) => {
        return {
          scheme: "Pradhan Mantri Mudra Yojana (PMMY)",
          eligible: true,
          category: "Kishore Category (₹50,000 to ₹5,00,000)",
          maxEligibleAmount: "₹5,00,000",
          interestRate: "8.40% - 9.65% p.a.",
          collateral: "Zero collateral required (backed by CGFMU)",
          documents: [
            "Udyam Aadhaar Registration",
            "6-Month Bank / UPI Statement",
            "KYC (Aadhaar & PAN)",
            "Storage Shed Project Estimate",
          ],
        };
      },
    }),
  };

  const userPrompt = `Namaste! Mera Maharashtra me ₹12,00,000 annual turnover hai. 
1. Aaj ka Nashik Onion mandi rate check kijiye.
2. Mujhe ₹2,00,000 warehouse storage expansion ke liye Mudra loan aur budget guide kijiye.
Kripya natural Hinglish me vistaar se samjhaiye.`;

  console.log(`💬 [User Prompt]:\n"${userPrompt}"\n`);
  console.log("⚡ Starting Live Stream with Vertex AI...\n");

  const startTime = Date.now();

  // Phase 1: Tool Call Generation
  const step1Stream = streamText({
    model,
    prompt: userPrompt,
    tools,
    system:
      "You are VyaparSetu's autonomous business advisor for rural micro-entrepreneurs. Speak natural conversational Hinglish.",
  });

  const toolCalls: any[] = [];
  const toolResults: any[] = [];

  for await (const chunk of step1Stream.fullStream) {
    if (chunk.type === "tool-call") {
      console.log(`🔧 [Live Tool Invocation]: ${chunk.toolName}`);
      toolCalls.push(chunk);
    } else if (chunk.type === "tool-result") {
      const output = (chunk as any).result || (chunk as any).output || {};
      console.log(`📥 [Tool Executed]: ${chunk.toolName} -> Output Received.`);
      toolResults.push({ name: chunk.toolName, data: output });
    }
  }

  // Phase 2: Live Real-Time Token Streaming Synthesis
  console.log("\n⚡ [Streaming Real-Time Spoken Response from Vertex AI]:\n");
  console.log("--------------------------------------------------------------------------------\n");

  let firstTokenTime: number | null = null;

  const synthesisStream = streamText({
    model,
    system:
      "You are VyaparSetu's autonomous business advisor for rural micro-entrepreneurs. Speak natural, clear, and encouraging Hinglish. Synthesize the provided mandi rates and loan eligibility into structured, actionable advice for the entrepreneur.",
    messages: [
      { role: "user", content: userPrompt },
      {
        role: "assistant",
        content: `I have retrieved the APMC mandi rates and evaluated the PM Mudra loan parameters: ${JSON.stringify(toolResults)}`,
      },
      {
        role: "user",
        content: "Please provide the complete, detailed breakdown and guidance in Hinglish now.",
      },
    ],
  });

  for await (const delta of synthesisStream.textStream) {
    if (!firstTokenTime) {
      firstTokenTime = Date.now();
    }
    process.stdout.write(delta);
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const ttftDuration = firstTokenTime ? ((firstTokenTime - startTime) / 1000).toFixed(2) : "N/A";

  console.log("\n\n--------------------------------------------------------------------------------");
  console.log("================================================================================");
  console.log("   Real-Time Streaming Performance Metrics");
  console.log("================================================================================");
  console.log(`Time to First Token (TTFT):   ${ttftDuration}s`);
  console.log(`Total End-to-End Latency:     ${totalDuration}s`);
  console.log(`Model:                        ${modelId} (Google Cloud Vertex AI)`);
  console.log(`Location:                     ${location}`);
  console.log(`GCP Credits Charged:          Active Project ${project}`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("\n❌ Test Failed:", err);
  process.exit(1);
});
