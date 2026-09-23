import { GoogleAuth } from "google-auth-library";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testModels() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!project || !clientEmail || !privateKey) {
    console.error("Missing Vertex credentials in .env");
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse?.token;

  console.log("Got access token:", Boolean(accessToken));

  const candidateModels = [
    "gemini-3.8-live",
    "gemini-3.8-flash-live",
    "gemini-3.8-live-extended-thinking",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-live-2.5-flash",
    "gemini-2.5-flash",
  ];

  for (const modelId of candidateModels) {
    process.stdout.write(`Testing model ${modelId}... `);
    const host = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Hello" }],
            },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`✅ SUCCEEDED! (${text?.trim()?.slice(0, 30)})`);
      } else {
        const msg = data.error?.message || data.error || res.statusText;
        console.log(`❌ ${res.status}: ${String(msg).slice(0, 80)}`);
      }
    } catch (err: any) {
      console.log(`❌ error: ${err.message}`);
    }
  }
}

testModels().catch(console.error);
