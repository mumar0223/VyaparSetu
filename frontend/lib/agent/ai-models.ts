export interface AgentDef {
  id: string;
  name: string;
  description: string;
}

export interface ModelDef {
  id: string;
  label: string;
  supportsImages: boolean;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
}

export const AI_MODELS: Record<string, ModelDef[]> = {
  gemini: [
    {
      id: process.env.GEMINI_MODEL || "gemini-3.1-flash-live-preview",
      label: "Gemini 3.1 Flash Live Preview",
      supportsImages: true,
      inputCostPerMillion: 0.075,
      outputCostPerMillion: 0.3,
    },
    {
      id: "gemini-2.0-flash",
      label: "Gemini 2.0 Flash",
      supportsImages: true,
      inputCostPerMillion: 0.1,
      outputCostPerMillion: 0.4,
    },
  ],
  openai: [
    {
      id: process.env.OPENAI_MODEL || "moonshotai.kimi-k2.5",
      label: "Kimi K2.5 (Bedrock Mantle)",
      supportsImages: true,
      inputCostPerMillion: 0.6,
      outputCostPerMillion: 3.0,
    },
    {
      id: "gpt-4o",
      label: "GPT-4o",
      supportsImages: true,
      inputCostPerMillion: 2.5,
      outputCostPerMillion: 10.0,
    },
    {
      id: "gpt-4o-mini",
      label: "GPT-4o Mini",
      supportsImages: true,
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.6,
    },
  ],
};

export const AGENT_DEFS: AgentDef[] = [
  {
    id: "business-advisor",
    name: "VyaparSetu Business Advisor",
    description:
      "AI Agent for hyper-local micro-enterprise financial structuring and growth advisory.",
  },
];
