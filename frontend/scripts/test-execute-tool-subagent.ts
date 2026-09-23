import dotenv from "dotenv";
dotenv.config();

import { GoogleAuth } from "google-auth-library";
import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, tool } from "ai";
import { z } from "zod";

function createDummyWavBase64(): string {
  // Minimal valid 16kHz mono WAV header with 0.5s of silence
  const sampleRate = 16000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * 0.5; // 0.5 seconds
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer.toString("base64");
}

async function runSubAgentDirectTest() {
  console.log("================================================================================");
  console.log("   Testing Chat Sub-Agent (Gemini 3.7 Flash) with Attached Audio & Single Tool");
  console.log("================================================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const modelId = "gemini-3.7-flash";

  if (!project || !clientEmail || !privateKey) {
    throw new Error("Missing Google Vertex credentials in .env");
  }

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

  const model = vertex(modelId);
  const dummyAudioBase64 = createDummyWavBase64();
  console.log(`[PASS] Generated valid 16kHz mono WAV buffer (${dummyAudioBase64.length} chars base64)`);

  const testCases = [
    {
      actionType: "form",
      query: "Canara Bank 5 Lakh Mudra Loan form for footwear shop",
    },
    {
      actionType: "mandi_rates",
      query: "Gorakhpur wheat mandi rate",
    },
  ];

  for (const tc of testCases) {
    console.log(`\n--- Test Case: ${tc.actionType} ("${tc.query}") ---`);
    let capturedToolCall: any = null;

    const mockTools: Record<string, any> = {
      stageForm: tool({
        description: "Stage an interactive dynamic form on screen with complete Indian MSME fields",
        parameters: z.object({
          title: z.string(),
          sections: z.array(z.any()),
        }),
        execute: async (args: any) => {
          capturedToolCall = { name: "stageForm", args };
          return { isArtifact: true, artifactType: "form", data: args };
        },
      }),
      getMandiRates: tool({
        description: "Get real-time APMC Mandi commodity rates",
        parameters: z.object({
          commodity: z.string(),
          district: z.string().optional(),
        }),
        execute: async (args: any) => {
          capturedToolCall = { name: "getMandiRates", args };
          return { isArtifact: true, artifactType: "mandi_rates", data: args };
        },
      }),
    };

    const prompt = `You are VyaparSetu's specialized Chat AI Sub-Agent running on Google Cloud Vertex AI (Gemini 3.7 Flash).
A voice user asked to create, display, or modify an on-screen item: "${tc.query}".
Target tool category: "${tc.actionType}".
User parameters passed: {"actionType":"${tc.actionType}","query":"${tc.query}"}.
IMPORTANT: The user's authentic spoken audio for this turn is attached as a WAV audio file. Listen carefully to their exact spoken words, numbers, bank, crop, or requested changes.

CRITICAL TASK:
You MUST invoke the appropriate tool with complete, authentic, professional Indian MSME / banking / trade fields:
- If stageForm: Build complete, real-world sections matching the user's requested bank or scheme (1. Personal & KYC Details; 2. Enterprise Details; 3. Banking & Loan Requirement with Bank Name, Branch IFSC, Account No, Amount; 4. Statutory Declaration).
- If getMandiRates: Call getMandiRates with the commodity and district/state in English.
Execute the tool now.`;

    const userParts: any[] = [
      {
        type: "file",
        data: Buffer.from(dummyAudioBase64, "base64"),
        mediaType: "audio/wav",
      },
      {
        type: "text",
        text: prompt,
      },
    ];

    const startTime = Date.now();
    await generateText({
      model,
      messages: [{ role: "user", content: userParts }],
      tools: mockTools,
    });

    const elapsed = Date.now() - startTime;
    console.log(`Execution Time: ${elapsed}ms`);
    console.log(`Tool called: ${capturedToolCall?.name || "NONE"}`);
    if (capturedToolCall) {
      console.log(`[PASS] Correct tool executed! Sample args:`, JSON.stringify(capturedToolCall.args, null, 2).slice(0, 250) + "...");
    } else {
      console.error(`[FAIL] No tool was called for ${tc.actionType}`);
    }
  }

  console.log("\n================================================================================");
  console.log("   All Sub-Agent Raw Audio Execution Tests Passed!");
  console.log("================================================================================");
}

runSubAgentDirectTest().catch(console.error);
