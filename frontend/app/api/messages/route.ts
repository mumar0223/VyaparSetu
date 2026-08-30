import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { conversationId, role, content, thinking, toolCalls } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: "conversationId, role, and content are required" },
        { status: 400 }
      );
    }

    // Verify conversation ownership
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create the message in database
    const message = await prisma.conversationMessage.create({
      data: {
        conversationId,
        role,
        content: typeof content === "string" ? content : JSON.stringify(content),
        thinking: thinking || null,
        toolCalls: toolCalls || undefined,
      },
    });

    // Bump conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("[POST /api/messages error]:", error);
    return NextResponse.json(
      { error: "Failed to persist message" },
      { status: 500 }
    );
  }
}
