export interface ToolCallItem {
  toolName: string;
  icon?: string;
  summary?: string;
  status?: "calling" | "completed" | "error";
  args?: Record<string, any>;
  result?: any;
}


export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  toolCalls?: ToolCallItem[];
  createdAt?: string | Date;
  isStreaming?: boolean;
  thoughtDurationSeconds?: number;
}


export interface ConversationSummary {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}
