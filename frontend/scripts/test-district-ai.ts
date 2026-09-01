import dotenv from "dotenv";
dotenv.config();

import { fetchDistrictMandiRates, getUdyamDistrictIntelligence } from "@/lib/api/datagov";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { generateText } from "ai";

async function testDistrictPredictionAI() {
  console.log("==========================================================");
  console.log("   Testing Vertex AI Gemini 3.7 Flash District Prediction");
  console.log("==========================================================\n");

  const district = "Pune";
  const state = "Maharashtra";
  const budget = 250000;

  const mandiRecords = await fetchDistrictMandiRates(state, district, 5);
  const udyamStats = getUdyamDistrictIntelligence(district, state);

  console.log(`Fetched ${mandiRecords.length} mandi records for ${district}.`);
  console.log(`Udyam ODOP: ${udyamStats.odopProduct}`);

  const model = getLanguageModel("vertex", "gemini-3.7-flash");

  const prompt = `You are VyaparSetu's Chief District Economic AI Strategist.
Predict top 2 best micro/small businesses for:
- District: ${district}, ${state}
- Budget: ₹${budget.toLocaleString("en-IN")}
- Live Mandi Commodities: ${mandiRecords.map(m => `${m.commodity} (₹${m.modalPrice}/qtl)`).join(", ")}
- ODOP: ${udyamStats.odopProduct}

Return JSON with:
{
  "districtSummary": "...",
  "predictedBusinesses": [
    {
      "rank": 1,
      "title": "...",
      "sector": "...",
      "matchScore": 95,
      "summary": "...",
      "capitalRequired": { "formatted": "₹2 Lakh" },
      "monthlyProfit": { "formatted": "₹45,000/mo", "marginPercentage": 25 },
      "paybackPeriodMonths": 6,
      "whyInThisDistrict": "...",
      "matchedSubsidies": [{ "name": "PMEGP", "percentage": "35%" }]
    }
  ]
}`;

  console.log("Sending prompt to Vertex Gemini 3.7 Flash...");
  const start = Date.now();
  const res = await generateText({
    model,
    prompt,
  });
  console.log(`Received in ${((Date.now() - start)/1000).toFixed(2)}s:`);
  console.log(res.text.slice(0, 500) + "...\n");
  console.log("✅ Vertex AI Gemini 3.7 Flash District prediction test PASSED!");
}

testDistrictPredictionAI().catch(console.error);
