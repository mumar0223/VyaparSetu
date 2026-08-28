import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: "" });
    }

    const { audio, mimeType = "audio/pcm;rate=24000" } = await req.json();
    if (!audio) {
      return NextResponse.json({ text: "" });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Transcribe the spoken Hindi/Hinglish speech accurately into clean text. Output ONLY the transcript.",
                },
                {
                  inlineData: {
                    mimeType: mimeType.startsWith("audio/") ? mimeType : "audio/pcm;rate=24000",
                    data: audio,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ text: "" });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ text: "" });
  }
}
