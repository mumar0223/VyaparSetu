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

    // Extract turns (with user queries AND assistant responses) or simple message strings
    const turns: Array<{ user?: string; assistant?: string }> = Array.isArray(body.turns)
      ? body.turns.filter((t: any) => t && (t.user || t.assistant))
      : [];

    const userMessages: string[] = Array.isArray(body.messages)
      ? body.messages.filter((m: any) => typeof m === "string" && m.trim())
      : typeof body.message === "string" && body.message.trim()
      ? [body.message.trim()]
      : [];

    if (turns.length === 0 && userMessages.length === 0) {
      return NextResponse.json(
        { error: "At least one message or turn is required" },
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

    // Default fast fallback title
    const firstQuery = turns[0]?.user || userMessages[0] || "Live Voice Session";
    const fallbackTitle =
      firstQuery
        .trim()
        .replace(/\n+/g, " ")
        .split(" ")
        .slice(0, 6)
        .join(" ")
        .slice(0, 40) || "Live Voice Session";

    let generatedTitle = fallbackTitle;

    try {
      const titleModel = getLanguageModel(
        TITLE_GENERATION_CONFIG.provider,
        TITLE_GENERATION_CONFIG.model
      );

      let prompt = "";

      if (turns.length > 0) {
        const formattedDialogue = turns
          .slice(0, 3)
          .map((t, idx) => {
            let turnStr = `Turn ${idx + 1}:\n`;
            if (t.user) turnStr += `User: "${t.user.trim()}"\n`;
            if (t.assistant) turnStr += `AI: "${t.assistant.trim().slice(0, 250)}"\n`;
            return turnStr;
          })
          .join("\n");

        prompt = `Generate a concise 3 to 5 word topic title summarizing this spoken dialogue between the user and the VyaparSetu AI assistant:\n\n${formattedDialogue}\nReturn ONLY the title text with no quotation marks and no punctuation at the end.`;
      } else if (userMessages.length > 1) {
        prompt = `Generate a concise 3 to 5 word topic title summarizing this business conversation based on the user's queries:\n${userMessages
          .map((m, i) => `${i + 1}. "${m}"`)
          .join("\n")}\nReturn ONLY the title text with no quotation marks and no punctuation at the end.`;
      } else {
        prompt = `Generate a concise 3 to 5 word topic title summarizing this message: "${userMessages[0]}". Return ONLY the title text with no quotation marks and no punctuation at the end.`;
      }

      const { text } = await generateText({
        model: titleModel,
        prompt,
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
