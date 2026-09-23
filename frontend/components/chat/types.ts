export interface ToolCallItem {
  toolName: string;
  toolCallId?: string;
  icon?: string;
  summary?: string;
  status?: "calling" | "completed" | "error";
  args?: Record<string, any>;
  result?: any;
}


export interface ChatAttachment {
  id: string;
  uploadedName: string;
  savedName: string;
  url: string;
  type: "image" | "file";
  mimeType: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinking?: string;
  toolCalls?: ToolCallItem[];
  files?: string[];
  attachments?: ChatAttachment[];
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
