import dotenv from "dotenv";
dotenv.config();

import { createVertex } from "@ai-sdk/google-vertex";
import { generateText } from "ai";

async function probeModels() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

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

  const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.5-pro-002",
    "gemini-2.0-flash-001",
    "gemini-2.0-flash-exp",
    "gemini-2.5-flash",
    "gemini-2.5-pro"
  ];

  console.log(`Probing models in project "${project}" at location "${location}"...\n`);

  for (const modelId of candidates) {
    try {
      process.stdout.write(`Testing [${modelId}]... `);
      const res = await generateText({
        model: vertex(modelId),
        prompt: "Say Hello in 1 word",
      });
      console.log(`✅ SUCCESS! Response: "${res.text.trim()}"`);
    } catch (err: any) {
      console.log(`❌ FAILED (${err.statusCode || err.message?.substring(0, 40)})`);
    }
  }
}

probeModels().catch(console.error);
