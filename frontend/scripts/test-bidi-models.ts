import { GoogleAuth } from "google-auth-library";
import * as dotenv from "dotenv";
import * as path from "path";
import WebSocket from "ws";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function testBidi() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!project || !clientEmail || !privateKey) {
    console.error("Missing Vertex credentials");
    return;
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse?.token;

  const testModels = [
    "gemini-3.8-live",
    "gemini-live-2.5-flash",
    "gemini-live-2.5-flash-native-audio",
  ];

  for (const modelId of testModels) {
    console.log(`\nConnecting WebSocket for: ${modelId}...`);
    const fullModelPath = `projects/${project}/locations/${location}/publishers/google/models/${modelId}`;
    const wsUrl = `wss://aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent?access_token=${token}`;

    const result = await new Promise<string>((resolve) => {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        ws.terminate();
        resolve("TIMEOUT (10s)");
      }, 10000);

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            setup: {
              model: fullModelPath,
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
                },
              },
            },
          }),
        );
      });

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.setupComplete) {
            clearTimeout(timer);
            ws.close();
            resolve("✅ setupComplete SUCCESS!");
          } else {
            clearTimeout(timer);
            ws.close();
            resolve(`RESPONSE: ${JSON.stringify(msg).slice(0, 100)}`);
          }
        } catch {
          clearTimeout(timer);
          ws.close();
          resolve(`RAW MSG: ${raw.toString().slice(0, 100)}`);
        }
      });

      ws.on("error", (err) => {
        clearTimeout(timer);
        resolve(`❌ WS ERROR: ${err.message}`);
      });

      ws.on("close", (code, reason) => {
        clearTimeout(timer);
        resolve(`CLOSED: code=${code}, reason=${reason.toString().slice(0, 100)}`);
      });
    });

    console.log(`Result for ${modelId}:`, result);
  }
}

testBidi().catch(console.error);
