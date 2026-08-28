import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAgentTools } from "@/lib/agent/tools";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolName, args } = await req.json();
    if (!toolName) {
      return NextResponse.json({ error: "toolName is required" }, { status: 400 });
    }

    const tools = getAgentTools();
    let result: any = null;

    if (toolName === "getMandiRates" && tools.getMandiRates.execute) {
      result = await tools.getMandiRates.execute(args || {}, {} as any);
    } else if (
      toolName === "evaluateSchemeEligibility" &&
      tools.evaluateSchemeEligibility.execute
    ) {
      result = await tools.evaluateSchemeEligibility.execute(args || {}, {} as any);
    } else {
      result = { error: `Tool ${toolName} not found` };
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("[POST /api/voice/execute-tool error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute tool" },
      { status: 500 }
    );
  }
}
