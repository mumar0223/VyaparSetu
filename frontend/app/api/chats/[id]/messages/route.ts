import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { userTranscript, assistantTranscript, toolCalls, thinking } = body;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messagesToCreate = [];

    if (userTranscript?.trim()) {
      messagesToCreate.push({
        conversationId: id,
        role: "user",
        content: userTranscript.trim(),
      });
    }

    if (assistantTranscript?.trim()) {
      messagesToCreate.push({
        conversationId: id,
        role: "assistant",
        content: assistantTranscript.trim(),
        thinking: typeof thinking === "string" ? thinking : undefined,
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      });
    }

    if (messagesToCreate.length > 0) {
      await prisma.conversationMessage.createMany({
        data: messagesToCreate,
      });

      // Update conversation updatedAt for sidebar sorting
      await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/chats/[id]/messages error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to persist messages" },
      { status: 500 }
    );
  }
}
