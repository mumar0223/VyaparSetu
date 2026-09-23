import dotenv from "dotenv";
dotenv.config();

import { searchCompetitorsIntelligence } from "../lib/agent/competitor-service";

async function runTest() {
  console.log("================================================================================");
  console.log("   TESTING HYPER-LOCAL COMPETITOR SERVICE (Google Cloud Vertex AI 3.7 Flash)");
  console.log("================================================================================\n");

  const LAT = 26.958548;
  const LON = 81.000371;

  console.log("Testing with Coordinates: Kursi Road, Lucknow (Catering & Restaurant Services)...");
  const result = await searchCompetitorsIntelligence({
    category: "Catering & Restaurant Services",
    radiusKm: 2,
    lat: LAT,
    lon: LON,
    bypassCache: true,
  });

  console.log("\n--- RESULT ---");
  console.log("Success:", result.success);
  console.log("Location Summary:", result.locationSummary);
  console.log("Category:", result.category);
  console.log("Total Places Discovered for Map (allPlaces):", result.allPlaces?.length || 0);
  console.log("Top Competitors for SWOT Cards (competitors):", result.competitors.length);
  result.competitors.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] ${c.name}`);
    console.log(`    Distance: ${c.distance} | Landmark: ${c.landmark} | GPS: ${c.lat}, ${c.lng}`);
    console.log(`    Speciality: ${c.speciality} | Price: ${c.priceRange}`);
    console.log(`    Threat Level: ${c.threatLevel} | Why: ${c.differentiator || "N/A"}`);
  });

  console.log("\n================================================================================");
  console.log("Testing Missing Location Fallback (No coordinates, no DB)...");
  const missingResult = await searchCompetitorsIntelligence({
    category: "Kirana / Grocery",
  });
  console.log("Needs Location Flag:", missingResult.needsLocation);
  console.log("Message:", missingResult.message);
  console.log("================================================================================\n");
}

runTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
