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

    const { toolName, args, conversationId } = await req.json();
    if (!toolName) {
      return NextResponse.json({ error: "toolName is required" }, { status: 400 });
    }

    const tools: Record<string, any> = getAgentTools({
      userId: user.id,
      conversationId,
    });
    let result: any = null;

    if (tools[toolName] && typeof tools[toolName].execute === "function") {
      result = await tools[toolName].execute(args || {}, {} as any);
    } else {
      result = { success: false, error: `Tool '${toolName}' is not registered.` };
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("[POST /api/voice/execute-tool error]:", error);
    return NextResponse.json({
      result: {
        success: false,
        error: error?.message || "Failed to execute tool cleanly.",
      },
    });
  }
}
