import dotenv from "dotenv";
dotenv.config();

/**
 * Probe all candidate Live API models on Google's BidiGenerateContent WebSocket
 */
async function probeLiveModels() {
  console.log("================================================================================");
  console.log("   Probing All Gemini Multimodal Live API Models (Bidirectional WebSocket)");
  console.log("================================================================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const candidateModels = [
    "models/gemini-2.0-flash-realtime-exp",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-001",
    "models/gemini-2.0-flash-exp",
    "models/gemini-2.0-pro-exp-02-05",
    "models/gemini-2.0-flash-thinking-exp-01-21",
    "models/gemini-2.0-flash-lite",
    "models/gemini-2.0-flash-lite-preview-02-05",
    "models/gemini-exp-1206",
  ];

  for (const model of candidateModels) {
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    await new Promise<void>((resolve) => {
      process.stdout.write(`Testing Live Model [${model}]... `);
      const WS = (globalThis as any).WebSocket;
      const ws = new WS(wsUrl);

      const timer = setTimeout(() => {
        if (ws.readyState === 1) ws.close();
        console.log("⏱️ Timeout");
        resolve();
      }, 4000);

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            setup: {
              model,
              generationConfig: {
                responseModalities: ["AUDIO", "TEXT"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Puck",
                    },
                  },
                },
              },
            },
          })
        );
      };

      ws.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data.toString());
          if (data.setupComplete) {
            console.log(`✅ SUCCESS! Active & Live Supported!`);
            clearTimeout(timer);
            ws.close();
            resolve();
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = (event: any) => {
        clearTimeout(timer);
        if (event.code !== 1000) {
          console.log(`❌ Closed (${event.code}): ${event.reason || "Unsupported"}`);
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

probeLiveModels().catch(console.error);
