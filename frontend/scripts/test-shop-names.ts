import dotenv from "dotenv";
dotenv.config();

async function checkDataGovIn() {
  console.log("\n==========================================");
  console.log("1. TESTING DATA.GOV.IN FOR MSME / UDYAM / SHOPS");
  console.log("==========================================");

  const apiKey = process.env.DATA_GOV_IN_API_KEY || "579b464db66ec23bdd000001ddb36e098975438e5697e63e567a663c";

  // Let's search data.gov.in catalogue for udyam / msme APIs
  // data.gov.in has a search / catalog endpoint or known resource lists
  const searchQueries = ["udyam", "msme registered", "enterprises registered"];

  for (const q of searchQueries) {
    try {
      console.log(`\nSearching data.gov.in catalog for: "${q}"...`);
      const url = `https://api.data.gov.in/catalog/search?api-key=${apiKey}&format=json&query=${encodeURIComponent(q)}&count=5`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const json = await res.json();
        console.log(`Status ${res.status}: Found ${json.count || json.total || 0} catalog matches.`);
        if (json.results && json.results.length > 0) {
          json.results.slice(0, 3).forEach((r: any, i: number) => {
            console.log(`  [${i + 1}] Title: ${r.title}`);
            console.log(`      Resource ID: ${r.index_name || r.id}`);
            console.log(`      Fields/Desc: ${r.field?.map((f: any) => f.name).join(", ") || r.desc?.slice(0, 100)}`);
          });
        }
      } else {
        console.log(`Catalog search status: ${res.status} ${res.statusText}`);
      }
    } catch (e: any) {
      console.log(`Error searching data.gov.in: ${e.message}`);
    }
  }
}

async function checkOpenStreetMapOverpass() {
  console.log("\n==========================================");
  console.log("2. TESTING OPENSTREETMAP / OVERPASS API FOR REAL SHOPS & COMPETITORS");
  console.log("==========================================");

  // We can query by area or coordinates. Let's test finding Kirana, Grocery, Chemist, Clothes, Hardware stores
  const lat = 18.5204;
  const lon = 73.8567;
  const radius = 2500; // 2.5 km catchment radius

  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["shop"~"convenience|supermarket|general|grocery|chemist|clothes|hardware|bakery"](around:${radius},${lat},${lon});
    );
    out body 20;
  `;

  try {
    console.log(`Querying Overpass API for real retail/kirana shops within ${radius}m of Pune center...`);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "VyaparSetu-LocalBusinessScanner/1.0 (contact@vyaparsetu.in)",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (res.ok) {
      const data = await res.json();
      const elements = data.elements || [];
      console.log(`Overpass API returned ${elements.length} retail/kirana shop entities.`);
      
      const namedShops = elements
        .filter((e: any) => e.tags && e.tags.name)
        .map((e: any) => ({
          name: e.tags.name,
          category: e.tags.shop,
          street: e.tags["addr:street"] || e.tags["addr:suburb"] || null,
          lat: e.lat,
          lon: e.lon,
        }));

      console.log(`Found ${namedShops.length} named retail shops:`);
      namedShops.forEach((shop: any, i: number) => {
        console.log(`  ${i + 1}. "${shop.name}" [Category: ${shop.category}] - ${shop.street || "Local area"} (Lat: ${shop.lat}, Lon: ${shop.lon})`);
      });
    } else {
      console.log(`Overpass API response: ${res.status} ${res.statusText}`);
    }
  } catch (err: any) {
    console.log("Overpass API error:", err.message);
  }
}

async function checkExaSearch() {
  console.log("\n==========================================");
  console.log("3. TESTING EXA SEARCH API FOR LOCAL COMPETITORS");
  console.log("==========================================");

  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) {
    console.log("No EXA_API_KEY found in .env");
    return;
  }

  try {
    console.log("Searching Exa for competitor grocery/kirana shops in Pune...");
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": exaKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "grocery kirana stores wholesale retailers shops in Hadapsar Pune Maharashtra directory",
        numResults: 5,
        useAutoprompt: true,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`Exa returned ${data.results?.length || 0} search results:`);
      data.results?.forEach((r: any, i: number) => {
        console.log(`  [${i + 1}] Title: ${r.title}`);
        console.log(`      URL: ${r.url}`);
      });
    } else {
      console.log(`Exa API error: ${res.status} ${res.statusText}`);
    }
  } catch (err: any) {
    console.log("Exa API exception:", err.message);
  }
}

async function main() {
  await checkDataGovIn();
  await checkOpenStreetMapOverpass();
  await checkExaSearch();
}

main();
