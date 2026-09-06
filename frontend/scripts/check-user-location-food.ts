import dotenv from "dotenv";
dotenv.config();

const LAT = 26.958548;
const LON = 81.000371;

async function reverseGeocode(lat: number, lon: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VyaparSetu-LocalScan/1.0 (contact@vyaparsetu.in)",
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e: any) {
    console.error("Geocoding error:", e.message);
  }
  return null;
}

async function fetchNearbyFoodOSM(lat: number, lon: number, radiusMeters: number) {
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"~"restaurant|fast_food|cafe|food_court"](around:${radiusMeters},${lat},${lon});
      node["cuisine"](around:${radiusMeters},${lat},${lon});
      node["shop"~"bakery|convenience|confectionery|deli|butcher"](around:${radiusMeters},${lat},${lon});
      way["amenity"~"restaurant|fast_food|cafe|food_court"](around:${radiusMeters},${lat},${lon});
    );
    out center 60;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "VyaparSetu-FoodScan/1.0 (contact@vyaparsetu.in)",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (res.ok) {
      const data = await res.json();
      return data.elements || [];
    } else {
      console.error("Overpass status:", res.status, res.statusText);
    }
  } catch (e: any) {
    console.error("Overpass fetch error:", e.message);
  }
  return [];
}

// Calculate distance in meters using Haversine formula
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

async function searchExaCompetitors(locality: string, city: string) {
  const exaKey = process.env.EXA_API_KEY;
  if (!exaKey) return [];

  try {
    const queries = [
      `biryani restaurants food outlets near Kursi Road Lucknow`,
      `biryani dhabas restaurants near Integral University Kursi Road Lucknow`,
      `best non-veg food biryani shops in Jankipuram Extension Kursi Road Lucknow`,
      `Tedhi Pulia Kursi Road biryani chicken non veg restaurants Lucknow`,
    ];

    const results: any[] = [];
    for (const q of queries) {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "x-api-key": exaKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: q,
          numResults: 6,
          useAutoprompt: true,
        }),
      });

      if (res.ok) {
        const d = await res.json();
        if (d.results) results.push(...d.results);
      }
    }
    return results;
  } catch (e: any) {
    console.error("Exa search error:", e.message);
    return [];
  }
}

async function main() {
  console.log(`\nAnalyzing location: ${LAT}, ${LON}...`);

  const geo = await reverseGeocode(LAT, LON);
  const displayName = geo?.display_name || "Kursi Road / Jankipuram, Lucknow, Uttar Pradesh";
  const address = geo?.address || {};
  const suburb = address.suburb || address.neighbourhood || address.road || "Kursi Road / Jankipuram";
  const city = address.city || address.state_district || "Lucknow";
  const state = address.state || "Uttar Pradesh";
  const postcode = address.postcode || "226021 / 226026";

  console.log(`\nExact Identified Area:`);
  console.log(`- Address: ${displayName}`);
  console.log(`- Suburb / Landmark: ${suburb}`);
  console.log(`- City & District: ${city}, ${state} (Pincode: ${postcode})`);

  console.log(`\n1. Fetching OpenStreetMap Overpass food & restaurant competitors within 3km...`);
  const elements = await fetchNearbyFoodOSM(LAT, LON, 3500);

  const namedCompetitors = elements
    .filter((e: any) => e.tags && (e.tags.name || e.tags["name:en"]))
    .map((e: any) => {
      const name = e.tags.name || e.tags["name:en"];
      const itemLat = e.lat || e.center?.lat;
      const itemLon = e.lon || e.center?.lon;
      const dist = itemLat && itemLon ? getDistanceMeters(LAT, LON, itemLat, itemLon) : null;
      return {
        name,
        cuisine: e.tags.cuisine || "Indian / Fast Food",
        type: e.tags.amenity || e.tags.shop || "Food outlet",
        distMeters: dist,
        street: e.tags["addr:street"] || e.tags["addr:suburb"] || null,
        lat: itemLat,
        lon: itemLon,
      };
    })
    .sort((a: any, b: any) => (a.distMeters || 99999) - (b.distMeters || 99999));

  console.log(`\nFound ${namedCompetitors.length} mapped food/restaurant competitors:`);
  namedCompetitors.forEach((c: any, i: number) => {
    console.log(
      `  [${i + 1}] "${c.name}" - ${c.cuisine} (${c.type}) | ~${c.distMeters}m away | Street: ${c.street || "Nearby"}`
    );
  });

  console.log(`\n2. Querying Exa Search for local Biryani & Non-Veg competitors in ${suburb}, ${city}...`);
  const exaResults = await searchExaCompetitors(suburb, city);
  console.log(`Found ${exaResults.length} web directory & restaurant listings:`);
  exaResults.forEach((r: any, i: number) => {
    console.log(`  [${i + 1}] ${r.title}\n      URL: ${r.url}`);
  });
}

main().catch(console.error);
