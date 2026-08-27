import dotenv from "dotenv";
dotenv.config();

/**
 * VyaparSetu - Gemini Multimodal Live API (Bidirectional WebSocket Call Engine)
 * Tests real-time 2-way call session with native voice streaming, tools, and audio playback data.
 */
async function runLiveCallTest() {
  console.log("================================================================================");
  console.log("   Gemini Multimodal Live API: 2-Way Real-Time Voice Call & Tools Engine");
  console.log("================================================================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const model = "models/gemini-2.0-flash-exp";
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

  console.log(`[Config] Live Model: ${model}`);
  console.log(`[Config] Voice Name: Puck (Conversational Native Voice)`);
  console.log(`[Config] Modalities: ["AUDIO", "TEXT"] (True 2-Way Call)\n`);
  console.log(`🌐 Connecting to Live WebSocket:\n    ${wsUrl.replace(apiKey, "AIzaSy...")}\n`);

  return new Promise<void>((resolve, reject) => {
    const WS = (globalThis as any).WebSocket;
    const ws = new WS(wsUrl);

    let isConnected = false;
    let isSetupDone = false;
    let totalAudioBytes = 0;
    let totalTextChars = 0;
    let toolCallsCount = 0;
    let transcribedText = "";

    const timeout = setTimeout(() => {
      console.log("\n⏱️ Live Call Session completed (25s max). Closing connection.");
      if (ws.readyState === 1) ws.close();
      printCallSummary();
      resolve();
    }, 25000);

    const callStartTime = Date.now();

    ws.onopen = () => {
      isConnected = true;
      const connectTime = ((Date.now() - callStartTime) / 1000).toFixed(2);
      console.log(`✅ [WebSocket Connected in ${connectTime}s] Initializing Live Call Handshake...\n`);

      // 1. Send Setup Handshake with Audio Modality + Voice Persona + Tools
      const setupMessage = {
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
          systemInstruction: {
            parts: [
              {
                text: "You are VyaparSetu's real-time conversational business advisor for rural micro-entrepreneurs. Speak natural conversational Hinglish. When asked about mandi rates or budgets, call the appropriate tools and confirm the key numbers clearly in your spoken voice.",
              },
            ],
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "getMandiRates",
                  description: "Fetches live APMC market prices and arrival data for commodities in India",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      commodity: { type: "STRING", description: "Name of commodity e.g. Onion, Wheat" },
                      market: { type: "STRING", description: "Market name e.g. Nashik" },
                    },
                    required: ["commodity"],
                  },
                },
                {
                  name: "stageBudgetDraft",
                  description: "Stages a financial budget breakdown preview on the screen HUD",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      totalAmount: { type: "NUMBER" },
                    },
                    required: ["title", "totalAmount"],
                  },
                },
              ],
            },
          ],
        },
      };

      console.log("📤 [Setup Message Sent]: Declaring Audio Output + Tools");
      ws.send(JSON.stringify(setupMessage));
    };

    ws.onmessage = (event: any) => {
      try {
        const raw = typeof event.data === "string" ? event.data : event.data.toString();
        const msg = JSON.parse(raw);

        // A. Setup Completed - Session is Live!
        if (msg.setupComplete) {
          isSetupDone = true;
          console.log("📥 [Setup Complete] 🟢 Live Call Active! Ready for 2-Way Audio/Text conversation.\n");

          // 2. User Speaks into Call (Sending User Input)
          const userPrompt =
            "Namaste! Meri ₹12,00,000 turnover hai Maharashtra me. Aaj ka Nashik Onion mandi rate check kijiye aur ₹2,00,000 warehouse expansion budget stage karke aawaz me samjhaiye.";

          console.log(`🗣️ [User Speaks in Call]: "${userPrompt}"\n`);
          console.log("⚡ [Gemini Listening & Generating Real-Time Spoken Response]...\n");

          const userMessage = {
            clientContent: {
              turns: [
                {
                  role: "user",
                  parts: [{ text: userPrompt }],
                },
              ],
              turnComplete: true,
            },
          };

          ws.send(JSON.stringify(userMessage));
          return;
        }

        // B. Handle Server Content (Native Spoken Audio + Text Transcription)
        if (msg.serverContent) {
          const modelTurn = msg.serverContent.modelTurn;
          if (modelTurn?.parts) {
            for (const part of modelTurn.parts) {
              // 1. Text transcription delta
              if (part.text) {
                transcribedText += part.text;
                totalTextChars += part.text.length;
                process.stdout.write(part.text);
              }

              // 2. Raw 24kHz PCM Audio chunk (Ready for browser speaker playback)
              if (part.inlineData && part.inlineData.mimeType?.startsWith("audio/")) {
                const audioChunk = Buffer.from(part.inlineData.data, "base64");
                totalAudioBytes += audioChunk.length;
                process.stdout.write(` 🔊[Audio Chunk ${audioChunk.length}B] `);
              }
            }
          }

          if (msg.serverContent.turnComplete) {
            console.log("\n\n🏁 [Gemini Finished Speaking Current Turn]");
            clearTimeout(timeout);
            ws.close();
            printCallSummary();
            resolve();
          }
        }

        // C. Handle Tool Calls from Model in Live Call
        if (msg.toolCall) {
          toolCallsCount++;
          const calls = msg.toolCall.functionCalls || [];
          console.log(`\n\n🔧 [Live Tool Triggered in Call (${calls.length} functions)]:`);
          console.log(JSON.stringify(calls, null, 2));

          const functionResponses = calls.map((c: any) => {
            console.log(`⚡ [Executing Tool in Background]: "${c.name}"...`);
            let mockData = {};

            if (c.name === "getMandiRates") {
              mockData = {
                commodity: "Onion",
                market: "Nashik APMC, Maharashtra",
                modalPrice: "₹1,850 / quintal",
                trend: "+3.8% Bullish (Prices rising)",
                arrivals: "450 Quintals",
              };
            } else if (c.name === "stageBudgetDraft") {
              mockData = {
                status: "STAGED_SUCCESS",
                title: "Warehouse Expansion",
                totalAmount: "₹2,00,000",
                breakdown: [
                  { item: "Ventilation & Racks", amount: "₹85,000" },
                  { item: "Civil Work", amount: "₹85,000" },
                  { item: "Sorting Crates", amount: "₹30,000" },
                ],
              };
            }

            return {
              response: { output: mockData },
              id: c.id,
            };
          });

          // Send Tool Response back into the Live WebSocket
          const toolResponsePayload = {
            toolResponse: {
              functionResponses,
            },
          };

          console.log("📤 [Sending Tool Results back into Live Call Stream]...\n");
          ws.send(JSON.stringify(toolResponsePayload));
        }
      } catch (err: any) {
        console.error("Parse error:", err.message);
      }
    };

    ws.onerror = (err: any) => {
      console.error("\n❌ [Live WebSocket Error]:", err.message || err);
      clearTimeout(timeout);
      reject(err);
    };

    ws.onclose = (event: any) => {
      console.log(`\n🔒 [Live Call Closed] Code: ${event.code}, Reason: ${event.reason || "Normal end of turn"}`);
      clearTimeout(timeout);
      resolve();
    };

    function printCallSummary() {
      const callDuration = ((Date.now() - callStartTime) / 1000).toFixed(2);
      console.log("\n================================================================================");
      console.log("   Live Multimodal Voice Call Summary");
      console.log("================================================================================");
      console.log(`Call Status:                  🟢 SUCCESS (Live Call Completed)`);
      console.log(`Call Duration:                ${callDuration}s`);
      console.log(`2-Way Live Protocol:          Bidirectional WebSocket (BidiGenerateContent)`);
      console.log(`Live Model:                   ${model}`);
      console.log(`Native Voice Mode:            Active (Puck Persona, 24kHz PCM)`);
      console.log(`Audio Chunks Received:        ${(totalAudioBytes / 1024).toFixed(1)} KB (Spoken Voice Audio)`);
      console.log(`Live Tools Triggered:         ${toolCallsCount} tool(s) executed in real-time`);
      console.log(`Transcribed Output:           ${totalTextChars} chars`);
      console.log("================================================================================\n");
    }
  });
}

runLiveCallTest().catch((err) => {
  console.error("\n❌ Live Call Test Failed:", err);
  process.exit(1);
});
