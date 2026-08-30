import dotenv from "dotenv";
dotenv.config();
import { GoogleAuth } from "google-auth-library";

async function listModels() {
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

  console.log(`Authenticated with Service Account: ${clientEmail}`);
  console.log(`Checking Vertex Project: ${project}\n`);

  const regions = ["us-central1", "asia-south1", "us-east4"];
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
  ];

  for (const region of regions) {
    console.log(`=== Testing Region: [${region}] ===`);
    for (const model of candidateModels) {
      const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/publishers/google/models/${model}:generateContent`;

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
          console.log(`  ✅ ACTIVE: [${model}] in ${region}`);
        } else {
          console.log(`  ❌ Not Available: [${model}] in ${region} (${res.status})`);
        }
      } catch (e) {
        console.log(`  ⚠️ Error ${model}:`, e.message);
      }
    }
  }
}

listModels().catch(console.error);
