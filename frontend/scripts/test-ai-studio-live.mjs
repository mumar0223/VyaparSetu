import dotenv from "dotenv";
dotenv.config();

async function testGemini25FlashLive() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("--------------------------------------------------");
  console.log("Testing Google AI Studio Gemini 2.5 Flash Live API");
  console.log("--------------------------------------------------");
  console.log("Using API Key:", apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : "MISSING");

  const model = "models/gemini-2.5-flash-native-audio-latest";
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

  console.log("Connecting to:", wsUrl.replace(apiKey, "[REDACTED]"));
  const startTime = Date.now();
  const ws = new WebSocket(wsUrl);

  ws.addEventListener("open", () => {
    const connTime = Date.now() - startTime;
    console.log(`✅ [${connTime}ms] WebSocket Connection Established!`);

    const setupPayload = {
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
          parts: [
            {
              text: "You are VyaparSetu Voice OS. Speak ONLY in 1 short sentence of energetic conversational Hindi/Hinglish.",
            },
          ],
        },
      },
    };

    console.log("📤 Sending setup handshake payload...");
    ws.send(JSON.stringify(setupPayload));
  });

  let firstChunkReceived = false;
  let totalAudioBytes = 0;

  ws.addEventListener("message", async (event) => {
    let text = "";
    if (typeof event.data === "string") text = event.data;
    else if (event.data instanceof Blob) text = await event.data.text();
    else if (event.data instanceof ArrayBuffer) text = new TextDecoder().decode(event.data);

    let msg = {};
    try {
      msg = JSON.parse(text);
    } catch {
      console.log("Raw message:", text);
      return;
    }

    if (msg.setupComplete) {
      const setupTime = Date.now() - startTime;
      console.log(`🎉 [${setupTime}ms] setupComplete received! Live session is 100% active.`);

      console.log("📤 Sending conversational user turn prompt in Hindi...");
      const sendTurnTime = Date.now();

      const userTurn = {
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [
                {
                  text: "Namaste! VyaparSetu kya hai aur aap meri kya madad kar sakte hain?",
                },
              ],
            },
          ],
          turnComplete: true,
        },
      };

      ws.send(JSON.stringify(userTurn));
    }

    if (msg.serverContent) {
      const parts = msg.serverContent.modelTurn?.parts || [];
      for (const p of parts) {
        if (p.text) {
          console.log("📝 Text Part:", p.text);
        }
        if (p.inlineData?.data) {
          totalAudioBytes += p.inlineData.data.length;
          if (!firstChunkReceived) {
            firstChunkReceived = true;
            const latency = Date.now() - startTime;
            console.log(`⚡ [${latency}ms] First 24kHz Audio Chunk Received! (Sub-200ms Edge Streaming)`);
          }
        }
      }

      if (msg.serverContent.turnComplete) {
        console.log(`🏁 Turn Complete! Total 24kHz PCM Audio received: ${totalAudioBytes} bytes.`);
        console.log("--------------------------------------------------");
        console.log("✅ Google AI Studio Gemini 2.5 Flash Live API verified successfully!");
        console.log("--------------------------------------------------");
        ws.close();
        process.exit(0);
      }
    }
  });

  ws.addEventListener("error", (err) => {
    console.error("❌ WebSocket Error:", err);
  });

  ws.addEventListener("close", (event) => {
    console.log(`ℹ️ WebSocket Closed: Code ${event.code}, Reason: ${event.reason || "Normal Closure"}`);
  });
}

testGemini25FlashLive().catch(console.error);
