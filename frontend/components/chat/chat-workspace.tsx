"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
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
  ArrowDown,
} from "lucide-react";
import { FloatingInput } from "./floating-input";
import { HistorySidebar } from "./history-sidebar";
import { ChatMessageList } from "./chat-message-list";
import { VoiceAgentView, type VoiceAgentStatus } from "./voice-agent-view";
import { useLiveAgent } from "./use-live-agent";
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
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const savedScrollPositionRef = useRef<number>(0);

  // ── 1. Fetch Conversations History ──
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

  // ── Voice Agent Mode State & Live Agent Orchestrator ──
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isEndingVoiceSession, setIsEndingVoiceSession] = useState(false);
  const [isStartingVoiceSession, setIsStartingVoiceSession] = useState(false);
  const voiceStartInFlightRef = useRef(false);

  const liveAgent = useLiveAgent({
    activeChatId,
    onTurnComplete: (turn) => {
      setMessages((prev) => {
        const next: ChatMessage[] = [...prev, {
          id: `user_${Date.now()}`,
          role: "user",
          content: turn.userTranscript,
          createdAt: new Date(),
        }];
        if (turn.assistantTranscript.trim()) {
          next.push({
            id: `asst_${Date.now()}`,
            role: "assistant",
            content: turn.assistantTranscript,
            toolCalls: turn.toolCalls,
            createdAt: new Date(),
          });
        }
        return next;
      });
      fetchConversations();
    },
  });

  const chatCache = useRef<Map<string, ChatMessage[]>>(new Map());

  // Auto-scroll to bottom on message update / stream if user hasn't scrolled up
  useEffect(() => {
    if (!showScrollBottom && !isVoiceMode) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, isLoading, showScrollBottom, isVoiceMode]);

  // Synchronous pre-paint scroll restoration: Locks directly to bottom with ZERO jumping
  useLayoutEffect(() => {
    if (!isVoiceMode && scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop =
        scrollViewportRef.current.scrollHeight;
    }
  }, [isVoiceMode, activeChatId]);

  const handleScroll = () => {
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBottom(false);
  };

  // ── 5. Delete Chat ──
  const handleDeleteChat = useCallback(
    async (id: string) => {
      try {
        chatCache.current.delete(id);
        const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
        if (res.ok) {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeChatId === id) {
            setActiveChatId(null);
            setMessages([]);
            window.history.pushState(null, "", "/dashboard");
          }
        }
      } catch (err) {
        console.error("Failed to delete chat:", err);
      }
    },
    [activeChatId],
  );

  // ── Start Live Voice Session ──
  const handleStartVoiceSession = useCallback(async () => {
    if (isVoiceMode || voiceStartInFlightRef.current) return;
    voiceStartInFlightRef.current = true;
    setIsStartingVoiceSession(true);
    if (scrollViewportRef.current) {
      savedScrollPositionRef.current = scrollViewportRef.current.scrollTop;
    }
    setIsVoiceMode(true);
    // This screen is intentionally shown before any model/WebSocket work. It
    // represents only creation or resolution of the durable chat session.
    liveAgent.setStatus("initializing");

    try {
      let targetId = activeChatId;
      if (!targetId) {
        const res = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Live Voice Session" }),
        });
        if (!res.ok) throw new Error("Could not create a chat for this voice session.");
        const data = await res.json();
        targetId = data?.conversation?.id;
        if (!targetId) throw new Error("Voice session chat creation returned no chat ID.");
        setActiveChatId(targetId);
        fetchConversations();
      }

      // The URL update is also complete before any Vertex connection begins.
      window.history.pushState(null, "", `/dashboard/c/${targetId}?mode=voice`);
      await liveAgent.connect(targetId);
    } catch (error) {
      console.error("Failed to initialize voice session:", error);
      liveAgent.reportError(error instanceof Error ? error.message : "Unable to start the voice session.");
    } finally {
      voiceStartInFlightRef.current = false;
      setIsStartingVoiceSession(false);
    }
  }, [activeChatId, liveAgent, fetchConversations, isVoiceMode]);

  // ── End Live Voice Session (Auto-Delete Empty Voice Sessions) ──
  const handleEndVoiceSession = useCallback(async () => {
    setIsEndingVoiceSession(true);
    liveAgent.disconnect();

    const currentChatId = activeChatId;
    if (currentChatId && messages.length === 0) {
      try {
        chatCache.current.delete(currentChatId);
        await fetch(`/api/chats/${currentChatId}`, { method: "DELETE" });
        setConversations((prev) => prev.filter((c) => c.id !== currentChatId));
        setActiveChatId(null);
        setMessages([]);
      } catch (err) {
        console.error("Failed to delete empty chat on exit:", err);
      }
      window.history.replaceState(null, "", "/dashboard");
    } else if (currentChatId) {
      window.history.replaceState(null, "", `/dashboard/c/${currentChatId}`);
    } else {
      window.history.replaceState(null, "", "/dashboard");
    }

    setIsVoiceMode(false);
    setIsEndingVoiceSession(false);
    fetchConversations();
  }, [activeChatId, messages.length, liveAgent, fetchConversations]);

  // Check URL search parameter for initial mode=voice (strictly once on mount)
  const hasCheckedUrlVoiceMode = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !hasCheckedUrlVoiceMode.current) {
      hasCheckedUrlVoiceMode.current = true;
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "voice") {
        handleStartVoiceSession();
      }
    }
  }, []);

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
  const handleNewChat = useCallback(() => {
    if (isVoiceMode) {
      liveAgent.disconnect();
      if (activeChatId && messages.length === 0) {
        handleDeleteChat(activeChatId);
      }
      setIsVoiceMode(false);
    }
    setActiveChatId(null);
    setMessages([]);
    window.history.pushState(null, "", "/dashboard");
  }, [isVoiceMode, liveAgent, activeChatId, messages.length, handleDeleteChat]);

  // 4. Select existing chat from history (Instant Cache / Clear Old Messages Immediately)
  const handleSelectChat = useCallback(
    async (id: string) => {
      if (id === activeChatId && !isVoiceMode) return;

      if (isVoiceMode) {
        liveAgent.disconnect();
        if (activeChatId && messages.length === 0) {
          handleDeleteChat(activeChatId);
        }
        setIsVoiceMode(false);
      }

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
            chatCache.current.set(data.conversation.id, loaded);
            setMessages(loaded);
          }
        }
      } catch (err) {
        console.error("Failed to select chat:", err);
      } finally {
        setIsInitialLoading(false);
      }
    },
    [activeChatId, isVoiceMode, liveAgent, messages.length, handleDeleteChat],
  );

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

  const isNewChatView = !activeChatId && messages.length === 0;
  const activeConversation = conversations.find((c) => c.id === activeChatId);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-cream dark:bg-background text-foreground font-sans">
      {/* ── Floating Controls (Visible ONLY when Sidebar is Closed) ── */}
      {!isSidebarOpen && (
        <div className="absolute top-3.5 right-8 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleNewChat}
            title="New chat"
            className="size-9 rounded-xl flex items-center justify-center text-ink-muted hover:text-forest dark:hover:text-mint hover:bg-white dark:hover:bg-card transition-colors cursor-pointer bg-white/80 dark:bg-card/80 backdrop-blur border border-sage/30 dark:border-border shadow-xs"
          >
            <Plus className="size-4" />
          </button>

          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Show chat history"
            className="size-9 rounded-xl flex items-center justify-center text-ink-muted hover:text-forest dark:hover:text-mint hover:bg-white dark:hover:bg-card transition-colors cursor-pointer bg-white/80 dark:bg-card/80 backdrop-blur border border-sage/30 dark:border-border shadow-xs"
          >
            <PanelRightOpen className="size-4" />
          </button>
        </div>
      )}

      {/* ── Main Chat Area (Edge-to-Edge Full Width) ── */}
      <div className="relative flex flex-1 flex-col h-full overflow-hidden min-w-0">
        {isVoiceMode ? (
          /* ── LIVE VOICE AGENT MODE (In-Place Ambient Viewport) ── */
          <VoiceAgentView
            status={liveAgent.status}
            isMuted={liveAgent.isMuted}
            micVolume={liveAgent.micVolume}
            isUserSpeaking={liveAgent.isUserSpeaking}
            isHoldingToSpeak={liveAgent.isHoldingToSpeak}
            isEnding={isEndingVoiceSession}
            errorMessage={liveAgent.errorMessage}
            selectedLanguage={liveAgent.selectedLanguage}
            onSelectLanguage={liveAgent.setLanguage}
            onToggleMute={liveAgent.toggleMute}
            onStartSpeaking={liveAgent.startSpeaking}
            onStopSpeaking={liveAgent.stopSpeaking}
            onEndSession={handleEndVoiceSession}
            onRetry={liveAgent.connect}
            liveTranscript={liveAgent.liveUserTranscript}
            assistantTranscript={liveAgent.liveAssistantTranscript}
            activeToolName={liveAgent.activeToolName}
          />
        ) : isNewChatView ? (
          /* NEW CHAT (Centered Hero View - only for blank /dashboard page) */
          <div className="w-full h-full overflow-y-auto flex flex-col justify-center items-center px-4 py-8 -mt-6">
            <div className="w-full max-w-3xl text-center mb-8 animate-in fade-in-50 duration-300">
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-forest dark:text-foreground mb-2">
                What&apos;s on the agenda today?
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground">
                Hyper-local mandi intelligence, financial structuring, and
                government credit scheme advisor
              </p>
            </div>

            {/* Vertically Centered Input Bar */}
            <div className="w-full max-w-3xl px-4 md:px-6">
              <FloatingInput
                onSend={handleSendMessage}
                onStartVoiceMode={handleStartVoiceSession}
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
                  className="p-3.5 rounded-2xl border border-sage/30 dark:border-border bg-white dark:bg-card hover:border-mint transition-all shadow-xs hover:shadow-md text-left group flex items-start gap-3.5 cursor-pointer"
                >
                  <div className="size-9 rounded-xl bg-mint-pale dark:bg-mint/10 text-forest dark:text-mint flex items-center justify-center shrink-0 group-hover:bg-mint group-hover:text-black transition-colors">
                    <chip.icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-serif font-bold text-forest dark:text-foreground group-hover:text-mint transition-colors truncate">
                      {chip.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {chip.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT THREAD (Single Unified Scroll Viewport with Sticky Bottom Input) */
          <div
            ref={scrollViewportRef}
            onScroll={handleScroll}
            className="relative flex-1 flex flex-col h-full overflow-y-auto w-full"
          >
            {/* Top Sentinel for future-proof infinite scroll */}
            <div
              id="top-scroll-sentinel"
              className="h-1 w-full shrink-0 pointer-events-none"
            />

            {/* Scrollable Message List */}
            <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-6">
              <ChatMessageList messages={messages} isLoading={isLoading} />
              <div ref={bottomRef} className="h-6" />
            </div>

            {/* Sticky Bottom Input Bar (Sticks to bottom of scroll viewport with frosted backdrop) */}
            <div className="sticky bottom-0 w-full max-w-3xl mx-auto px-4 md:px-6 pb-4 pt-2 bg-gradient-to-t from-cream via-cream/90 to-transparent dark:from-background dark:via-background/90 pointer-events-none z-20">
              <div className="relative pointer-events-auto">
                {/* Dynamic Scroll to Bottom Button anchored directly above the input */}
                {showScrollBottom && (
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    title="Scroll to bottom"
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 size-8 rounded-full bg-white dark:bg-card hover:bg-cream dark:hover:bg-muted border border-sage/40 dark:border-border shadow-lg flex items-center justify-center text-forest dark:text-mint transition-all cursor-pointer backdrop-blur animate-in fade-in-0 zoom-in-90 duration-150 group"
                  >
                    <ArrowDown className="size-4 text-forest dark:text-mint group-hover:translate-y-0.5 transition-transform duration-150" />
                  </button>
                )}

                <FloatingInput
                  onSend={handleSendMessage}
                  onStartVoiceMode={handleStartVoiceSession}
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
        onStartVoiceSession={handleStartVoiceSession}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onTogglePin={handleTogglePin}
      />
    </div>
  );
}
