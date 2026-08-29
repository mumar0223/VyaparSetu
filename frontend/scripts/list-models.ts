import dotenv from "dotenv";
dotenv.config();

/**
 * List all models from Google's API and inspect which ones support bidiGenerateContent / live
 */
async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Fetching list of all models from Google Generative Language API...\n");

  for (const apiVer of ["v1beta", "v1alpha"]) {
    console.log(`\n=================== API Version: ${apiVer} ===================`);
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/${apiVer}/models?key=${apiKey}`);
      const data = await resp.json();

      if (data.models && Array.isArray(data.models)) {
        console.log(`Total models found: ${data.models.length}\n`);

        const bidiModels = data.models.filter((m: any) =>
          m.supportedGenerationMethods?.some((method: string) =>
            method.toLowerCase().includes("bidi") || method.toLowerCase().includes("live") || method.toLowerCase().includes("stream")
          )
        );

        console.log("--- Models supporting Streaming / Bidi ---");
        for (const m of data.models) {
          const methods = m.supportedGenerationMethods || [];
          console.log(`• Name: ${m.name}`);
          console.log(`  Display: ${m.displayName}`);
          console.log(`  Methods: ${methods.join(", ")}\n`);
        }
      } else {
        console.log("No models returned or error:", data);
      }
    } catch (e: any) {
      console.error(`Error querying ${apiVer}:`, e.message);
    }
  }
}

listAllModels().catch(console.error);
