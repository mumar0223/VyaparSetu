import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { predictDistrictBusinessesIntelligence } from "@/lib/agent/district-predictor-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const customStream = new ReadableStream({
    async start(controller) {
      const sendEvent = (obj: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        const user = await getCurrentUser();
        const body = await req.json().catch(() => ({}));

        const district = body.district;
        const state = body.state;
        const budget = Number(body.budget) || undefined;
        const category = body.category;
        const riskLevel = body.riskLevel;

        // Execute centralized AI research engine
        const prediction = await predictDistrictBusinessesIntelligence({
          district,
          state,
          budget,
          category,
          riskLevel,
          userId: user?.id,
          bypassCache: false,
        });

        // 1. Send Market Pulse event
        sendEvent({
          type: "district_pulse",
          districtSummary: prediction.districtSummary,
          liveMandiInsight: prediction.liveMandiInsight,
          mandiRecords: prediction.mandiRecords,
        });

        // 2. Stream cards one by one with micro-pause for smooth UI insertion
        for (let i = 0; i < prediction.cards.length; i++) {
          sendEvent({
            type: "card",
            card: prediction.cards[i],
          });
          await new Promise((resolve) => setTimeout(resolve, 80));
        }

        sendEvent({ type: "done" });
      } catch (err: any) {
        console.error("[district-business stream error]:", err);
        sendEvent({ type: "error", error: err?.message || "Stream error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
