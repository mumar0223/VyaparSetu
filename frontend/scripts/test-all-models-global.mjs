import dotenv from "dotenv";
dotenv.config();
import { GoogleAuth } from "google-auth-library";

async function testGlobalModels() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse.token;

  console.log("================================================================================");
  console.log(`Checking All 2.5, 3.1, 3.7 Models in [GLOBAL] & [REGIONAL] for Project: ${project}`);
  console.log("================================================================================\n");

  const candidateModels = [
    // 2.5 series
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.5-flash-native-audio-latest",
    // 3.1 series
    "gemini-3.1-flash",
    "gemini-3.1-flash-preview",
    "gemini-3.1-flash-live-preview",
    "gemini-3.1-pro",
    // 3.7 series
    "gemini-3.7-flash",
    "gemini-3.7-flash-preview",
    "gemini-3.7-pro",
    // 2.0 series
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-realtime-exp",
  ];

  // 1. Check Global endpoint (https://aiplatform.googleapis.com/v1beta1/projects/.../locations/global/...)
  console.log("--- 1. Testing in [GLOBAL] (locations/global) ---");
  for (const model of candidateModels) {
    const url = `https://aiplatform.googleapis.com/v1beta1/projects/${project}/locations/global/publishers/google/models/${model}:generateContent`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hello" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      if (res.ok) {
        console.log(`  ✅ ACTIVE in [global]: [${model}]`);
      } else {
        const body = await res.json().catch(() => ({}));
        console.log(`  ❌ Not Found in [global]: [${model}] (${res.status} ${body.error?.message?.slice(0, 50) || ""})`);
      }
    } catch (e) {
      console.log(`  ⚠️ Error in [global] for ${model}:`, e.message);
    }
  }

  // 2. Check us-central1 endpoint (https://us-central1-aiplatform.googleapis.com/v1beta1/...)
  console.log("\n--- 2. Testing in [US-CENTRAL1] (locations/us-central1) ---");
  for (const model of candidateModels) {
    const url = `https://us-central1-aiplatform.googleapis.com/v1beta1/projects/${project}/locations/us-central1/publishers/google/models/${model}:generateContent`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Hello" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });

      if (res.ok) {
        console.log(`  ✅ ACTIVE in [us-central1]: [${model}]`);
      } else {
        const body = await res.json().catch(() => ({}));
        console.log(`  ❌ Not Found in [us-central1]: [${model}] (${res.status} ${body.error?.message?.slice(0, 50) || ""})`);
      }
    } catch (e) {
      console.log(`  ⚠️ Error in [us-central1] for ${model}:`, e.message);
    }
  }
}

testGlobalModels().catch(console.error);
