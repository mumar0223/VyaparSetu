import { predictDistrictBusinessesIntelligence } from "../lib/agent/district-predictor-service";

async function main() {
  console.log("=== Testing Autonomous District Business Predictor (Gemini 3.7 Flash) ===");

  const district = "Lucknow";
  const state = "Uttar Pradesh";
  const budget = 250000;

  console.log(`\nTesting autonomous research for ${district}, ${state} with Budget ₹${budget}...`);
  const start = Date.now();
  const res = await predictDistrictBusinessesIntelligence({
    district,
    state,
    budget,
    bypassCache: true, // Force live AI search
  });
  const elapsed = Date.now() - start;

  console.log(`\nCompleted in ${elapsed}ms`);
  console.log(`Success: ${res.success}`);
  console.log(`From Cache: ${res.fromCache}`);
  console.log(`AI Research Queries Executed:`, res.researchQueriesExecuted);
  console.log(`Spoken Summary: ${res.spokenSummary}`);
  console.log(`\nTop Predicted Businesses (${res.cards.length} cards):`);
  res.cards.forEach((card) => {
    console.log(`[Rank ${card.rank}] ${card.title} (${card.sector})`);
    console.log(`   Capital: ${card.capitalRequired.formatted} | Profit: ${card.monthlyProfit.formatted} (${card.monthlyProfit.marginPercentage}%)`);
    console.log(`   Why: ${card.whyInThisDistrict}`);
    console.log(`   Subsidy: ${card.matchedSubsidies.map((s) => s.name).join(", ")}`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
