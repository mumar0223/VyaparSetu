import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText } from "ai";

/**
 * VyaparSetu - Google Cloud Vertex AI Test Script
 * Tests connectivity with Gemini 2.5 Flash on Vertex AI using GCP Service Account credentials.
 */
async function main() {
  console.log("==========================================================");
  console.log("   VyaparSetu: Testing Google Cloud Vertex AI (Gemini)");
  console.log("==========================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const modelId = process.env.GOOGLE_VERTEX_MODEL || "gemini-3.7-flash";

  console.log(`[GCP Config] Project: ${project}`);
  console.log(`[GCP Config] Location: ${location}`);
  console.log(`[GCP Config] Service Account: ${clientEmail}`);
  console.log(`[GCP Config] Model ID: ${modelId}\n`);

  if (!project || !clientEmail || !privateKey) {
    throw new Error("Missing required Vertex AI environment variables in .env");
  }

  // 1. Initialize Vertex Provider with Service Account Credentials
  console.log("🔄 Initializing Google Cloud Vertex AI provider...");
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

  // 2. Test Text Generation
  console.log(`⚡ Sending request to Vertex AI model [${modelId}]...`);
  const prompt = `Aap VyaparSetu ke hyper-local rural business advisor hain. Ek line me Hindi/Hinglish me bataiye ki aap rural micro-entrepreneurs ki kya madad karte hain.`;

  const startTime = Date.now();
  const response = await generateText({
    model,
    prompt,
  });
  const latency = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n==========================================================`);
  console.log(`  ✅ SUCCESS! Response received in ${latency}s`);
  console.log(`==========================================================\n`);
  console.log(`[Model Output]:\n${response.text}\n`);
  console.log("==========================================================");
}

main().catch((err) => {
  console.error("\n❌ Vertex AI Test Execution Failed:", err);
  process.exit(1);
});
