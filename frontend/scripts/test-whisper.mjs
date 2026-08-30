import dotenv from "dotenv";
dotenv.config();

async function testWhisper() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL;

  console.log("Checking Whisper on OPENAI_BASE_URL:", baseUrl);

  // Check if audio/transcriptions endpoint exists on baseUrl
  try {
    const res = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    console.log("Whisper endpoint status:", res.status);
  } catch (e) {
    console.log("Whisper endpoint error:", e.message);
  }
}

testWhisper().catch(console.error);
