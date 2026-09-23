import dotenv from "dotenv";
dotenv.config();

import { GoogleAuth } from "google-auth-library";
import { createVertex } from "@ai-sdk/google-vertex";
import { streamText, tool, isStepCount } from "ai";
import { z } from "zod";

async function main() {
  console.log("================================================================================");
  console.log("   Vertex AI Gemini 3.7 Flash Audio-to-TTS Realtime Pipeline Benchmark");
  console.log("   (Testing Thinking Budget = 0 vs Realtime Speed)");
  console.log("================================================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const modelId = "gemini-3.7-flash";

  if (!project || !clientEmail || !privateKey) {
    throw new Error("Missing Google Vertex credentials in .env");
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse?.token;

  if (!accessToken) {
    throw new Error("Failed to get Google Cloud OAuth access token.");
  }

  // ── Helper: Synthesize Voice via Google Cloud Text-to-Speech ──
  async function synthesizeSpeech(text: string, voiceName = "hi-IN-Neural2-B") {
    const start = Date.now();
    const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "hi-IN",
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.05,
        },
      }),
    });

    const elapsed = Date.now() - start;
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText, elapsed, audioContent: null };
    }
    const data = await res.json();
    return {
      success: true,
      audioContent: data.audioContent as string, // base64
      elapsed,
    };
  }

  // ── Step 1: Create a Real Spoken User Query Audio Sample ──
  const testSpokenQuery = "गोरखपुर मंडी में आज गेहूं का क्या भाव है? मुझे ताज़ा रेट बताइए।";
  console.log(`🎙️ [Step 1] Generating authentic test audio of user speaking in Hindi:`);
  console.log(`   User Query: "${testSpokenQuery}"`);

  console.log(`   Synthesizing user audio via Google TTS (hi-IN)...`);
  const userAudio = await synthesizeSpeech(testSpokenQuery, "hi-IN-Standard-A");
  if (!userAudio.success || !userAudio.audioContent) {
    console.warn(`   ⚠️ Could not generate audio via TTS: ${userAudio.error}`);
    throw new Error("Failed to synthesize test user audio");
  }

  console.log(`   ✅ Real audio clip generated in ${userAudio.elapsed}ms (Base64 size: ${userAudio.audioContent.length} chars)\n`);

  const audioBuffer = Buffer.from(userAudio.audioContent, "base64");

  // ── Step 2: Initialize Vertex AI with Gemini 3.7 Flash ──
  console.log(`🧠 [Step 2] Sending RAW AUDIO directly to Vertex AI [${modelId}]...`);
  console.log(`   Config: thinkingBudget = 0 (low-latency mode), Location: ${location}`);

  const vertex = createVertex({
    project,
    location,
    googleAuthOptions: {
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    },
  });

  const model = vertex(modelId as any);

  let toolExecutedTime = 0;
  let toolResultCaptured: any = null;

  const tools = {
    getMandiRates: tool({
      description: "Fetches live APMC market prices and arrival data for agricultural commodities in India.",
      parameters: z.object({
        commodity: z.string().describe("Commodity name in English e.g. Wheat, Mustard, Onion"),
        district: z.string().optional().describe("District or city name e.g. Gorakhpur, Nashik"),
        state: z.string().optional().describe("State name e.g. Uttar Pradesh, Maharashtra"),
      }),
      execute: async ({ commodity, district, state }) => {
        const tStart = Date.now();
        console.log(`\n⚡ [TOOL CALLED BY 3.7 FLASH] getMandiRates({ commodity: "${commodity}", district: "${district}", state: "${state}" })`);
        toolResultCaptured = {
          commodity: commodity || "Wheat",
          district: district || "Gorakhpur",
          modalPrice: "₹2,275 / quintal",
          minPrice: "₹2,150",
          maxPrice: "₹2,380",
          arrivals: "320 quintals",
          trend: "+2.5% steady",
        };
        toolExecutedTime = Date.now() - tStart;
        console.log(`   ⚡ Tool executed in ${toolExecutedTime}ms. Returning live mandi data to model...`);
        return toolResultCaptured;
      },
    }),
  };

  const pipelineStart = Date.now();
  let timeToFirstToken: number | null = null;
  let firstSentenceTime: number | null = null;
  let fullText = "";
  let firstSentence = "";
  let ttsDuration = 0;

  console.log(`⏱️ Beginning streaming request with raw audio...`);

  const streamResult = streamText({
    model,
    system: `You are VyaparSetu Voice Advisor (व्यापारसेतु). 
You are listening to raw user audio.
1. When user asks for Mandi commodity prices, you MUST call getMandiRates tool with English parameters.
2. After tool execution, respond concisely in natural Hindi/Hinglish (1 to 2 spoken sentences). Confirm the modal price clearly.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: audioBuffer,
            mediaType: "audio/mp3",
          },
          {
            type: "text",
            text: "User has spoken this audio. Please listen and assist.",
          },
        ],
      },
    ],
    tools,
    stopWhen: isStepCount(5),
    providerOptions: {
      vertex: {
        thinkingConfig: {
          thinkingBudget: 0, // Disable extended reasoning for fast voice response
        },
      },
    },
  });

  for await (const chunk of streamResult.textStream) {
    if (timeToFirstToken === null) {
      timeToFirstToken = Date.now() - pipelineStart;
      console.log(`\n🚀 [TTFT] First Text Token arrived in: ${timeToFirstToken}ms`);
      process.stdout.write(`🗣️ Model Output: `);
    }

    process.stdout.write(chunk);
    fullText += chunk;

    // Detect first sentence boundary (. or ? or \n or ।)
    if (!firstSentence && /[।\.!\?\n]/.test(fullText) && fullText.trim().length > 10) {
      firstSentence = fullText.trim();
      firstSentenceTime = Date.now() - pipelineStart;
      console.log(`\n\n📢 [Sentence 1 Ready at ${firstSentenceTime}ms]: "${firstSentence}"`);

      // Dispatch to TTS immediately in parallel
      console.log(`🔊 [Step 3] Pipelining Sentence 1 to Google Neural2 TTS in real-time...`);
      const ttsStart = Date.now();
      synthesizeSpeech(firstSentence, "hi-IN-Neural2-B")
        .then((ttsRes) => {
          ttsDuration = Date.now() - ttsStart;
          if (ttsRes.success) {
            const timeToFirstAudioByte = (firstSentenceTime || 0) + ttsDuration;
            console.log(`\n✨ [TTS COMPLETE] Generated Neural2 audio chunk in ${ttsDuration}ms!`);
            console.log(`🎧 [TOTAL TIME TO FIRST AUDIO HEARD]: ${timeToFirstAudioByte}ms`);
          } else {
            console.warn(`\n⚠️ TTS synthesis error:`, ttsRes.error);
          }
        })
        .catch(console.error);
    }
  }

  const totalModelDuration = Date.now() - pipelineStart;

  // Allow TTS promise to finish
  await new Promise((r) => setTimeout(r, 1200));

  console.log("\n\n================================================================================");
  console.log("   BENCHMARK RESULTS BREAKDOWN (Gemini 3.7 Flash + Streaming TTS)");
  console.log("================================================================================");
  console.log(`1. Model Used:                  Gemini 3.7 Flash on Google Cloud Vertex AI`);
  console.log(`2. Input Modality:               Raw Audio (MP3 Buffer passed directly, NO external STT)`);
  console.log(`3. Tool Triggered:               ${toolResultCaptured ? "✅ YES (getMandiRates called)" : "❌ NO"}`);
  console.log(`4. Thinking Budget:              0 (Fast Voice Mode)`);
  console.log(`5. Time To First Token (TTFT):   ${timeToFirstToken}ms`);
  console.log(`6. First Sentence Complete:      ${firstSentenceTime}ms`);
  console.log(`7. Google Neural2 TTS Latency:   ${ttsDuration}ms`);
  console.log(`8. TOTAL PIPELINE LATENCY:       ${(firstSentenceTime || 0) + ttsDuration}ms (Time until user hears first voice)`);
  console.log(`9. Full Text Response Length:    ${fullText.length} characters`);
  console.log(`10. Full Model Execution Time:   ${totalModelDuration}ms`);
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("❌ Benchmark Failed:", err);
  process.exit(1);
});
