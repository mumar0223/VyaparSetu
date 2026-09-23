/**
 * Centralized SerpApi Service for Real-time Google Maps & Google Search Grounding.
 * Tailored for Indian micro-enterprises, local mandi yards, and competitor intelligence.
 */

export interface GoogleMapsPlace {
  title: string;
  rating?: number;
  reviews?: number;
  address?: string;
  phone?: string;
  type?: string;
  price?: string;
  openState?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  placeId?: string;
  thumbnail?: string;
}

export interface GoogleWebResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Searches Google Maps directly via SerpApi for hyper-local shops, competitors, and mandis.
 */
export async function searchGoogleMaps(params: {
  query: string;
  location?: string;
  lat?: number;
  lon?: number;
  radiusKm?: number;
  limit?: number;
  timeoutMs?: number;
}): Promise<GoogleMapsPlace[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const { query, location, lat, lon, radiusKm, limit = 40, timeoutMs = 15000 } = params;

  // Clean location string to keep high-signal landmark & city (e.g. "Kursi Road, Lucknow")
  let cleanLoc = location || "";
  if (cleanLoc.includes(",")) {
    const parts = cleanLoc
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    cleanLoc =
      parts.length > 2
        ? `${parts[0]}, ${parts[parts.length - 2] || parts[1]}`
        : cleanLoc;
  }

  const searchQuery =
    cleanLoc && !query.toLowerCase().includes(cleanLoc.toLowerCase())
      ? `${query} in ${cleanLoc}`
      : query;

  // Calculate optimal Google Maps camera zoom level based on catchment radius
  let zoom = 14;
  if (radiusKm !== undefined) {
    if (radiusKm <= 1.5)
      zoom = 16; // ~1-1.5km tight neighborhood cluster
    else if (radiusKm <= 3.5)
      zoom = 15; // ~3km sub-district
    else if (radiusKm <= 7)
      zoom = 14; // ~6-8km city zone
    else zoom = 13; // >8km regional
  }

  const fetchPage = async (start: number): Promise<any[]> => {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_maps");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("hl", "en");
    url.searchParams.set("gl", "in");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("start", String(start));

    if (lat && lon) {
      url.searchParams.set("ll", `@${lat},${lon},${zoom}z`);
    }

    try {
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        console.warn(
          `[SerpApi Google Maps] HTTP ${res.status}: ${res.statusText}`,
        );
        return [];
      }
      const data = await res.json();
      return data?.local_results || [];
    } catch (err: any) {
      console.warn("[SerpApi Google Maps error]:", err?.message);
      return [];
    }
  };

  try {
    // Fetch initial page
    const page1 = await fetchPage(0);
    let allRaw = page1;

    // If more results desired and first page was full (20 results), fetch page 2 and page 3 in parallel
    if (limit > 20 && page1.length >= 18) {
      const [page2, page3] = await Promise.all([
        fetchPage(20),
        limit > 35 ? fetchPage(40) : Promise.resolve([]),
      ]);
      allRaw = [...page1, ...page2, ...page3];
    }

    // Deduplicate by title or place_id
    const seen = new Set<string>();
    const deduplicated: GoogleMapsPlace[] = [];

    for (const item of allRaw) {
      const title = item.title || "Unnamed Establishment";
      const key =
        item.place_id ||
        `${title.toLowerCase()}_${item.address?.toLowerCase() || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);

      deduplicated.push({
        title,
        rating: typeof item.rating === "number" ? item.rating : undefined,
        reviews: typeof item.reviews === "number" ? item.reviews : undefined,
        address: item.address || "",
        phone: item.phone || undefined,
        type:
          item.type || (Array.isArray(item.types) ? item.types[0] : undefined),
        price: item.price || undefined,
        openState: item.open_state || item.hours || undefined,
        latitude: item.gps_coordinates?.latitude,
        longitude: item.gps_coordinates?.longitude,
        website: item.website || undefined,
        placeId: item.place_id || undefined,
        thumbnail: item.thumbnail || undefined,
      });

      if (deduplicated.length >= limit) break;
    }

    return deduplicated;
  } catch (err: any) {
    console.warn("[SerpApi Google Maps overall error]:", err?.message);
    return [];
  }
}

/**
 * Standalone Catchment Shop Radar:
 * Fetches all local commercial shops for a given category with dedicated 15s timeout.
 * Returns only real Google Maps places with finite coordinates within the catchment radius.
 * NO AI delay, NO hardcoded word blacklist!
 */
export async function searchCatchmentShops(params: {
  category: string;
  location?: string;
  lat?: number;
  lon?: number;
  radiusKm?: number;
  limit?: number;
}): Promise<any[]> {
  const { category, location, lat, lon, radiusKm = 5, limit = 60 } = params;

  // 15-second timeout for pure shop search
  const places = await searchGoogleMaps({
    query: category,
    location,
    lat,
    lon,
    radiusKm,
    limit,
    timeoutMs: 15000,
  });

  // Calculate distance helper
  const calculateDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Keep all genuine Google Maps places with coordinates within radius * 1.35
  const valid = places
    .filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    )
    .filter((p) => {
      if (lat && lon && p.latitude && p.longitude) {
        const d = calculateDist(lat, lon, p.latitude, p.longitude);
        return d <= radiusKm * 1.35;
      }
      return true;
    });

  return valid.map((p) => {
    let distStr = "Within catchment";
    if (lat && lon && p.latitude && p.longitude) {
      const d = calculateDist(lat, lon, p.latitude, p.longitude);
      distStr = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
    }

    return {
      name: p.title,
      distance: distStr,
      landmark: p.address || location || "Catchment Area",
      speciality: p.type || `${category} Outlet`,
      priceRange: p.price || "Competitive market pricing",
      threatLevel: "Low" as const,
      differentiator: p.rating
        ? `Rated ${p.rating}★ with ${p.reviews || 0} reviews on Google Maps`
        : "Local commercial establishment in catchment area",
      lat: p.latitude,
      lng: p.longitude,
      rating: p.rating,
      reviews: p.reviews,
    };
  });
}

/**
 * Searches Google Organic Web Search via SerpApi as a reliable search engine provider.
 */
export async function searchGoogleWeb(
  query: string,
  numResults: number = 5,
): Promise<GoogleWebResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(numResults));
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "in");
  url.searchParams.set("api_key", apiKey);

  try {
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(
        `[SerpApi Google Web] HTTP ${res.status}: ${res.statusText}`,
      );
      return [];
    }

    const data = await res.json();
    const organic = data?.organic_results || [];

    return organic.slice(0, numResults).map(
      (r: any): GoogleWebResult => ({
        title: r.title || "Untitled",
        url: r.link || "",
        snippet: r.snippet || "",
      }),
    );
  } catch (err: any) {
    console.warn("[SerpApi Google Web error]:", err?.message);
    return [];
  }
}
