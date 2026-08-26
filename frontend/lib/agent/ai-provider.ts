import { generateText, streamText, LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// Dynamic language model instantiation using Vercel AI SDK
export function getLanguageModel(
  provider: string = "openai",
  model?: string,
): LanguageModel {
  switch (provider.toLowerCase()) {
    case "gemini":
    case "google": {
      const apiKey = process.env.GEMINI_API_KEY || "";
      const selectedModel =
        model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
      console.log(`[AI-PROVIDER] Instantiating Gemini model: ${selectedModel}`);

      const geminiClient = createOpenAI({
        apiKey,
        baseURL:
          process.env.GEMINI_BASE_URL ||
          "https://generativelanguage.googleapis.com/v1beta/openai/",
      });

      return geminiClient.chat(selectedModel);
    }

    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY || "";
      const baseURL = process.env.OPENAI_BASE_URL || undefined;
      const selectedModel = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
      console.log(`[AI-PROVIDER] Instantiating OpenAI model: ${selectedModel}`);

      const openaiClient = createOpenAI({
        apiKey,
        baseURL,
        fetch: async (url, init) => {
          if (init && init.body) {
            try {
              const body = JSON.parse(init.body as string);
              if (Array.isArray(body.tools)) {
                body.tools = body.tools.map((t: any) => {
                  const type = t.type || "function";
                  const name = t.name || t.function?.name;
                  const description = t.description || t.function?.description;
                  const parameters =
                    t.parameters || t.function?.parameters || {};

                  if (parameters) {
                    delete parameters.$schema;
                    delete parameters.additionalProperties;
                  }

                  return {
                    type,
                    function: {
                      name,
                      description,
                      parameters,
                    },
                  };
                });
                init.body = JSON.stringify(body);
              }
            } catch (e) {
              console.error("[OpenAI FETCH INTERCEPTOR ERROR]:", e);
            }
          }
          return fetch(url, init);
        },
      });

      return openaiClient.chat(selectedModel);
    }

    default:
      throw new Error(`Unsupported AI provider: "${provider}"`);
  }
}

// Unified dispatch function for executing models using Vercel AI SDK
export async function runAIModel(
  provider: string = "openai",
  model: string = process.env.OPENAI_MODEL || "gpt-4o-mini",
  systemInstruction: string = "",
  prompt: string = "",
): Promise<string> {
  const selectedModel =
    model ||
    (provider === "openai"
      ? process.env.OPENAI_MODEL || "gpt-4o-mini"
      : process.env.GEMINI_MODEL || "gemini-2.0-flash");
  console.log(
    `[AI-PROVIDER] Vercel AI SDK Dispatching to: ${provider} (model: ${selectedModel})`,
  );

  const modelInstance = getLanguageModel(provider, selectedModel);

  const { text } = await generateText({
    model: modelInstance,
    system: systemInstruction,
    prompt,
  });

  return text;
}
