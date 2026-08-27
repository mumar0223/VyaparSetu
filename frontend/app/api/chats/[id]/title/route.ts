import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { TITLE_GENERATION_CONFIG } from "@/lib/agent/chat-config";
import { generateText } from "ai";

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
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Default fast fallback title from first words
    const fallbackTitle =
      message
        .trim()
        .replace(/\n+/g, " ")
        .split(" ")
        .slice(0, 6)
        .join(" ")
        .slice(0, 40) || "New Conversation";

    let generatedTitle = fallbackTitle;

    try {
      const titleModel = getLanguageModel(
        TITLE_GENERATION_CONFIG.provider,
        TITLE_GENERATION_CONFIG.model
      );

      const { text } = await generateText({
        model: titleModel,
        prompt: `Generate a concise 3 to 5 word topic title summarizing this message: "${message.trim()}". Return ONLY the title text with no quotation marks and no punctuation at the end.`,
        temperature: TITLE_GENERATION_CONFIG.temperature,
      });


      const cleaned = text
        .trim()
        .replace(/^["'`]|["'`]$/g, "")
        .replace(/\.$/, "")
        .slice(0, 45);

      if (cleaned && cleaned.length > 2) {
        generatedTitle = cleaned;
      }
    } catch (err) {
      console.warn("[TITLE_ROUTE] AI title generation error, using fallback:", err);
      generatedTitle = fallbackTitle;
    }

    // Update conversation title in Database
    const updated = await prisma.conversation.update({
      where: { id },
      data: { title: generatedTitle },
    });

    return NextResponse.json({
      success: true,
      title: updated.title,
    });
  } catch (err) {
    console.error("[TITLE_ROUTE] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
