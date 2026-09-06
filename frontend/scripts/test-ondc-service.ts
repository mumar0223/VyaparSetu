import { getOndcIntelligence } from "../lib/agent/ondc-service";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== Testing ONDC Intelligence & DB Caching ===");
  
  // Find a test user or business
  const user = await prisma.user.findFirst();
  const userId = user?.id;
  console.log(`Using User ID: ${userId || "anonymous"}`);

  const category = "kirana grocery store";
  const location = "Lucknow, Uttar Pradesh";

  console.log(`\n1. Fetching ONDC Intelligence for '${category}' in '${location}'...`);
  const start1 = Date.now();
  const res1 = await getOndcIntelligence({
    category,
    location,
    userId,
  });
  const elapsed1 = Date.now() - start1;
  console.log(`Call 1 completed in ${elapsed1}ms`);
  console.log(`Success: ${res1.success}`);
  console.log(`From cache: ${res1.fromCache}`);
  console.log(`Executive Summary: ${res1.summary}`);
  console.log(`Spoken Summary: ${res1.spokenSummary}`);
  console.log(`Procurement Items: ${res1.data.procurement.length}`);
  if (res1.data.procurement.length > 0) {
    console.log(` - Top Item: ${res1.data.procurement[0].commodity} (Discount: ${res1.data.procurement[0].ondcWholesaleDiscountPercent})`);
  }
  console.log(`Seller Platforms: ${res1.data.sellerPlatforms.map((s) => s.platformName).join(", ")}`);
  console.log(`Take-rate Comparison: ONDC ${res1.data.commissionComparison.ondcCommissionRate} vs Traditional ${res1.data.commissionComparison.traditionalAggregatorRate}`);

  console.log(`\n2. Repeating Call to test DB Cache Hit...`);
  const start2 = Date.now();
  const res2 = await getOndcIntelligence({
    category,
    location,
    userId,
  });
  const elapsed2 = Date.now() - start2;
  console.log(`Call 2 completed in ${elapsed2}ms`);
  console.log(`From cache: ${res2.fromCache}`);

  if (res2.fromCache) {
    console.log("SUCCESS: Cache hit confirmed! DB caching prevents unnecessary regeneration.");
  } else {
    console.warn("WARNING: Second call did not hit cache.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
