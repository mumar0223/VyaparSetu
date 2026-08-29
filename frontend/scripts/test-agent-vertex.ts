import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, tool } from "ai";
import { z } from "zod";

async function main() {
  console.log("================================================================================");
  console.log("   VyaparSetu Autonomous AI Agent Test (Google Cloud Vertex AI)");
  console.log("================================================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const modelId = process.env.GOOGLE_VERTEX_MODEL || "gemini-3.7-flash";

  console.log(`[Config] Project: ${project}`);
  console.log(`[Config] Location: ${location}`);
  console.log(`[Config] Model: ${modelId}\n`);

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

  const tools = {
    getMandiRates: tool({
      description: "Fetches live APMC market prices and arrival data for agricultural commodities in India.",
      parameters: z.object({
        commodity: z.string().default("Onion").describe("Commodity name e.g. Onion, Wheat, Cotton"),
        market: z.string().default("Nashik").describe("APMC market or district name"),
      }),
      execute: async ({ commodity, market }) => {
        console.log(`\n⚡ [TOOL CALLED: getMandiRates] Fetching rates for "${commodity}" in "${market}"...`);
        return {
          commodity,
          market: `${market} APMC Market, Maharashtra`,
          modalPricePerQuintal: "₹1,850",
          priceRange: "₹1,650 - ₹2,100 / quintal",
          dailyArrivals: "450 Quintals (Moderate)",
          weeklyTrend: "+3.8% Bullish (Prices rising due to local demand)",
          recommendation: "Current rates are favorable for selling. If storing, ensure ventilated dry storage.",
        };
      },
    }),

    evaluateMudraLoanEligibility: tool({
      description: "Evaluates PM Mudra Yojana credit scheme eligibility and tier recommendations.",
      parameters: z.object({
        annualTurnover: z.number().describe("Annual business turnover in INR"),
        requestedAmount: z.number().describe("Required loan amount in INR"),
        purpose: z.string().describe("Loan purpose e.g. Warehouse Expansion, Machinery"),
      }),
      execute: async ({ annualTurnover, requestedAmount, purpose }) => {
        console.log(`\n⚡ [TOOL CALLED: evaluateMudraLoanEligibility] Evaluating Mudra for ₹${requestedAmount} (${purpose})...`);
        const tier = requestedAmount <= 50000 ? "Shishu" : requestedAmount <= 500000 ? "Kishore" : "Tarun";
        return {
          scheme: "Pradhan Mantri Mudra Yojana (PMMY)",
          eligible: true,
          recommendedTier: `${tier} Loan (₹50,000 to ₹5,00,000)`,
          sanctionAmount: `₹${requestedAmount.toLocaleString("en-IN")}`,
          collateral: "Zero collateral required (backed by CGFMU guarantee)",
          interestRate: "8.40% - 9.65% per annum",
          tenure: "Up to 5 years (with 6-month moratorium)",
          requiredDocuments: [
            "Udyam Aadhaar Registration",
            "6-Month Bank / UPI Statement",
            "Aadhaar Card & PAN Card",
            "Storage Shed Quotation / Project Estimate",
          ],
        };
      },
    }),
  };

  const userPrompt = `Namaste! Mera Maharashtra me ₹12,00,000 ka annual turnover hai. 
1. Nashik mandi me aaj Onion (Pyaaz) ka rate aur market trend kya chal raha hai?
2. Mujhe ₹2,00,000 ka loan chahiye storage warehouse expand karne ke liye. Kya mai PM Mudra loan ke liye eligible hoon aur documents kya chahiye?
Kripya Hinglish me vistaar se samjhaiye.`;

  console.log(`[User Prompt]:\n"${userPrompt}"\n`);
  console.log("--- Executing Reasoning Loop with Google Cloud Vertex AI ---");

  const startTime = Date.now();

  const result = await generateText({
    model,
    prompt: userPrompt,
    tools,
    maxSteps: 5,
    system:
      "You are VyaparSetu's expert rural business and financial advisor. Always call the appropriate tools to fetch data, and then provide a comprehensive, clear, encouraging, and structured final response in Hinglish directly addressing all aspects of the entrepreneur's query.",
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n================================================================================");
  console.log(`  Agent Execution Completed in ${duration}s`);
  console.log("================================================================================\n");

  console.log("🎙️ [GEMINI'S FINAL DETAILED TEXT RESPONSE]:\n");
  console.log(result.text);
  console.log("\n================================================================================\n");
}

main().catch((err) => {
  console.error("Agent test error:", err);
  process.exit(1);
});
