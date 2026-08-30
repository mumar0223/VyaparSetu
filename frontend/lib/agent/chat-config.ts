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
  // The voice experience is intentionally isolated from the dashboard chat
  // provider. It always runs through Vertex AI's Live API.
  provider: "vertex",
  model: process.env.LIVE_VOICE_MODEL || "gemini-live-2.5-flash",
  liveModels: [
    "gemini-live-2.5-flash",
    "gemini-live-2.5-flash-native-audio",
  ] as const,
  voiceName: process.env.LIVE_VOICE_NAME || "Puck",
  // Vertex Live emits the text needed for captions through its dedicated
  // transcription events; this model supports one response modality per turn.
  responseModalities: ["AUDIO"],
};

export const SUPPORTED_INDIAN_LANGUAGES = [
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
  { code: "en-IN", name: "English", nativeName: "English" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_INDIAN_LANGUAGES)[number]["code"];
