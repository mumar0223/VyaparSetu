import dotenv from "dotenv";
dotenv.config();

/**
 * Test Gemini Multimodal Live API (Bidirectional WebSocket)
 * With Tools and real-time conversation turn
 */
async function testBidiLive() {
  console.log("================================================================================");
  console.log("   Multimodal Live API (Bidirectional WebSocket & Tool Calling Test)");
  console.log("================================================================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env");
  }

  const model = "models/gemini-2.0-flash-exp";
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

  console.log(`🌐 Connecting to Live WebSocket:\n    ${wsUrl.replace(apiKey, "AIzaSy...")}\n`);

  return new Promise<void>((resolve, reject) => {
    const WS = (globalThis as any).WebSocket;
    const ws = new WS(wsUrl);

    let isSetupComplete = false;
    let toolCallReceived = false;
    let textResponse = "";
    let audioBytes = 0;

    const timeout = setTimeout(() => {
      console.log("\n⏱️ Timeout reached (25s). Closing connection.");
      if (ws.readyState === 1) ws.close();
      resolve();
    }, 25000);

    ws.onopen = () => {
      console.log("✅ WebSocket Connected! Sending Setup Handshake Payload with Tools...\n");

      const setupPayload = {
        setup: {
          model,
          generationConfig: {
            responseModalities: ["AUDIO", "TEXT"],
          },
          systemInstruction: {
            parts: [
              {
                text: "You are VyaparSetu's autonomous business advisor. Speak natural conversational Hinglish. Call tools to fetch mandi rates and stage budgets.",
              },
            ],
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "getMandiRates",
                  description:
                    "Fetches real-time APMC mandi prices and market arrivals for commodities",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      commodity: {
                        type: "STRING",
                        description: "Name of commodity e.g. Onion, Wheat",
                      },
                      state: {
                        type: "STRING",
                        description: "State e.g. Maharashtra",
                      },
                    },
                    required: ["commodity"],
                  },
                },
                {
                  name: "stageBudgetDraft",
                  description: "Stages a structured budget preview on the screen",
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

      console.log("📤 Outgoing Setup Payload:");
      console.log(JSON.stringify(setupPayload, null, 2));
      ws.send(JSON.stringify(setupPayload));
    };

    ws.onmessage = (event: any) => {
      try {
        const rawData = typeof event.data === "string" ? event.data : event.data.toString();
        const data = JSON.parse(rawData);

        // 1. Setup Complete
        if (data.setupComplete) {
          isSetupComplete = true;
          console.log("\n📥 [Setup Complete] Live API Session Active!");

          const userPrompt =
            "I have ₹12,00,000 turnover in Maharashtra. Check today's Onion mandi price and stage a ₹2,00,000 budget draft for warehouse expansion.";
          console.log(`\n💬 [User Prompt]: "${userPrompt}"`);

          const userTurnMessage = {
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

          ws.send(JSON.stringify(userTurnMessage));
          return;
        }

        // 2. Tool Calls
        if (data.toolCall) {
          toolCallReceived = true;
          const calls = data.toolCall.functionCalls || [];
          console.log(`\n\n🔧 [Tool Call Received (${calls.length} functions)]:`);
          console.log(JSON.stringify(calls, null, 2));

          const functionResponses = calls.map((call: any) => {
            console.log(`⚡ Executing mock tool for "${call.name}" with args:`, call.args);
            let mockOutput = {};

            if (call.name === "getMandiRates") {
              mockOutput = {
                commodity: call.args.commodity || "Onion",
                market: "Nashik APMC",
                modalPrice: "₹1,850 / quintal",
                priceRange: "₹1,650 - ₹2,100 / quintal",
                arrivals: "450 Quintals",
                trend: "+3.8% Bullish",
              };
            } else if (call.name === "stageBudgetDraft") {
              mockOutput = {
                status: "STAGED_SUCCESS",
                title: call.args.title || "Warehouse Expansion",
                totalAmount: call.args.totalAmount || 200000,
                breakdown: [
                  { item: "Civil & Flooring", amount: 110000 },
                  { item: "Ventilation & Racks", amount: 60000 },
                  { item: "Packaging & Crates", amount: 30000 },
                ],
              };
            }

            return {
              response: { output: mockOutput },
              id: call.id,
            };
          });

          const toolResponseMessage = {
            toolResponse: {
              functionResponses,
            },
          };

          console.log("\n📤 Sending Tool Response back to Live API...");
          ws.send(JSON.stringify(toolResponseMessage));
          return;
        }

        // 3. Server Streaming Response
        if (data.serverContent) {
          const modelTurn = data.serverContent.modelTurn;
          if (modelTurn?.parts) {
            for (const part of modelTurn.parts) {
              if (part.text) {
                textResponse += part.text;
                process.stdout.write(part.text);
              }
              if (part.inlineData && part.inlineData.mimeType?.startsWith("audio/")) {
                const buffer = Buffer.from(part.inlineData.data, "base64");
                audioBytes += buffer.length;
              }
            }
          }

          if (data.serverContent.turnComplete) {
            console.log("\n\n🏁 [Server Turn Complete]");
            clearTimeout(timeout);
            ws.close();
            printSummary();
            resolve();
          }
        }
      } catch (e: any) {
        console.error("Message parse error:", e.message);
      }
    };

    ws.onerror = (err: any) => {
      console.error("\n❌ [WebSocket Error]:", err.message || err);
      clearTimeout(timeout);
      reject(err);
    };

    ws.onclose = (event: any) => {
      console.log(`\n🔒 [WebSocket Closed] Code: ${event.code}, Reason: ${event.reason || "Normal"}`);
      clearTimeout(timeout);
      resolve();
    };

    function printSummary() {
      console.log("\n================================================================================");
      console.log("   Multimodal Live API Test Summary");
      console.log("================================================================================");
      console.log(`Setup Handshake:        ${isSetupComplete ? "✅ SUCCESS" : "❌ FAILED"}`);
      console.log(`Tool Calling:           ${toolCallReceived ? "✅ SUCCESS (Model invoked tools!)" : "ℹ️ No tool called"}`);
      console.log(`Audio Stream:           ${audioBytes > 0 ? `✅ SUCCESS (${(audioBytes / 1024).toFixed(1)} KB PCM audio received)` : "None"}`);
      console.log(`Text Output Length:     ${textResponse.length} chars`);
      console.log("================================================================================\n");
    }
  });
}

testBidiLive().catch(console.error);
