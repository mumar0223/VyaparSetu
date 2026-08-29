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
