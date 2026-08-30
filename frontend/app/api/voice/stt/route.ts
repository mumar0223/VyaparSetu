import { NextResponse } from "next/server";

// Speech recognition is part of the Vertex Live session now. Keeping a second
// REST STT provider caused mismatched captions and browser-specific behavior.
export async function POST() {
  return NextResponse.json(
    { error: "Voice transcription is provided by the Vertex Live session." },
    { status: 410 },
  );
}
