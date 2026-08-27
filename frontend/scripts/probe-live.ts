import dotenv from "dotenv";
dotenv.config();

import { GoogleAuth } from "google-auth-library";

async function probeLiveEndpoints() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse.token;

  const testCases = [
    { loc: "us-central1", model: "gemini-2.0-flash-exp" },
    { loc: "us-central1", model: "gemini-2.0-flash" },
    { loc: "us-central1", model: "gemini-2.0-flash-001" },
    { loc: "us-central1", model: "gemini-2.0-flash-live-exp" },
    { loc: "us-central1", model: "gemini-2.0-flash-realtime-exp" },
    { loc: "us-central1", model: "gemini-exp-1206" },
    { loc: "global", model: "gemini-2.0-flash-exp" },
    { loc: "global", model: "gemini-2.0-flash" },
    { loc: "global", model: "gemini-3.7-flash" },
  ];

  for (const { loc, model } of testCases) {
    const host = loc === "global" ? "aiplatform.googleapis.com" : `${loc}-aiplatform.googleapis.com`;
    const wsUrl = `wss://${host}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
    const modelResource = `projects/${project}/locations/${loc}/publishers/google/models/${model}`;

    await new Promise<void>((resolve) => {
      process.stdout.write(`Testing [${loc} / ${model}]... `);
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
      }, 4000);

      ws.onopen = () => {
        const setup = {
          setup: {
            model: modelResource,
            generationConfig: { responseModalities: ["AUDIO", "TEXT"] },
          },
        };
        ws.send(JSON.stringify(setup));
      };

      ws.onmessage = (event: any) => {
        const data = JSON.parse(event.data.toString());
        if (data.setupComplete) {
          console.log(`✅ SUCCESS! Setup Complete!`);
          clearTimeout(timer);
          ws.close();
          resolve();
        }
      };

      ws.onclose = (event: any) => {
        clearTimeout(timer);
        console.log(`❌ Closed (${event.code}): ${event.reason?.substring(0, 70)}`);
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }
}

probeLiveEndpoints().catch(console.error);
