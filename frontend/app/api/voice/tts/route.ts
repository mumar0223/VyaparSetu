import { NextResponse } from "next/server";

// Audio output is streamed by the Vertex Live native-audio model. This route
// deliberately has no second-provider fallback.
export async function POST() {
  return NextResponse.json(
    { error: "Voice synthesis is provided by the Vertex Live session." },
    { status: 410 },
  );
}
