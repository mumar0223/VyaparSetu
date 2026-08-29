import dotenv from "dotenv";
dotenv.config();

import { GoogleAuth } from "google-auth-library";

async function findLiveModel() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = "us-central1";
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

  const candidates = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-realtime-exp",
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview",
    "gemini-experimental",
  ];

  for (const modelName of candidates) {
    const wsUrl = `wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;
    const modelResource = `projects/${project}/locations/${location}/publishers/google/models/${modelName}`;

    await new Promise<void>((resolve) => {
      process.stdout.write(`Testing Live Model [${modelName}]... `);
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
      }, 5000);

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
          console.log(`✅ SUCCESS! Setup Complete on [${modelName}]`);
          clearTimeout(timer);
          ws.close();
          resolve();
        }
      };

      ws.onclose = (event: any) => {
        clearTimeout(timer);
        if (event.code !== 1000) {
          console.log(`❌ Closed (${event.code}): ${event.reason?.substring(0, 60)}`);
        }
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }
}

findLiveModel().catch(console.error);
