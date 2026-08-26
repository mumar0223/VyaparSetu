// ─── Agent State & Lifecycle Types ──────────────────────────────

export type AgentStatus =
  | "IDLE"
  | "RUNNING"
  | "WAITING_INPUT"
  | "COMPLETED"
  | "ERROR"
  | "ABORTED";

export interface AgentState {
  status: AgentStatus;
  iterations: number;
  notes: string[];
  error?: string;
  context?: Record<string, any>;
}

export interface ToolContext {
  userId?: string;
  workspaceId?: string;
  sessionId?: string;
  [key: string]: any;
}

export type SendEvent = (type: string, payload: any) => void;

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  toolCalls?: any[];
  toolResults?: any[];
  [key: string]: any;
}

export interface ExecutorConfig {
  ctx?: ToolContext;
  sessionId?: string;
  systemInstruction?: string;
  messages: AgentMessage[];
  sendEvent?: SendEvent;
  isAborted?: () => boolean;
  abortSignal?: AbortSignal;
  maxIterations?: number;
  provider?: string;
  model?: string;
  temperature?: number;
}

export interface ExecutionResult {
  finalState: AgentState;
  messages: AgentMessage[];
  text: string;
  waitingForInput: boolean;
  error?: string;
}
