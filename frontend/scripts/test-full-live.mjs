import dotenv from "dotenv";
dotenv.config();

async function testFullBidiFlow() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing Full Google Live Bidi Flow...");

  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  const ws = new WebSocket(wsUrl);

  ws.addEventListener("open", () => {
    console.log("✅ WebSocket opened!");

    const setupPayload = {
      setup: {
        model: "models/gemini-2.5-flash-native-audio-latest",
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
              text: "You are VyaparSetu Voice OS. Speak ONLY in conversational Hindi and Hinglish.",
            },
          ],
        },
      },
    };

    console.log("Sending setup payload...");
    ws.send(JSON.stringify(setupPayload));
  });

  ws.addEventListener("message", async (event) => {
    let text = "";
    if (typeof event.data === "string") text = event.data;
    else if (event.data instanceof Blob) text = await event.data.text();
    else if (event.data instanceof ArrayBuffer) text = new TextDecoder().decode(event.data);

    const msg = JSON.parse(text);
    console.log("\n📩 Received Message Type:", Object.keys(msg));

    if (msg.setupComplete) {
      console.log("🎉 setupComplete received! Now sending greeting clientContent...");
      const greetingPrompt = {
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [
                {
                  text: "Namaste! Apna parichay dijiye aur poochiye ki aaj mandi rates ya loan schemes mein kya madad chahiye.",
                },
              ],
            },
          ],
          turnComplete: true,
        },
      };
      ws.send(JSON.stringify(greetingPrompt));
    }

    if (msg.serverContent) {
      const parts = msg.serverContent.modelTurn?.parts || [];
      for (const p of parts) {
        if (p.text) console.log("🗣️ Text Part:", p.text);
        if (p.inlineData) console.log("🔊 Audio Part (bytes):", p.inlineData.data?.length);
      }
      if (msg.serverContent.turnComplete) {
        console.log("🏁 Turn Complete!");
        ws.close();
        process.exit(0);
      }
    }
  });

  ws.addEventListener("error", (err) => {
    console.error("❌ Error:", err);
  });

  ws.addEventListener("close", (event) => {
    console.log("Closed:", event.code, event.reason);
  });
}

testFullBidiFlow().catch(console.error);
