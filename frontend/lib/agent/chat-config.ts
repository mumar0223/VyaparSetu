/**
 * Dedicated isolated configuration for the Dashboard Chat Advisor.
 * Other agents or tools in the workspace can define their own isolated configs.
 */
export const DASHBOARD_CHAT_CONFIG = {
  provider: "openai",
  model: process.env.OPENAI_MODEL || "moonshotai.kimi-k2.5",
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * Dedicated AI configuration for Title Generation.
 * Reads the title model name from env (TITLE_AI_MODEL).
 */
export const TITLE_GENERATION_CONFIG = {
  provider: "openai",
  model: process.env.TITLE_AI_MODEL || "moonshotai.kimi-k2.5",
  temperature: 0.3,
  maxTokens: 30,
};

/**
 * Dedicated centralized configuration for the Multimodal Live Voice Agent OS.
 * Uses official Live models with dedicated "google-live" provider.
 */
export const LIVE_VOICE_AGENT_CONFIG = {
  provider: "google-live",
  model: process.env.LIVE_VOICE_MODEL || "models/gemini-2.5-flash-native-audio-latest",
  liveModels: [
    "models/gemini-3.1-flash-live-preview",
    "models/gemini-2.5-flash-native-audio-latest",
  ] as const,
  voiceName: process.env.LIVE_VOICE_NAME || "Puck",
  responseModalities: ["AUDIO"],
};
