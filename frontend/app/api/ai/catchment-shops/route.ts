import { NextRequest, NextResponse } from "next/server";
import { searchCatchmentShops } from "@/lib/agent/serpapi-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const district = body.district || "Lucknow";
    const state = body.state || "Uttar Pradesh";
    const radiusKm = Number(body.radiusKm || 5);
    const category = body.category || "General Store / Kirana";
    const lat = body.lat !== undefined ? Number(body.lat) : undefined;
    const lng = body.lng !== undefined ? Number(body.lng) : undefined;

    const location = `${district}, ${state}`;

    // Pure Google Maps Catchment Radar with dedicated 15s timeout
    const shops = await searchCatchmentShops({
      category,
      location,
      lat,
      lon: lng,
      radiusKm,
      limit: 60,
    });

    return NextResponse.json({
      success: true,
      category,
      location,
      radiusKm,
      count: shops.length,
      shops,
    });
  } catch (error: any) {
    console.warn("[catchment-shops API error]:", error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to search catchment shops", shops: [] },
      { status: 500 }
    );
  }
}
