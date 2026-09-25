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
    const { userTranscript, assistantTranscript, toolCalls, thinking, files } = body;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (userTranscript?.trim() || (Array.isArray(files) && files.length > 0)) {
      const attachmentRecords: Array<{
        name: string;
        url: string;
        type: "DOCUMENT" | "IMAGE" | "PDF" | "SHEET";
        mimeType?: string;
        size?: number;
      }> = [];

      const rawFileStrings: string[] = [];

      if (Array.isArray(files)) {
        for (const f of files) {
          if (!f) continue;
          if (typeof f === "object" && f.url) {
            const mime = f.mimeType || "";
            const isImg = f.type === "image" || f.type === "IMAGE" || mime.startsWith("image/") || /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(f.name || f.url);
            const isPdf = f.type === "pdf" || f.type === "PDF" || mime === "application/pdf" || (f.name || f.url).toLowerCase().endsWith(".pdf");
            const isSheet = f.type === "sheet" || f.type === "SHEET" || mime.includes("sheet") || mime.includes("csv") || /\.(xlsx|xls|csv)$/i.test(f.name || f.url);
            const type: "DOCUMENT" | "IMAGE" | "PDF" | "SHEET" = isImg ? "IMAGE" : isPdf ? "PDF" : isSheet ? "SHEET" : "DOCUMENT";

            attachmentRecords.push({
              name: f.name || f.uploadedName || "Attachment",
              url: f.url,
              type,
              mimeType: mime || undefined,
              size: typeof f.size === "number" && Number.isFinite(f.size) ? Math.min(Math.round(f.size), 2147483647) : undefined,
            });
            rawFileStrings.push(JSON.stringify(f));
          } else if (typeof f === "string") {
            let parsed: any = null;
            try { parsed = JSON.parse(f); } catch {}
            if (parsed && typeof parsed === "object" && parsed.url) {
              const mime = parsed.mimeType || "";
              const isImg = parsed.type === "image" || parsed.type === "IMAGE" || mime.startsWith("image/") || /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(parsed.name || parsed.url);
              const isPdf = parsed.type === "pdf" || parsed.type === "PDF" || mime === "application/pdf" || (parsed.name || parsed.url).toLowerCase().endsWith(".pdf");
              const isSheet = parsed.type === "sheet" || parsed.type === "SHEET" || mime.includes("sheet") || mime.includes("csv") || /\.(xlsx|xls|csv)$/i.test(parsed.name || parsed.url);
              const type: "DOCUMENT" | "IMAGE" | "PDF" | "SHEET" = isImg ? "IMAGE" : isPdf ? "PDF" : isSheet ? "SHEET" : "DOCUMENT";

              attachmentRecords.push({
                name: parsed.name || parsed.uploadedName || "Attachment",
                url: parsed.url,
                type,
                mimeType: mime || undefined,
                size: typeof parsed.size === "number" && Number.isFinite(parsed.size) ? Math.min(Math.round(parsed.size), 2147483647) : undefined,
              });
              rawFileStrings.push(f);
            } else {
              // Legacy plain URL string: defaults to DOCUMENT
              const url = f.trim();
              const isImg = /\.(jpeg|jpg|png|gif|webp|svg)/i.test(url);
              attachmentRecords.push({
                name: url.split("/").pop() || "Document",
                url,
                type: isImg ? "IMAGE" : "DOCUMENT",
              });
              rawFileStrings.push(url);
            }
          }
        }
      }

      await prisma.conversationMessage.create({
        data: {
          conversationId: id,
          role: "user",
          content: userTranscript?.trim() || "",
          files: rawFileStrings,
          attachments: attachmentRecords.length > 0 ? {
            create: attachmentRecords,
          } : undefined,
        },
      });
    }

    if (assistantTranscript?.trim() || (Array.isArray(toolCalls) && toolCalls.length > 0)) {
      await prisma.conversationMessage.create({
        data: {
          conversationId: id,
          role: "assistant",
          content: assistantTranscript?.trim() || "",
          thinking: typeof thinking === "string" ? thinking : undefined,
          toolCalls: Array.isArray(toolCalls) && toolCalls.length > 0 ? toolCalls : undefined,
        },
      });
    }

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/chats/[id]/messages error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to persist messages" },
      { status: 500 }
    );
  }
}
