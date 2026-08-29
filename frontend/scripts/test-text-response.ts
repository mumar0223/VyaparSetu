import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText } from "ai";

async function testFullLoop() {
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

  const model = vertex("gemini-3.7-flash");

  // Step 1: Mock tool execution
  const toolResultData = {
    commodity: "Onion (Pyaaz)",
    market: "Nashik APMC Market, Maharashtra",
    modalPricePerQuintal: "₹1,850",
    priceRange: "₹1,650 - ₹2,100 / quintal",
    trend: "+3.8% Bullish (Prices rising)",
    mudraEligibility: "Eligible for PM Mudra Kishore Loan (₹2,00,000) at 8.5% interest, zero collateral.",
    requiredDocs: ["Udyam Aadhaar", "6-Month Bank Statement", "Aadhaar & PAN Card"],
  };

  console.log("⚡ Sending user prompt + real-time tool data to Gemini 3.7 Flash on Vertex AI...\n");

  const res = await generateText({
    model,
    system: "You are VyaparSetu's expert business advisor. Speak natural conversational Hinglish to rural micro-entrepreneurs. Explain the mandi rates and loan guidance in clear, encouraging bullet points.",
    messages: [
      {
        role: "user",
        content: "Namaste! Mera Maharashtra me ₹12,00,000 turnover hai. Aaj ka Nashik Onion mandi price bataiye aur mujhe ₹2,00,000 storage expansion ke liye Mudra loan ka pura process samjhaiye.",
      },
      {
        role: "assistant",
        content: "Maine Nashik APMC mandi rates aur PM Mudra loan details check kar li hain.",
      },
      {
        role: "user",
        content: `Mandi & Loan Data: ${JSON.stringify(toolResultData)}. Ab kripya mujhe detail me samjhaiye.`,
      },
    ],
  });

  console.log("================================================================================");
  console.log("🎙️ [GEMINI 3.7 FLASH - COMPLETE TEXT RESPONSE]:");
  console.log("================================================================================\n");
  console.log(res.text);
  console.log("\n================================================================================\n");
}

testFullLoop().catch(console.error);
