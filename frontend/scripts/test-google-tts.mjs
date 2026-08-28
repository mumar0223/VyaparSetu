import dotenv from "dotenv";
dotenv.config();
import { GoogleAuth } from "google-auth-library";

async function testVoices() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse.token;

  const voicesToTest = [
    { name: "hi-IN-Neural2-B", lang: "hi-IN", gender: "MALE" },
    { name: "en-IN-Neural2-B", lang: "en-IN", gender: "MALE" },
    { name: "hi-IN-Journey-D", lang: "hi-IN", gender: "MALE" },
    { name: "en-IN-Journey-D", lang: "en-IN", gender: "MALE" },
  ];

  for (const v of voicesToTest) {
    const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: { text: "Namaste! VyaparSetu Voice OS me aapka swagat hai." },
        voice: { languageCode: v.lang, name: v.name, ssmlGender: v.gender },
        audioConfig: { audioEncoding: "MP3" }
      })
    });
    if (res.ok) {
      console.log(`✅ Voice supported: [${v.name}] (${v.lang})`);
    } else {
      console.log(`❌ Voice not supported: [${v.name}]`);
    }
  }
}

testVoices().catch(console.error);
