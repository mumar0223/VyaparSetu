import dotenv from "dotenv";
dotenv.config();

import { fetchDistrictMandiRates, getUdyamDistrictIntelligence } from "@/lib/api/datagov";

async function main() {
  console.log("Testing datagov helper in frontend workspace...");
  const mandi = await fetchDistrictMandiRates("Maharashtra", "Pune", 3);
  console.log("Mandi rates count:", mandi.length);
  console.log("First mandi record:", mandi[0]);

  const udyam = getUdyamDistrictIntelligence("Pune", "Maharashtra");
  console.log("Udyam ODOP:", udyam.odopProduct);
  console.log("Udyam Top Sectors:", udyam.topSectors.map(s => `${s.sector} (${s.saturationLevel})`));
}

main().catch(console.error);
