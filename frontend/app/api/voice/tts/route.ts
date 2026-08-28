import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, lang = "hi-IN" } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const cleanedText = text
      .replace(/[*#_`~[\]]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 800);

    const voiceName = lang.startsWith("hi") ? "hi-IN-Neural2-B" : "en-IN-Journey-D";

    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const ttsPayload = {
      input: { text: cleanedText },
      voice: {
        languageCode: lang,
        name: voiceName,
        ssmlGender: "MALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.05,
        pitch: -1.0,
      },
    };

    const ttsRes = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ttsPayload),
    });

    if (!ttsRes.ok) {
      return NextResponse.json({ error: "TTS synthesis failed" }, { status: 500 });
    }

    const ttsData = await ttsRes.json();
    return NextResponse.json({
      audioContent: ttsData.audioContent,
      mimeType: "audio/mp3",
    });
  } catch (error: any) {
    console.error("[POST /api/voice/tts error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}
