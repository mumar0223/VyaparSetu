import dotenv from "dotenv";
dotenv.config();

import { GoogleAuth } from "google-auth-library";

async function testModelsLive() {
  console.log("================================================================================");
  console.log("   Testing Live WebSocket with Gemini 3.1 Flash & 2.5 Flash");
  console.log("================================================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const apiKey = process.env.GEMINI_API_KEY;

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse.token;

  const candidateModels = [
    "gemini-3.1-flash",
    "gemini-3.1-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview",
    "gemini-2.5-flash-realtime",
  ];

  // Test on Vertex AI Live Service (location: global and us-central1)
  console.log("--- 1. Testing Google Cloud Vertex AI Live Endpoint ---");
  for (const model of candidateModels) {
    for (const loc of ["global", "us-central1"]) {
      const host = loc === "global" ? "aiplatform.googleapis.com" : `${loc}-aiplatform.googleapis.com`;
      const wsUrl = `wss://${host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
      const modelResource = `projects/${project}/locations/${loc}/publishers/google/models/${model}`;

      await new Promise<void>((resolve) => {
        process.stdout.write(`Vertex [${loc} / ${model}]... `);
        const WS = (globalThis as any).WebSocket;
        const ws = new WS(wsUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        const timer = setTimeout(() => {
          if (ws.readyState === 1) ws.close();
          console.log("⏱️ Timeout");
          resolve();
        }, 3500);

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: modelResource,
                generationConfig: { responseModalities: ["AUDIO", "TEXT"] },
              },
            })
          );
        };

        ws.onmessage = (event: any) => {
          const data = JSON.parse(event.data.toString());
          if (data.setupComplete) {
            console.log(`✅ SUCCESS! Connected & Setup Complete!`);
            clearTimeout(timer);
            ws.close();
            resolve();
          }
        };

        ws.onclose = (event: any) => {
          clearTimeout(timer);
          console.log(`❌ Closed (${event.code}): ${event.reason?.substring(0, 60)}`);
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    }
  }

  // Test on Live Endpoint with API Key
  if (apiKey) {
    console.log("\n--- 2. Testing Live Endpoint with API Key ---");
    for (const model of candidateModels) {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

      await new Promise<void>((resolve) => {
        process.stdout.write(`Live Endpoint [models/${model}]... `);
        const WS = (globalThis as any).WebSocket;
        const ws = new WS(wsUrl);

        const timer = setTimeout(() => {
          if (ws.readyState === 1) ws.close();
          console.log("⏱️ Timeout");
          resolve();
        }, 3500);

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              setup: {
                model: `models/${model}`,
                generationConfig: { responseModalities: ["AUDIO", "TEXT"] },
              },
            })
          );
        };

        ws.onmessage = (event: any) => {
          const data = JSON.parse(event.data.toString());
          if (data.setupComplete) {
            console.log(`✅ SUCCESS! Connected & Setup Complete!`);
            clearTimeout(timer);
            ws.close();
            resolve();
          }
        };

        ws.onclose = (event: any) => {
          clearTimeout(timer);
          console.log(`❌ Closed (${event.code}): ${event.reason?.substring(0, 60)}`);
          resolve();
        };

        ws.onerror = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    }
  }
}

testModelsLive().catch(console.error);
