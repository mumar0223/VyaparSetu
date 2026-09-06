import dotenv from "dotenv";
dotenv.config();

const LAT = 26.958548;
const LON = 81.000371;

async function reverseGeocode(lat: number, lon: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VyaparSetu-Test/1.0 (contact@vyaparsetu.in)",
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    console.error("Geocoding error:", e.message);
  }
  return null;
}

async function searchCompetitorsWithGeminiGoogleSearch(
  lat: number,
  lon: number,
  category: string = "Biryani & Food Outlets"
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  console.log(`\n1. Reverse-geocoding coordinates (${lat}, ${lon})...`);
  const geo = await reverseGeocode(lat, lon);
  const address = geo?.address || {};
  const road = address.road || "Kursi Road";
  const suburb = address.suburb || address.neighbourhood || address.hamlet || "Dashauli / Behta";
  const city = address.city || address.state_district || "Lucknow";
  const postcode = address.postcode || "226026";
  const fullAddress = geo?.display_name || `${road}, ${suburb}, ${city}, ${postcode}`;

  console.log(`   📍 Pinpointed: ${road}, ${suburb}, ${city} (${postcode})`);

  console.log(`\n2. Querying Google Search Grounded AI for nearby [${category}] competitors...`);

  const prompt = `You are VyaparSetu's Hyper-Local Market Competitor Scanner.
The user is physically located at:
- Latitude: ${lat}
- Longitude: ${lon}
- Address: ${fullAddress}

Task:
Search live Google, Google Maps, and local directories (Justdial, Zomato, Swiggy) for all real competitor food businesses, restaurants, hotels, biryani joints, dhabas, and eateries around Kursi Road, Dashauli / Behta, Integral University, Lucknow (226026).

CRITICAL SEARCH STRATEGY:
1. PRIORITY 1: Ultra-local walking distance (within 100m - 500m of Integral University Gate & Kursi Road). Include all local restaurants, hotels, and dhabas (e.g. search "restaurants near Integral University Kursi Road Justdial", "hotel and dining opposite Integral University gate").
2. PRIORITY 2: Catchment area within 1 km - 2.5 km on Kursi Road.
3. Include popular student eateries, dhabas, biryani centers, and local non-veg dining spots.

Return a comprehensive JSON array (at least 15-20 verified real shops) matching this exact schema:
[
  {
    "name": "Exact Shop Name",
    "distance": "e.g. 140m / 300m / 800m / 1.5km",
    "landmark": "Exact street or landmark (e.g. 140m from Integral University Gate, Kursi Road)",
    "speciality": "e.g. Non-Veg Food, Biryani, Mughlai, Dhaba Dining, Fast Food",
    "priceRange": "e.g. ₹100 - ₹300 per person",
    "competitorThreatLevel": "High / Medium / Low"
  }
]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    tools: [
      {
        googleSearch: {},
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const groundingMetadata = data.candidates?.[0]?.groundingMetadata;

  return { text, groundingMetadata };
}

async function main() {
  console.log("================================================================================");
  console.log("   TESTING GOOGLE-GROUNDED COMPETITOR SEARCH FOR LAT/LONG");
  console.log("================================================================================\n");

  const result = await searchCompetitorsWithGeminiGoogleSearch(LAT, LON, "Biryani & Non-Veg Restaurants");

  console.log("\n--- Grounding Search Sources ---");
  if (result.groundingMetadata?.webSearchQueries) {
    console.log("Google Search Queries executed by AI:", result.groundingMetadata.webSearchQueries);
  }

  console.log("\n--- Result Text from Google Grounded Gemini ---");
  console.log(result.text);
}

main().catch(console.error);
