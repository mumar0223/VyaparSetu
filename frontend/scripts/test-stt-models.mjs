import dotenv from "dotenv";
dotenv.config();
import { GoogleAuth } from "google-auth-library";

async function testSTTOptions() {
  console.log("================================================================================");
  console.log("   Testing Advanced STT Options (Google Cloud STT & Gemini Audio Understanding)");
  console.log("================================================================================\n");

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const project = process.env.GOOGLE_VERTEX_PROJECT;

  // 1. Google Cloud Speech-to-Text API (Chirp / Multi-lingual V2 / V1)
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  console.log("1. Testing Google Cloud Speech-to-Text API (hi-IN / en-IN)...");
  try {
    const res = await fetch(`https://speech.googleapis.com/v1/speech:recognize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "hi-IN",
          alternativeLanguageCodes: ["en-IN", "hi-Latn"],
          enableAutomaticPunctuation: true,
          model: "default",
        },
        audio: {
          // 1 second of blank PCM audio sample
          content: Buffer.alloc(32000).toString("base64"),
        },
      }),
    });

    if (res.ok) {
      console.log("✅ Google Cloud Speech-to-Text API is ACTIVE & RESPONDING!");
    } else {
      const err = await res.json().catch(() => ({}));
      console.log("❌ Google Cloud STT response:", res.status, err.error?.message || err);
    }
  } catch (e) {
    console.log("⚠️ Google Cloud STT error:", e.message);
  }

  // 2. Gemini 2.5 Flash Native Multimodal Audio Transcription
  console.log("\n2. Testing Gemini Native Multimodal Audio Transcription...");
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Transcribe the audio accurately. If audio is silent or empty, return [SILENCE]." },
              {
                inlineData: {
                  mimeType: "audio/wav",
                  data: "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
                },
              },
            ],
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("✅ Gemini Native Multimodal Audio STT is ACTIVE! Output:", data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log("❌ Gemini Audio STT status:", res.status);
    }
  } catch (e) {
    console.log("⚠️ Gemini Audio STT error:", e.message);
  }
}

testSTTOptions().catch(console.error);
