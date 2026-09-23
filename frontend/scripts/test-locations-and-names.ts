import { GoogleAuth } from "google-auth-library";
import * as dotenv from "dotenv";
import * as path from "path";
import WebSocket from "ws";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function checkAll() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!project || !clientEmail || !privateKey) {
    console.error("Missing credentials");
    return;
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken())?.token;

  const locations = ["us-central1", "global", "us-east4"];
  const candidateLiveModels = [
    "gemini-3.8-live",
    "gemini-3.8-flash-live",
    "gemini-3.8-live-preview",
    "gemini-3.8-live-001",
    "gemini-3.0-live",
    "gemini-2.5-flash-live",
    "gemini-live-2.5-flash",
    "gemini-2.0-flash-realtime-exp",
    "gemini-2.0-flash-live",
  ];

  console.log("=== 1. TESTING BIDI WEBSOCKET ACROSS LOCATIONS & NAMES ===");
  for (const loc of locations) {
    console.log(`\n--- LOCATION: ${loc} ---`);
    for (const modelId of candidateLiveModels) {
      const fullPath = `projects/${project}/locations/${loc}/publishers/google/models/${modelId}`;
      const host = loc === "global" ? "aiplatform.googleapis.com" : `${loc}-aiplatform.googleapis.com`;
      const wsUrl = `wss://${host}/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent?access_token=${token}`;

      const res = await new Promise<string>((resolve) => {
        const ws = new WebSocket(wsUrl);
        const timer = setTimeout(() => {
          ws.terminate();
          resolve("TIMEOUT");
        }, 5000);

        ws.on("open", () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: fullPath,
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
                  },
                },
              },
            })
          );
        });

        ws.on("message", (raw) => {
          try {
            const m = JSON.parse(raw.toString());
            if (m.setupComplete) {
              clearTimeout(timer);
              ws.close();
              resolve("✅ SUCCESS: setupComplete!");
            } else {
              clearTimeout(timer);
              ws.close();
              resolve(`RESP: ${JSON.stringify(m).slice(0, 70)}`);
            }
          } catch {
            clearTimeout(timer);
            ws.close();
            resolve("RAW");
          }
        });

        ws.on("error", (err) => {
          clearTimeout(timer);
          resolve(`ERR: ${err.message}`);
        });

        ws.on("close", (code, reason) => {
          clearTimeout(timer);
          const r = reason.toString();
          if (r.includes("not found")) {
            resolve("❌ NOT FOUND (404)");
          } else if (r.includes("PermissionDenied")) {
            resolve("❌ PERMISSION DENIED");
          } else {
            resolve(`CLOSED: ${code} ${r.slice(0, 60)}`);
          }
        });
      });

      console.log(`[${loc}] ${modelId.padEnd(30)} => ${res}`);
    }
  }

  console.log("\n=== 2. TESTING REST GENERATE CONTENT (For Sub-Agent) ===");
  const candidateGenModels = [
    "gemini-3.8-flash",
    "gemini-3.8-flash-001",
    "gemini-3.8-pro",
    "gemini-3.7-flash",
    "gemini-3.7-flash-001",
    "gemini-2.5-flash",
  ];

  for (const loc of ["us-central1", "global"]) {
    console.log(`\n--- LOCATION: ${loc} ---`);
    for (const modelId of candidateGenModels) {
      const host = loc === "global" ? "aiplatform.googleapis.com" : `${loc}-aiplatform.googleapis.com`;
      const url = `https://${host}/v1/projects/${project}/locations/${loc}/publishers/google/models/${modelId}:generateContent`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "hi" }] }],
          }),
        });

        const data = await res.json();
        if (res.ok) {
          console.log(`[${loc}] ${modelId.padEnd(25)} => ✅ SUCCESS!`);
        } else {
          const err = data.error?.message || data.error?.status || res.statusText;
          console.log(`[${loc}] ${modelId.padEnd(25)} => ❌ ${res.status}: ${String(err).slice(0, 60)}`);
        }
      } catch (e: any) {
        console.log(`[${loc}] ${modelId.padEnd(25)} => ❌ ${e.message}`);
      }
    }
  }
}

checkAll().catch(console.error);
