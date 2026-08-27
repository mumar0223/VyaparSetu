import dotenv from "dotenv";
dotenv.config();

/**
 * Test Google's Official Live Multimodal WebSocket Models:
 * - models/gemini-3.1-flash-live-preview
 * - models/gemini-2.5-flash-native-audio-latest
 */
async function testOfficialLive() {
  console.log("================================================================================");
  console.log("   Testing Official Google Live API Models (bidiGenerateContent)");
  console.log("================================================================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const liveModels = [
    "models/gemini-3.1-flash-live-preview",
    "models/gemini-2.5-flash-native-audio-latest",
  ];

  for (const model of liveModels) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`🎙️ Testing Model: [${model}] on Live WebSocket...`);
    console.log(`--------------------------------------------------------------------------------`);

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    await new Promise<void>((resolve) => {
      const WS = (globalThis as any).WebSocket;
      const ws = new WS(wsUrl);

      let isDone = false;
      let totalAudioBytes = 0;

      const timer = setTimeout(() => {
        if (!isDone) {
          console.log(`\n🏁 [Session Complete on ${model}] Received ${(totalAudioBytes / 1024).toFixed(1)} KB Spoken Audio.`);
          if (ws.readyState === 1) ws.close();
          resolve();
        }
      }, 10000);

      ws.onopen = () => {
        console.log(`✅ [WebSocket Connected] Sending Setup Handshake for ${model}...`);
        const setup = {
          setup: {
            model,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Puck",
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: "You are VyaparSetu's live voice advisor. Speak short conversational Hinglish." }],
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "getMandiRates",
                    description: "Fetches live APMC market prices for commodities",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        commodity: { type: "STRING" },
                      },
                      required: ["commodity"],
                    },
                  },
                ],
              },
            ],
          },
        };
        ws.send(JSON.stringify(setup));
      };

      ws.onmessage = async (event: any) => {
        try {
          let text = "";
          if (typeof event.data === "string") {
            text = event.data;
          } else if (event.data instanceof Blob) {
            text = await event.data.text();
          } else if (Buffer.isBuffer(event.data)) {
            text = event.data.toString("utf8");
          }

          const data = JSON.parse(text);

          // Setup Complete
          if (data.setupComplete) {
            console.log(`🟢 [SETUP COMPLETE!] ${model} is ACTIVE on Live WebSocket!`);
            console.log(`🗣️ [User Speaks in Call]: "Namaste! Onion ka mandi rate batao."\n`);
            console.log(`⚡ [Gemini Speaking Back in Real-Time Native Audio]:`);

            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [{ role: "user", parts: [{ text: "Namaste! Onion ka mandi rate batao." }] }],
                  turnComplete: true,
                },
              })
            );
            return;
          }

          // Tool Call
          if (data.toolCall) {
            console.log(`\n🔧 [Live Tool Triggered]:`, JSON.stringify(data.toolCall, null, 2));
            const call = data.toolCall.functionCalls[0];
            ws.send(
              JSON.stringify({
                toolResponse: {
                  functionResponses: [
                    {
                      id: call.id,
                      response: { output: { rate: "₹1,850/quintal", market: "Nashik APMC" } },
                    },
                  ],
                },
              })
            );
            return;
          }

          // Server Native Audio Chunks
          if (data.serverContent) {
            const parts = data.serverContent.modelTurn?.parts || [];
            for (const p of parts) {
              if (p.inlineData?.mimeType?.startsWith("audio/")) {
                const len = Buffer.from(p.inlineData.data, "base64").length;
                totalAudioBytes += len;
                process.stdout.write(` 🔊[Audio ${len}B] `);
              }
            }
            if (data.serverContent.turnComplete) {
              console.log(`\n\n🏁 [Turn Finished on ${model}] Total Audio: ${(totalAudioBytes / 1024).toFixed(1)} KB PCM`);
              isDone = true;
              clearTimeout(timer);
              ws.close();
              resolve();
            }
          }
        } catch (e: any) {
          console.error("Error processing message:", e.message);
        }
      };

      ws.onclose = (e: any) => {
        if (e.code !== 1000 && !isDone) {
          console.log(`❌ Closed (${e.code}): ${e.reason}`);
        }
        clearTimeout(timer);
        resolve();
      };

      ws.onerror = (e: any) => {
        console.error("WS Error:", e.message || e);
        clearTimeout(timer);
        resolve();
      };
    });
  }
}

testOfficialLive().catch(console.error);
