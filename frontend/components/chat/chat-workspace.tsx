"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  PanelRightOpen,
  PanelRightClose,
  Plus,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Coins,
  ArrowDown,
  Store,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { FloatingInput } from "./floating-input";
import { HistorySidebar } from "./history-sidebar";
import { ChatMessageList } from "./chat-message-list";
import { VoiceAgentView, type VoiceAgentStatus } from "./voice-agent-view";
import { useLiveAgent } from "./use-live-agent";
import { ArtifactModal, type ArtifactPayload } from "./artifact-modal";
import type { ChatMessage, ConversationSummary, ToolCallItem } from "./types";
import type { AuthUser } from "@/lib/auth-types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface ChatWorkspaceProps {
  currentUser?: AuthUser | null;
  initialChatId?: string;
}

export function ChatWorkspace({
  currentUser,
  initialChatId,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();

  const [activeChatId, setActiveChatId] = useState<string | null>(
    initialChatId || null,
  );
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  const [isInitialLoading, setIsInitialLoading] = useState(
    Boolean(initialChatId),
  );
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactPayload | null>(
    null,
  );
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
  const voiceTurnsRef = useRef<Array<{ user: string; assistant?: string }>>([]);

  const liveAgent = useLiveAgent({
    activeChatId,
    onTurnComplete: (turn) => {
      const userText = turn.userTranscript.trim();
      const asstText = turn.assistantTranscript.trim();
      if (userText) {
        voiceTurnsRef.current.push({
          user: userText,
          assistant: asstText,
        });
        const currentCount = voiceTurnsRef.current.length;
        const currentChatId = activeChatId;

        // On Turn 1 (instant title) or Turn 3 (refined multi-turn dialogue title)
        if (currentChatId && (currentCount === 1 || currentCount === 3)) {
          fetch(`/api/chats/${currentChatId}/title`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              turns: voiceTurnsRef.current.slice(0, 3),
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.title) {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === currentChatId ? { ...c, title: data.title } : c,
                  ),
                );
              }
            })
            .catch((err) => console.warn("Voice title generation error:", err));
        }
      }

      setMessages((prev) => {
        const next: ChatMessage[] = [
          ...prev,
          {
            id: `user_${Date.now()}`,
            role: "user",
            content: turn.userTranscript,
            createdAt: new Date(),
          },
        ];
        if (turn.assistantTranscript.trim()) {
          next.push({
            id: `asst_${Date.now()}`,
            role: "assistant",
            content: turn.assistantTranscript,
            thinking: turn.thinking,
            thoughtDurationSeconds: turn.thoughtDurationSeconds,
            toolCalls: turn.toolCalls,
            createdAt: new Date(),
          });
        }
        return next;
      });
      fetchConversations();
    },
  });

  // Sync liveAgent voice language with dropdown language (only when an explicit regional language is selected)
  useEffect(() => {
    const codeMap: Record<string, any> = {
      hi: "hi-IN",
      mr: "mr-IN",
      bn: "bn-IN",
      gu: "gu-IN",
      ta: "ta-IN",
      te: "te-IN",
      pa: "pa-IN",
      kn: "kn-IN",
      ml: "ml-IN",
    };
    // If user switches UI to a regional Indian language, sync it to voice agent.
    // Otherwise keep voice agent in auto-detecting Hindi/multilingual default without forcing English.
    if (language && codeMap[language]) {
      liveAgent.setLanguage(codeMap[language]);
    }
  }, [language, liveAgent]);

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
            router.push("/ai-saathi");
          }
        }
      } catch (err) {
        console.error("Failed to delete chat:", err);
      }
    },
    [activeChatId, router],
  );

  // ── Start Live Voice Session ──
  const handleStartVoiceSession = useCallback(async () => {
    if (isVoiceMode || voiceStartInFlightRef.current) return;
    voiceStartInFlightRef.current = true;
    voiceTurnsRef.current = [];
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
        if (!res.ok)
          throw new Error("Could not create a chat for this voice session.");
        const data = await res.json();
        targetId = data?.conversation?.id;
        if (!targetId)
          throw new Error("Voice session chat creation returned no chat ID.");
        setActiveChatId(targetId);
        fetchConversations();
      }

      // The URL update is also complete before any Vertex connection begins.
      window.history.pushState(null, "", `/ai-saathi/c/${targetId}?mode=voice`);
      await liveAgent.connect(targetId);
    } catch (error) {
      console.error("Failed to initialize voice session:", error);
      liveAgent.reportError(
        error instanceof Error
          ? error.message
          : "Unable to start the voice session.",
      );
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
      window.history.replaceState(null, "", "/ai-saathi");
    } else if (currentChatId) {
      // Trigger background title generation if title is still default
      if (voiceTurnsRef.current.length > 0) {
        const existingConv = conversations.find((c) => c.id === currentChatId);
        if (
          existingConv &&
          (existingConv.title === "Live Voice Session" ||
            existingConv.title === "New Conversation")
        ) {
          fetch(`/api/chats/${currentChatId}/title`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              turns: voiceTurnsRef.current.slice(0, 3),
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.title) {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === currentChatId ? { ...c, title: data.title } : c,
                  ),
                );
              }
            })
            .catch((err) =>
              console.warn("Voice session end title generation error:", err),
            );
        }
      }
      window.history.replaceState(null, "", `/ai-saathi/c/${currentChatId}`);
    } else {
      window.history.replaceState(null, "", "/ai-saathi");
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
      setActiveChatId(null);
      setMessages([]);
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
            const loaded = (data.conversation.messages || []).map((m: any) => {
              let duration: number | undefined = undefined;
              if (m.thinking) {
                try {
                  const parsed = JSON.parse(m.thinking);
                  if (typeof parsed?.durationSeconds === "number") {
                    duration = parsed.durationSeconds;
                  }
                } catch {
                  const num = Number(m.thinking);
                  if (!isNaN(num) && num > 0) duration = num;
                }
              }
              return {
                id: m.id,
                role: m.role,
                content: m.content,
                thinking: m.thinking,
                toolCalls: m.toolCalls,
                thoughtDurationSeconds: duration,
                createdAt: m.createdAt,
              };
            });
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

  // 3. Start New Chat (Instant 0ms in-memory state change, zero page reload)
  const handleNewChat = useCallback(() => {
    if (isVoiceMode) {
      liveAgent.disconnect();
      if (activeChatId && messages.length === 0) {
        handleDeleteChat(activeChatId);
      }
      setIsVoiceMode(false);
    }
    liveAgent.setLiveArtifact(null);
    setActiveChatId(null);
    setMessages([]);
    setIsInitialLoading(false);
    window.history.pushState(null, "", "/ai-saathi");
  }, [isVoiceMode, liveAgent, activeChatId, messages.length, handleDeleteChat]);

  // 4. Select existing chat from history (Instant 0ms in-memory load, zero page reload)
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
      liveAgent.setLiveArtifact(null);

      setActiveChatId(id);
      window.history.pushState(null, "", `/ai-saathi/c/${id}`);

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
            const loaded = (data.conversation.messages || []).map((m: any) => {
              let duration: number | undefined = undefined;
              if (m.thinking) {
                try {
                  const parsed = JSON.parse(m.thinking);
                  if (typeof parsed?.durationSeconds === "number") {
                    duration = parsed.durationSeconds;
                  }
                } catch {
                  const num = Number(m.thinking);
                  if (!isNaN(num) && num > 0) duration = num;
                }
              }
              return {
                id: m.id,
                role: m.role,
                content: m.content,
                thinking: m.thinking,
                toolCalls: m.toolCalls,
                thoughtDurationSeconds: duration,
                createdAt: m.createdAt,
              };
            });
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

  // ── Browser Back / Forward (popstate) Support ──
  useEffect(() => {
    const onPopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === "/ai-saathi" || currentPath === "/dashboard") {
        if (isVoiceMode) {
          liveAgent.disconnect();
          setIsVoiceMode(false);
        }
        setActiveChatId(null);
        setMessages([]);
        setIsInitialLoading(false);
      } else if (
        currentPath.startsWith("/ai-saathi/c/") ||
        currentPath.startsWith("/dashboard/c/")
      ) {
        const id = currentPath
          .replace(/^\/(?:ai-saathi|dashboard)\/c\//, "")
          .split("?")[0];
        if (id) {
          if (chatCache.current.has(id)) {
            setActiveChatId(id);
            setMessages(chatCache.current.get(id)!);
          } else {
            handleSelectChat(id);
          }
        }
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isVoiceMode, liveAgent, handleSelectChat]);

  // ── Listen for custom reset event (e.g. clicking AI Saathi in sidebar) ──
  useEffect(() => {
    const handleReset = () => {
      handleNewChat();
    };
    window.addEventListener("reset-ai-saathi", handleReset);
    window.addEventListener("reset-dashboard", handleReset);
    return () => {
      window.removeEventListener("reset-ai-saathi", handleReset);
      window.removeEventListener("reset-dashboard", handleReset);
    };
  }, [handleNewChat]);

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
      thinking: t(
        "chat.thinkingDefault",
        "Synthesizing market context & evaluating trade queries...",
      ),
      toolCalls: [],
      createdAt: new Date(),
      isStreaming: true,
    };

    // Optimistic UI state update
    const previousMessages = [...messages];
    setMessages((prev) => [...prev, newUserMessage, newAssistantMessage]);
    setIsLoading(true);
    setShowScrollBottom(false);

    // Scroll the page to bottom on send
    requestAnimationFrame(() => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop =
          scrollViewportRef.current.scrollHeight;
      }
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      if (typeof window !== "undefined") {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }
    });
    setTimeout(() => {
      if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop =
          scrollViewportRef.current.scrollHeight;
      }
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationId: activeChatId,
          language,
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
                `/ai-saathi/c/${conversationId}`,
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
            const targetId =
              data.result?.targetArtifactId || data.result?.artifactId;
            const isUpdated = data.result?.isUpdated;

            setMessages((prev) => {
              // 1. If in-place update, first update the target artifact in previous messages
              let updatedPrev = prev;
              if (isUpdated && targetId) {
                updatedPrev = prev.map((m) => {
                  if (!m.toolCalls || m.id === assistantMessageId) return m;
                  const updatedToolCalls = m.toolCalls.map((tc) => {
                    const res = tc.result as any;
                    const match =
                      res?.artifactId === targetId ||
                      res?.data?.artifactId === targetId ||
                      (targetId === "1" && res?.isArtifact) ||
                      (targetId === "art_1" && res?.isArtifact);
                    if (match) {
                      return {
                        ...tc,
                        result: {
                          ...res,
                          title: data.result.title || res.title,
                          summary: data.result.summary || res.summary,
                          data: data.result.data || data.result,
                        },
                      };
                    }
                    return tc;
                  });
                  return { ...m, toolCalls: updatedToolCalls };
                });
              }

              // 2. Update current assistant message's toolCalls
              return updatedPrev.map((m) => {
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
              });
            });

            // If the artifact modal is currently open on screen, live-sync the changes!
            if (isUpdated && data.result?.data) {
              setActiveArtifact((curr) => {
                if (!curr) return null;
                return {
                  ...curr,
                  title: data.result.title || curr.title,
                  summary: data.result.summary || curr.summary,
                  data: data.result.data,
                };
              });
            }
          } else if (eventType === "chunk") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: m.content + data.text }
                  : m,
              ),
            );
          } else if (eventType === "done") {
            const elapsed =
              typeof data?.thoughtDurationSeconds === "number"
                ? data.thoughtDurationSeconds
                : Math.max(
                    1,
                    Math.round(
                      (Date.now() -
                        (newUserMessage.createdAt as any).getTime()) /
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

  // Derive artifact strictly scoped to the current active chat
  const currentChatArtifact = useMemo(() => {
    // If an artifact was generated live in this voice turn, show it
    if (liveAgent.liveArtifact) return liveAgent.liveArtifact;
    // Otherwise, find the latest artifact from the CURRENT chat's messages
    if (activeChatId && messages.length > 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === "assistant" && msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            const res = tc.result as any;
            if (res?.isArtifact && res?.artifactType && res?.data) {
              return {
                artifactId: res.artifactId || res.data?.artifactId,
                targetArtifactId: res.targetArtifactId,
                isUpdated: res.isUpdated,
                artifactType: res.artifactType,
                title: res.title,
                summary: res.summary,
                data: res.data,
              } as ArtifactPayload;
            }
          }
        }
      }
    }
    return null;
  }, [liveAgent.liveArtifact, activeChatId, messages]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-transparent text-foreground font-sans">
      {/* ── Top-Right Floating Controls (ChatGPT Style Mobile & Collapsed Desktop) ── */}
      {(!isSidebarOpen ||
        (typeof window !== "undefined" && window.innerWidth < 1024)) && (
        <div className="absolute top-3 right-3 z-30 flex items-center pointer-events-auto select-none">
          <div className="h-10 px-1.5 flex items-center gap-1 bg-white/90 dark:bg-card/90 backdrop-blur-md border border-sage/40 dark:border-border rounded-2xl shadow-xs">
            <button
              onClick={handleNewChat}
              title="New chat"
              className="size-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-forest dark:hover:text-mint hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
            >
              <Plus className="size-4" />
            </button>

            <button
              onClick={() => setIsSidebarOpen(true)}
              title="Show chat history"
              className="size-8 rounded-xl flex items-center justify-center text-ink-muted hover:text-forest dark:hover:text-mint hover:bg-cream dark:hover:bg-muted transition-colors cursor-pointer"
            >
              <PanelRightOpen className="size-4" />
            </button>
          </div>
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
            activeArtifact={currentChatArtifact}
            onOpenArtifact={(art) => setActiveArtifact(art)}
            onDownloadDebugAudio={liveAgent.downloadDebugAudio}
          />
        ) : isNewChatView ? (
          /* NEW CHAT (Centered Hero View - only for blank /dashboard page) */
          <div className="w-full h-full overflow-y-auto flex flex-col justify-center items-center px-4 pt-16 pb-8 md:py-8 -mt-6">
            <div className="w-full max-w-3xl text-center mb-8 animate-in fade-in-50 duration-300">
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-forest dark:text-foreground mb-2">
                {t("chat.agendaTitle", "What's on the agenda today?")}
              </h1>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-muted-foreground">
                {t(
                  "chat.agendaSubtitle",
                  "Hyper-local mandi intelligence, financial structuring, and government credit scheme advisor",
                )}
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
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-4xl px-4 md:px-6">
              {[
                {
                  label: t("chat.promptCompetitorsTitle", "Hyper-Local Competitors"),
                  desc: t(
                    "chat.promptCompetitorsDesc",
                    "Scan nearby rival businesses, prices & threat ratings",
                  ),
                  icon: Store,
                  prompt: t(
                    "chat.promptCompetitorsPrompt",
                    "Scan and analyze real nearby competitors, pricing, and market saturation for my business in my area.",
                  ),
                },
                {
                  label: t("chat.promptOndcWholesaleTitle", "ONDC Wholesale Sourcing"),
                  desc: t(
                    "chat.promptOndcWholesaleDesc",
                    "Source inventory & raw materials 8-12% cheaper on B2B",
                  ),
                  icon: PackageCheck,
                  prompt: t(
                    "chat.promptOndcWholesalePrompt",
                    "How can I use ONDC B2B to source wholesale inventory and materials 8-12% cheaper for my business?",
                  ),
                },
                {
                  label: t("chat.promptOndcSellTitle", "ONDC Digital Selling"),
                  desc: t(
                    "chat.promptOndcSellDesc",
                    "Sell online at 3% commission vs 25% on legacy apps",
                  ),
                  icon: ShoppingBag,
                  prompt: t(
                    "chat.promptOndcSellPrompt",
                    "How can I list my shop on ONDC via Mystore or Magicpin to sell online with only 3% commission compared to legacy aggregators?",
                  ),
                },
                {
                  label: t("chat.prompt1Title", "Live APMC Mandi Rates"),
                  desc: t(
                    "chat.prompt1Desc",
                    "Current onion, wheat & commodity price arrivals",
                  ),
                  icon: TrendingUp,
                  prompt: t(
                    "chat.prompt1Prompt",
                    "Show me the latest regional mandi rates and APMC trends for Onion and Wheat.",
                  ),
                },
                {
                  label: t("chat.prompt2Title", "PM Mudra & SVANidhi Loan"),
                  desc: t(
                    "chat.prompt2Desc",
                    "Check zero-collateral credit eligibility",
                  ),
                  icon: Landmark,
                  prompt: t(
                    "chat.prompt2Prompt",
                    "Evaluate my eligibility for PM Mudra Kishore and PM SVANidhi loans.",
                  ),
                },
                {
                  label: t("chat.prompt3Title", "Working Capital Optimization"),
                  desc: t(
                    "chat.prompt3Desc",
                    "Analyze 14-day cash flow & stock buffer",
                  ),
                  icon: Coins,
                  prompt: t(
                    "chat.prompt3Prompt",
                    "Give me advice on optimizing my micro-enterprise working capital and inventory buffer.",
                  ),
                },
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="p-3.5 rounded-2xl border border-sage/20 dark:border-border bg-white/40 dark:bg-card/40 hover:bg-white/65 dark:hover:bg-card/65 hover:border-mint backdrop-blur-md transition-all shadow-xs hover:shadow-md text-left group flex items-start gap-3.5 cursor-pointer"
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
            <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-16 pb-6 md:py-6">
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                onOpenArtifact={(art) => setActiveArtifact(art)}
              />
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

      {/* ── Interactive Artifact Review & Approval Modal ── */}
      <ArtifactModal
        isOpen={Boolean(activeArtifact)}
        onClose={() => setActiveArtifact(null)}
        artifact={activeArtifact}
        isVoiceMode={isVoiceMode}
        onVoiceHoldStart={liveAgent.startSpeaking}
        onVoiceHoldEnd={liveAgent.stopSpeaking}
        isUserSpeaking={liveAgent.isUserSpeaking}
        isHoldingToSpeak={liveAgent.isHoldingToSpeak}
      />
    </div>
  );
}
