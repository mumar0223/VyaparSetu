import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText } from "ai";

async function testVertexModel() {
  console.log("==========================================================");
  console.log("   Google Cloud Vertex AI Gemini Model Test");
  console.log("==========================================================\n");

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  // Test gemini-2.0-flash or gemini-1.5-flash
  const modelId = "gemini-2.0-flash";

  console.log(`[Config] Project: ${project}`);
  console.log(`[Config] Location: ${location}`);
  console.log(`[Config] Client Email: ${clientEmail}`);
  console.log(`[Config] Model: ${modelId}\n`);

  if (!project || !clientEmail || !privateKey) {
    throw new Error("Missing required Vertex AI environment variables in .env");
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

  console.log(`Sending prompt to Vertex AI (${modelId})...`);
  const startTime = Date.now();

  const response = await generateText({
    model,
    prompt: "Namaste! Please reply with a short 1-sentence confirmation in Hinglish that Gemini on Google Cloud Vertex AI is connected and active for VyaparSetu.",
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n--- Response received in ${duration}s ---`);
  console.log(response.text);
  console.log("-----------------------------------------\n");
  console.log("✅ Vertex AI Gemini test completed successfully!");
}

testVertexModel().catch((err) => {
  console.error("\n❌ Test Failed:", err);
  process.exit(1);
});
