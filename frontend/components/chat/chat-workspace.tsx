"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PanelRightOpen,
  PanelRightClose,
  Plus,
  Sparkles,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Coins,
} from "lucide-react";
import { FloatingInput } from "./floating-input";
import { HistorySidebar } from "./history-sidebar";
import { ChatMessageList } from "./chat-message-list";
import type { ChatMessage, ConversationSummary, ToolCallItem } from "./types";
import type { AuthUser } from "@/lib/auth-types";
import { cn } from "@/lib/utils";

interface ChatWorkspaceProps {
  currentUser?: AuthUser | null;
  initialChatId?: string;
}

export function ChatWorkspace({
  currentUser,
  initialChatId,
}: ChatWorkspaceProps) {
  const router = useRouter();

  const [activeChatId, setActiveChatId] = useState<string | null>(
    initialChatId || null,
  );
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(
    Boolean(initialChatId),
  );

  const chatCache = useRef<Map<string, ChatMessage[]>>(new Map());

  // 1. Fetch Conversations History
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Load Active Conversation Messages if initialChatId provided
  useEffect(() => {
    if (!initialChatId) {
      setMessages([]);
      setActiveChatId(null);
      setIsInitialLoading(false);
      return;
    }

    if (chatCache.current.has(initialChatId)) {
      setActiveChatId(initialChatId);
      setMessages(chatCache.current.get(initialChatId)!);
      setIsInitialLoading(false);
      return;
    }

    let isMounted = true;
    const loadConversation = async () => {
      setMessages([]);
      setIsInitialLoading(true);
      try {
        const res = await fetch(`/api/chats/${initialChatId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.conversation) {
            setActiveChatId(data.conversation.id);
            const loaded = (data.conversation.messages || []).map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              thinking: m.thinking,
              toolCalls: m.toolCalls,
              createdAt: m.createdAt,
            }));
            chatCache.current.set(data.conversation.id, loaded);
            setMessages(loaded);
          }
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };

    loadConversation();
    return () => {
      isMounted = false;
    };
  }, [initialChatId]);

  // 3. Start New Chat
  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    window.history.pushState(null, "", "/dashboard");
  };

  // 4. Select existing chat from history (Instant Cache / Clear Old Messages Immediately)
  const handleSelectChat = async (id: string) => {
    if (id === activeChatId) return;
    setActiveChatId(id);
    window.history.pushState(null, "", `/dashboard/c/${id}`);

    // If cached in RAM: Instant 0ms load!
    if (chatCache.current.has(id)) {
      setMessages(chatCache.current.get(id)!);
      return;
    }

    // If not in cache: immediately clear old messages so they disappear
    setMessages([]);
    setIsInitialLoading(true);
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          const loaded = (data.conversation.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            thinking: m.thinking,
            toolCalls: m.toolCalls,
            createdAt: m.createdAt,
          }));
          chatCache.current.set(id, loaded);
          setMessages(loaded);
        }
      }
    } catch (err) {
      console.error("Failed to select chat:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 5. Delete Chat
  const handleDeleteChat = async (id: string) => {
    try {
      chatCache.current.delete(id);
      const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeChatId === id) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  // 6. Rename Chat
  const handleRenameChat = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
        );
      }
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  };

  // 7. Toggle Pin
  const handleTogglePin = async (id: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, pinned } : c)),
        );
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  // 8. Real-time Message Send with Silent URL Update
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `asst_${Date.now()}`;

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: text.trim(),
      createdAt: new Date(),
    };

    const newAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      thinking: "Synthesizing market context & evaluating trade queries...",
      toolCalls: [],
      createdAt: new Date(),
      isStreaming: true,
    };

    // Optimistic UI state update
    const previousMessages = [...messages];
    setMessages((prev) => [...prev, newUserMessage, newAssistantMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationId: activeChatId,
          history: previousMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming connection failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const eventMatch = line.match(/^event:\s*(.+)$/m);
          const dataMatch = line.match(/^data:\s*(.+)$/m);

          if (!dataMatch) continue;
          const eventType = eventMatch ? eventMatch[1].trim() : "message";
          let data: any = {};
          try {
            data = JSON.parse(dataMatch[1].trim());
          } catch {
            continue;
          }

          if (eventType === "conversation_init") {
            const { conversationId, title, isNew } = data;
            if (isNew || !activeChatId) {
              setActiveChatId(conversationId);
              // Silent URL change without page reload/loading flash!
              window.history.replaceState(
                null,
                "",
                `/dashboard/c/${conversationId}`,
              );
              // Add to conversations history list
              setConversations((prev) => [
                {
                  id: conversationId,
                  title,
                  pinned: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                ...prev.filter((c) => c.id !== conversationId),
              ]);

              // Parallel AI title generation (non-blocking background call)
              fetch(`/api/chats/${conversationId}/title`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
              })
                .then((res) => res.json())
                .then((titleData) => {
                  if (titleData?.title) {
                    setConversations((prev) =>
                      prev.map((c) =>
                        c.id === conversationId
                          ? { ...c, title: titleData.title }
                          : c,
                      ),
                    );
                  }
                })
                .catch((err) =>
                  console.warn("Background title generation error:", err),
                );
            }
          } else if (eventType === "thinking") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId ? { ...m, thinking: data.step } : m,
              ),
            );
          } else if (eventType === "tool_call") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMessageId) return m;
                const existingTools = m.toolCalls || [];
                return {
                  ...m,
                  toolCalls: [
                    ...existingTools,
                    {
                      toolName: data.toolName,
                      icon: data.icon,
                      args: data.args,
                      summary: data.summary,
                      status: data.status || "calling",
                    },
                  ],
                };
              }),
            );
          } else if (eventType === "tool_result") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMessageId) return m;
                const tools = (m.toolCalls || []).map((t) =>
                  t.toolName === data.toolName
                    ? {
                        ...t,
                        icon: data.icon || t.icon,
                        result: data.result,
                        summary: data.summary || t.summary,
                        status: data.status || "completed",
                      }
                    : t,
                );
                return { ...m, toolCalls: tools };
              }),
            );
          } else if (eventType === "chunk") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + data.text }
                  : m,
              ),
            );
          } else if (eventType === "done") {
            const elapsed = Math.max(
              1,
              Math.round(
                (Date.now() - (newUserMessage.createdAt as any).getTime()) /
                  1000,
              ),
            );
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      isStreaming: false,
                      thoughtDurationSeconds: elapsed,
                    }
                  : m,
              ),
            );
          }
        }
      }
    } catch (err) {
      console.error("Stream execution error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content:
                  m.content ||
                  "I encountered a temporary connection issue. Please try again.",
                isStreaming: false,
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
      fetchConversations();
      setMessages((current) => {
        if (activeChatId) {
          chatCache.current.set(activeChatId, current);
        }
        return current;
      });
    }
  };

  const hasMessages = messages.length > 0;
  const activeConversation = conversations.find((c) => c.id === activeChatId);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#131314] text-foreground">
      {/* ── Floating Controls (Visible ONLY when Sidebar is Closed) ── */}
      {!isSidebarOpen && (
        <div className="absolute top-3.5 right-8 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleNewChat}
            title="New chat"
            className="size-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer bg-zinc-900/80 backdrop-blur border border-zinc-800"
          >
            <Plus className="size-4" />
          </button>

          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Show chat history"
            className="size-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer bg-zinc-900/80 backdrop-blur border border-zinc-800"
          >
            <PanelRightOpen className="size-4" />
          </button>
        </div>
      )}

      {/* ── Main Chat Area (Edge-to-Edge Full Width) ── */}
      <div className="relative flex flex-1 flex-col h-full overflow-hidden min-w-0">
        {/* ── View State: Empty / New Chat (Centered) vs Active Chat ── */}
        {!hasMessages ? (
          /* NEW CHAT (Centered Hero View) */
          <div className="w-full h-full overflow-y-auto flex flex-col justify-center items-center px-4 py-8 -mt-6">
            <div className="w-full max-w-3xl text-center mb-8 animate-in fade-in-50 duration-300">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-100 mb-2">
                What&apos;s on the agenda today?
              </h1>
              <p className="text-sm text-zinc-400">
                Hyper-local mandi intelligence, financial structuring, and
                government credit scheme advisor
              </p>
            </div>

            {/* Vertically Centered Input Bar */}
            <div className="w-full max-w-3xl">
              <FloatingInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                isCentered={true}
              />
            </div>

            {/* Suggested Quick Prompt Chips */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-3xl px-4 md:px-6">
              {[
                {
                  label: "Live APMC Mandi Rates",
                  desc: "Current onion, wheat & commodity price arrivals",
                  icon: TrendingUp,
                  prompt:
                    "Show me the latest regional mandi rates and APMC trends for Onion and Wheat.",
                },
                {
                  label: "PM Mudra & SVANidhi Loan",
                  desc: "Check zero-collateral credit eligibility",
                  icon: Landmark,
                  prompt:
                    "Evaluate my eligibility for PM Mudra Kishore and PM SVANidhi loans.",
                },
                {
                  label: "Working Capital Optimization",
                  desc: "Analyze 14-day cash flow & stock buffer",
                  icon: Coins,
                  prompt:
                    "Give me advice on optimizing my micro-enterprise working capital and inventory buffer.",
                },
                {
                  label: "GST & Trade Compliance",
                  desc: "Udyam Aadhar & balance sheet checklist",
                  icon: FileSpreadsheet,
                  prompt:
                    "What is the compliance checklist for Udyam Aadhar and micro-enterprise ledger audit?",
                },
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="p-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all text-left group flex items-start gap-3 cursor-pointer"
                >
                  <div className="size-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-white shrink-0">
                    <chip.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                      {chip.label}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {chip.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT THREAD (Full Width Viewport, Edge-to-Edge Scrollbar, Centered Content) */
          <div className="relative flex-1 flex flex-col h-full overflow-hidden w-full">
            {/* Scrollable Message List (Full width scrollbar with pb-44 bottom padding) */}
            <ChatMessageList messages={messages} isLoading={isLoading} />

            {/* Floating Sticky Input Bar at Bottom with Frosted Gradient Backdrop */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#131314] via-[#131314]/90 to-transparent pointer-events-none z-20">
              <div className="pointer-events-auto">
                <FloatingInput
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  isCentered={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right-Side History Sidebar (Width = 240px / w-60) ── */}
      <HistorySidebar
        conversations={conversations}
        activeChatId={activeChatId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
      />
    </div>
  );
}
