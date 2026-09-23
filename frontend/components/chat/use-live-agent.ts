"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PCMRecorder } from "@/lib/voice/pcm-recorder";
import { PCMPlayer } from "@/lib/voice/pcm-player";
import { CameraManager, type BurstCaptureResult } from "@/lib/voice/camera-manager";
import type { SupportedLanguageCode } from "@/lib/agent/chat-config";
import type { ArtifactPayload } from "./artifact-modal";
import type { ToolCallItem } from "./types";

const GEMINI_LIVE_INPUT_SAMPLE_RATE = 16000;

export interface LiveAgentOptions {
  activeChatId?: string | null;
  onTurnComplete?: (turn: {
    userTranscript: string;
    assistantTranscript: string;
    files?: string[];
    toolCalls?: ToolCallItem[];
    thoughtDurationSeconds?: number;
    thinking?: string;
  }) => void;
  onError?: (error: Error) => void;
  onArtifactAction?: (artifact: ArtifactPayload) => void;
}

interface VoiceSessionConfig {
  accessToken: string;
  projectId: string;
  location: string;
  model: string;
  voiceName: string;
  systemInstruction: string;
  tools: Array<{
    functionDeclarations: Array<{
      name: string;
      description: string;
      parameters?: {
        type: string;
        properties: Record<string, unknown>;
        required?: string[];
      };
    }>;
  }>;
  toolConfig?: Record<string, unknown>;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface VertexFunctionCall {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
}

interface VertexFunctionResponse {
  id?: string;
  name: string;
  response: { output: unknown };
}

function mergeTranscript(current: string, incoming: string) {
  const cleanCurrent = current.trim();
  const cleanIncoming = incoming.trim();
  if (!cleanCurrent) return cleanIncoming;
  if (!cleanIncoming) return cleanCurrent;
  if (cleanCurrent.endsWith(cleanIncoming)) return cleanCurrent;
  if (cleanIncoming.startsWith(cleanCurrent)) return cleanIncoming;
  return `${cleanCurrent} ${cleanIncoming}`;
}

function displayMicError(error: Error | string | null | undefined): string {
  if (!error) return "Microphone connection lost.";
  const msg = typeof error === "string" ? error : error.message;
  const lower = msg.toLowerCase();
  if (
    lower.includes("notallowederror") ||
    lower.includes("permission") ||
    lower.includes("not allowed") ||
    lower.includes("denied")
  ) {
    return "Microphone permission is blocked. Allow mic access in your browser site settings.";
  }
  if (lower.includes("notfounderror") || lower.includes("no microphone")) {
    return "No microphone found on this device.";
  }
  if (lower.includes("notreadableerror") || lower.includes("busy")) {
    return "Microphone is busy in another app. Please close other voice apps and retry.";
  }
  return msg;
}

export interface SubAgentTaskItem {
  id: string;
  chatId?: string;
  status: "working" | "completed" | "error" | "unclear";
  activeTool?: string;
  description?: string;
  spokenHint?: string;
  progressPhase?: string;
  artifact?: ArtifactPayload | null;
  startTime: number;
}

export interface CompletedTaskItem {
  id: string;
  completedAt: number;
  title: string;
  summary: string;
  artifact: ArtifactPayload;
  toolName?: string;
  query?: string;
  savedImageUrl?: string | null;
}

export interface BackgroundScreenTaskState {
  status: "idle" | "working" | "completed" | "error";
  activeTool?: string;
  description?: string;
  spokenHint?: string;
  progressPhase?: string;
  artifact?: ArtifactPayload | null;
}

export function useLiveAgent(options: LiveAgentOptions = {}) {
  const [status, setStatus] = useState<
    | "initializing"
    | "connecting"
    | "ready"
    | "listening"
    | "speaking"
    | "thinking"
    | "disconnected"
    | "error"
  >("disconnected");

  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isHoldingToSpeak, setIsHoldingToSpeak] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [liveUserTranscript, setLiveUserTranscript] = useState("");
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState("");
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [liveArtifact, setLiveArtifact] = useState<ArtifactPayload | null>(null);
  const [liveArtifactChatId, setLiveArtifactChatId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguageCode>("hi-IN");

  const [activeArtifactOverview, setActiveArtifactOverview] = useState<{
    type?: string;
    title?: string;
    summary?: string;
  } | null>(null);
  const activeArtifactOverviewRef = useRef(activeArtifactOverview);
  useEffect(() => {
    activeArtifactOverviewRef.current = activeArtifactOverview;
  }, [activeArtifactOverview]);

  const [activeTasks, setActiveTasks] = useState<SubAgentTaskItem[]>([]);
  const activeTasksRef = useRef<Map<string, SubAgentTaskItem>>(new Map());

  const [sessionCompletedTasks, setSessionCompletedTasks] = useState<CompletedTaskItem[]>([]);
  const sessionCompletedTasksRef = useRef<CompletedTaskItem[]>([]);

  const [backgroundTask, setBackgroundTask] = useState<BackgroundScreenTaskState>({
    status: "idle",
  });
  const backgroundTaskRef = useRef<BackgroundScreenTaskState>({
    status: "idle",
  });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<"denied" | null>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const cameraPreviewIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAutoStartCameraRef = useRef(false);

  const clearCameraError = useCallback(() => {
    setCameraError(null);
  }, []);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);

  const connectedRef = useRef(false);
  const mutedRef = useRef(false);
  const assistantSpeakingRef = useRef(false);
  const playbackActiveRef = useRef(false);
  const isHoldingRef = useRef(false);
  const userSpeakingRef = useRef(false);
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeChatIdRef = useRef<string | null>(options.activeChatId || null);
  const userTranscriptRef = useRef("");
  const nativeCaptionFinalRef = useRef("");
  const assistantTranscriptRef = useRef("");
  const assistantUsesOutputTranscriptRef = useRef(false);
  const toolCallsRef = useRef<ToolCallItem[]>([]);
  const isExecutingToolRef = useRef(false);
  const turnTaskTriggeredRef = useRef(false);
  const turnCompleteRef = useRef(false);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartTimeRef = useRef<number>(0);

  const pendingMicVolumeRef = useRef(0);
  const displayedMicVolumeRef = useRef(0);
  const micVolumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedLanguageRef = useRef<SupportedLanguageCode>("hi-IN");

  useEffect(() => {
    activeChatIdRef.current = options.activeChatId || null;
    // Clear live artifact when activeChatId changes so artifacts never leak across chats
    setLiveArtifact(null);
    setLiveArtifactChatId(null);
  }, [options.activeChatId]);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = null;
  }, []);

  const clearThinkingTimeout = useCallback(() => {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
  }, []);

  // ── IMMUTABLE SNAPSHOT PERSISTENCE ──
  // Saves the turn using immutable values captured at the moment of completion,
  // making it immune to immediate state wipes in subsequent turns.
  const persistTurnSnapshot = useCallback(
    async (snapshot: {
      userTranscript: string;
      assistantTranscript: string;
      toolCalls: ToolCallItem[];
    }) => {
      let { userTranscript, assistantTranscript, toolCalls } = snapshot;
      userTranscript = userTranscript.trim();
      assistantTranscript = assistantTranscript.trim();

      // We need at least userTranscript or assistantTranscript or toolCalls to persist a turn
      if (!userTranscript && !assistantTranscript && toolCalls.length === 0) return;

      const turnDuration = turnStartTimeRef.current
        ? Math.max(1, Math.round((Date.now() - turnStartTimeRef.current) / 1000))
        : 1;
      const thinkingPayload = JSON.stringify({ durationSeconds: turnDuration });

      console.log("[voice] Persisting turn snapshot to DB & chat list:", {
        userTranscript,
        assistantTranscript,
        toolsCount: toolCalls.length,
        thoughtDurationSeconds: turnDuration,
      });

      try {
        optionsRef.current.onTurnComplete?.({
          userTranscript,
          assistantTranscript,
          toolCalls,
          thoughtDurationSeconds: turnDuration,
          thinking: thinkingPayload,
        });
        const chatId = activeChatIdRef.current;
        if (chatId) {
          const response = await fetch(`/api/chats/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userTranscript,
              assistantTranscript,
              toolCalls,
              thinking: thinkingPayload,
            }),
          });
          if (!response.ok) throw new Error("The voice turn could not be saved.");
        }
        turnStartTimeRef.current = 0;
      } catch (error) {
        console.error("[voice] persistence failed", error);
        optionsRef.current.onError?.(
          error instanceof Error ? error : new Error("Voice persistence failed"),
        );
      }
    },
    [],
  );

  const flushAndPersistActiveTurn = useCallback(() => {
    clearFlushTimer();
    if (isExecutingToolRef.current) return;
    const vertexUser = userTranscriptRef.current.trim();
    const browserUser = nativeCaptionFinalRef.current.trim();
    const userTranscript =
      vertexUser.length >= browserUser.length ? vertexUser : browserUser;
    const assistantTranscript = assistantTranscriptRef.current.trim();
    const toolCalls = [...toolCallsRef.current];

    if (!userTranscript && !assistantTranscript && toolCalls.length === 0) return;

    // Reset active refs immediately for the next turn
    userTranscriptRef.current = "";
    nativeCaptionFinalRef.current = "";
    assistantTranscriptRef.current = "";
    assistantUsesOutputTranscriptRef.current = false;
    toolCallsRef.current = [];
    turnCompleteRef.current = false;
    turnTaskTriggeredRef.current = false;
    isExecutingToolRef.current = false;

    // Safely persist with the captured immutable strings
    void persistTurnSnapshot({
      userTranscript,
      assistantTranscript,
      toolCalls,
    });
  }, [clearFlushTimer, persistTurnSnapshot]);

  const schedulePersistence = useCallback(
    (delayMs = 1500) => {
      clearFlushTimer();
      // Vertex sends outputTranscription fragments as audio streams.
      // Wait for the fragments to finish streaming before auto-persisting.
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        flushAndPersistActiveTurn();
      }, delayMs);
    },
    [clearFlushTimer, flushAndPersistActiveTurn],
  );

  const startSpeaking = useCallback(() => {
    if (mutedRef.current || !connectedRef.current) return;

    // ── Bulletproof turn-boundary cleanup ──
    // 1. Kill any residual audio from the previous AI response immediately.
    playerRef.current?.flush();

    // 2. Forcefully reset assistant-speaking state so we don't block.
    assistantSpeakingRef.current = false;
    playbackActiveRef.current = false;

    // 3. Persist previous turn ONLY if the assistant had responded or executed tools.
    clearThinkingTimeout();
    turnTaskTriggeredRef.current = false;
    const hasAssistantResponse =
      Boolean(assistantTranscriptRef.current.trim()) ||
      toolCallsRef.current.length > 0;

    if (hasAssistantResponse) {
      flushAndPersistActiveTurn();
      setLiveUserTranscript("");
      setLiveAssistantTranscript("");
    } else {
      turnStartTimeRef.current = 0;
      // User is continuing speech before assistant responded:
      // Clear flush timer and keep previous user text to merge rather than creating duplicate orphaned bubbles
      clearFlushTimer();
      assistantTranscriptRef.current = "";
      assistantUsesOutputTranscriptRef.current = false;
      turnCompleteRef.current = false;
      setLiveAssistantTranscript("");
    }

    // 5. Begin new recording turn.
    recorderRef.current?.startTurn();
    void recorderRef.current?.resume();
    void playerRef.current?.resume();
    recorderRef.current?.setMuted(false);
    isHoldingRef.current = true;
    setIsHoldingToSpeak(true);
    userSpeakingRef.current = true;
    setIsUserSpeaking(true);

    // 6. Signal Gemini that user audio is about to start.
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          realtimeInput: { activityStart: {} },
        }),
      );
    }

    setStatus("listening");
  }, [clearThinkingTimeout, flushAndPersistActiveTurn]);

  const stopSpeaking = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setIsHoldingToSpeak(false);
    userSpeakingRef.current = false;
    setIsUserSpeaking(false);

    // Flush any partial audio buffer still sitting in the AudioWorklet
    recorderRef.current?.flush();

    const socket = socketRef.current;
    setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            realtimeInput: { activityEnd: {} },
          }),
        );
      }
      if (connectedRef.current && !assistantSpeakingRef.current) {
        setStatus("thinking");
        turnStartTimeRef.current = Date.now();
        clearThinkingTimeout();
        thinkingTimeoutRef.current = setTimeout(() => {
          thinkingTimeoutRef.current = null;
          if (
            !assistantSpeakingRef.current &&
            !isHoldingRef.current &&
            connectedRef.current
          ) {
            console.warn(
              "[voice] thinking timeout — auto-recovering to ready state",
            );
            setStatus("ready");
          }
        }, 20_000);
      }
    }, 100);
  }, [clearThinkingTimeout]);

  const setAssistantSpeaking = useCallback((speaking: boolean) => {
    if (speaking) {
      if (assistantSpeakingRef.current) return;
      assistantSpeakingRef.current = true;
      recorderRef.current?.setMuted(true);
      nativeCaptionFinalRef.current = "";
      setLiveUserTranscript("");
      if (micVolumeTimerRef.current) {
        clearTimeout(micVolumeTimerRef.current);
        micVolumeTimerRef.current = null;
      }
      displayedMicVolumeRef.current = 0;
      pendingMicVolumeRef.current = 0;
      setMicVolume(0);
      userSpeakingRef.current = false;
      setIsUserSpeaking(false);
      isHoldingRef.current = false;
      setIsHoldingToSpeak(false);
      setStatus("speaking");
    } else {
      assistantSpeakingRef.current = false;
      playbackActiveRef.current = false;
      recorderRef.current?.setMuted(mutedRef.current);
      if (connectedRef.current && !mutedRef.current) {
        setStatus("ready");
      }
    }
  }, []);

  const handleAudioLevel = useCallback((rms: number) => {
    if (
      mutedRef.current ||
      assistantSpeakingRef.current ||
      !connectedRef.current
    )
      return;
  }, []);

  const handleMicVolume = useCallback((volume: number) => {
    if (
      !isHoldingRef.current ||
      mutedRef.current ||
      assistantSpeakingRef.current ||
      !connectedRef.current
    ) {
      return;
    }

    pendingMicVolumeRef.current = volume;
    if (micVolumeTimerRef.current) return;

    micVolumeTimerRef.current = setTimeout(() => {
      micVolumeTimerRef.current = null;
      if (
        !isHoldingRef.current ||
        mutedRef.current ||
        assistantSpeakingRef.current ||
        !connectedRef.current
      ) {
        return;
      }

      const next = pendingMicVolumeRef.current;
      if (Math.abs(next - displayedMicVolumeRef.current) < 0.04) return;
      displayedMicVolumeRef.current = next;
      setMicVolume(next);
    }, 120);
  }, []);

  const stopCameraPreviewLoop = useCallback(() => {
    if (cameraPreviewIntervalRef.current) {
      clearInterval(cameraPreviewIntervalRef.current);
      cameraPreviewIntervalRef.current = null;
    }
  }, []);

  const startCameraPreviewLoop = useCallback(() => {
    stopCameraPreviewLoop();
    cameraPreviewIntervalRef.current = setInterval(() => {
      const socket = socketRef.current;
      const camera = cameraManagerRef.current;
      if (
        !camera ||
        !camera.isActive() ||
        !socket ||
        socket.readyState !== WebSocket.OPEN ||
        !connectedRef.current
      ) {
        return;
      }

      const frameBase64 = camera.capturePreviewFrameBase64(640, 0.6);
      if (frameBase64) {
        try {
          socket.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [
                  {
                    mimeType: "image/jpeg",
                    data: frameBase64,
                  },
                ],
              },
            }),
          );
        } catch (e) {
          console.warn("[voice] preview frame send error", e);
        }
      }
    }, 1000);
  }, [stopCameraPreviewLoop]);

  const startCamera = useCallback(async () => {
    if (isCameraActive || cameraManagerRef.current?.isActive()) return;
    setCameraError(null);
    try {
      if (!cameraManagerRef.current) {
        cameraManagerRef.current = new CameraManager();
      }
      await cameraManagerRef.current.start(cameraFacingMode);
      setIsCameraActive(true);
      startCameraPreviewLoop();
    } catch (err: any) {
      // Permission denied or dismissed by user: do NOT console.error or abort active voice call
      const isPermissionDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        err?.message?.toLowerCase().includes("permission denied") ||
        err?.message?.toLowerCase().includes("not allowed");

      if (isPermissionDenied) {
        setCameraError("denied");
      } else {
        console.warn("[voice] Camera unavailable:", err?.message || err);
        setCameraError("denied");
      }
    }
  }, [isCameraActive, cameraFacingMode, startCameraPreviewLoop]);

  const stopCamera = useCallback(() => {
    stopCameraPreviewLoop();
    cameraManagerRef.current?.stop();
    setIsCameraActive(false);
    setCameraError(null);
  }, [stopCameraPreviewLoop]);

  const toggleCamera = useCallback(async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  const switchCameraFacing = useCallback(async () => {
    if (!cameraManagerRef.current || !isCameraActive) return;
    try {
      await cameraManagerRef.current.switchFacingMode();
      setCameraFacingMode(cameraManagerRef.current.getFacingMode());
    } catch (err) {
      console.warn("[voice] Failed to switch camera facing:", err);
    }
  }, [isCameraActive]);

  const attachCameraVideoElement = useCallback((videoEl: HTMLVideoElement | null) => {
    cameraManagerRef.current?.attachToVideoElement(videoEl);
  }, []);

  const launchBackgroundScreenTask = useCallback(
    (
      args: any,
      audioBase64?: string,
      imageBlob?: Blob,
      sharpnessScore?: number,
    ): Promise<{
      finalAssistant: string;
      artifact: ArtifactPayload | null;
      toolCalls: ToolCallItem[];
      savedImageUrl: string | null;
      query: string;
      thoughtDurationSeconds?: number;
    }> => {
      return new Promise((resolve) => {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const currentChatId =
          typeof activeChatIdRef.current === "string" &&
          activeChatIdRef.current.trim()
            ? activeChatIdRef.current.trim()
            : undefined;

        const initialTask: SubAgentTaskItem = {
          id: taskId,
          chatId: currentChatId,
          status: "working",
          activeTool: imageBlob ? "document_ocr" : "research",
          description: imageBlob
            ? `Analyzing captured document (Sharpness Score: ${sharpnessScore ?? "N/A"})`
            : `Starting research for: "${args?.query || "on-screen action"}"`,
          spokenHint: imageBlob
            ? "Main aapke document ko check aur process kar raha hoon, bas thoda sa intezar kijiye."
            : "Main aapki request par kaam kar raha hoon, bas thoda sa intezar kijiye.",
          progressPhase: "starting",
          artifact: null,
          startTime: Date.now(),
        };

        activeTasksRef.current.set(taskId, initialTask);
        const initialActive = Array.from(activeTasksRef.current.values());
        setActiveTasks(initialActive);

        const syncLegacyBackgroundTask = () => {
          const running = Array.from(activeTasksRef.current.values()).filter(
            (t) => t.status === "working",
          );
          if (running.length === 1) {
            backgroundTaskRef.current = {
              status: "working",
              activeTool: running[0].activeTool,
              description: running[0].description,
              spokenHint: running[0].spokenHint,
              progressPhase: running[0].progressPhase,
              artifact: running[0].artifact || null,
            };
          } else if (running.length >= 2) {
            backgroundTaskRef.current = {
              status: "working",
              description: `${running.length} Agents Working in Parallel...`,
            };
          }
          setBackgroundTask({ ...backgroundTaskRef.current });
        };

        syncLegacyBackgroundTask();

        let capturedImageUrl: string | null = null;
        let collectedToolCalls: ToolCallItem[] = [];
        let accumulatedAssistantText = "";
        let taskThoughtDurationSeconds: number | undefined = undefined;

        (async () => {
          try {
            const chatId = currentChatId;

            let res: Response;
            if (imageBlob) {
              const formData = new FormData();
              formData.append(
                "query",
                args?.query || "Inspect and assist with captured document",
              );
              if (args?.actionType)
                formData.append("actionType", args.actionType);
              if (chatId) formData.append("conversationId", chatId);
              if (audioBase64) formData.append("audioBase64", audioBase64);
              formData.append("image", imageBlob, "captured-document.jpg");
              if (typeof sharpnessScore === "number") {
                formData.append("sharpnessScore", String(sharpnessScore));
              }

              res = await fetch("/api/voice/subagent-stream", {
                method: "POST",
                body: formData,
              });
            } else {
              res = await fetch("/api/voice/subagent-stream", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: args?.query,
                  actionType: args?.actionType,
                  conversationId: chatId,
                  audioBase64,
                }),
              });
            }

            if (!res.ok || !res.body) {
              throw new Error("Subagent stream connection failed");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split("\n\n");
              buffer = lines.pop() || "";

              for (const block of lines) {
                if (!block.trim()) continue;
                let event = "message";
                let dataStr = "";

                for (const line of block.split("\n")) {
                  if (line.startsWith("event: ")) {
                    event = line.replace("event: ", "").trim();
                  } else if (line.startsWith("data: ")) {
                    dataStr = line.replace("data: ", "").trim();
                  }
                }

                if (!dataStr) continue;

                try {
                  const data = JSON.parse(dataStr);
                  if (event === "document_captured") {
                    if (data.url) capturedImageUrl = data.url;
                  } else if (event === "status") {
                    const cur = activeTasksRef.current.get(taskId);
                    if (cur) {
                      cur.status = data.status || "working";
                      cur.activeTool = data.activeTool;
                      cur.description = data.description;
                      cur.spokenHint = data.spokenHint;
                      cur.progressPhase = data.progressPhase;
                      if (data.artifact) cur.artifact = data.artifact;
                      activeTasksRef.current.set(taskId, cur);
                      setActiveTasks(Array.from(activeTasksRef.current.values()));
                      syncLegacyBackgroundTask();
                    }
                  } else if (event === "chunk") {
                    if (data.text) accumulatedAssistantText += data.text;
                  } else if (event === "tool_call") {
                    const cur = activeTasksRef.current.get(taskId);
                    if (cur) {
                      cur.activeTool = data.toolName;
                      cur.description = data.summary;
                      activeTasksRef.current.set(taskId, cur);
                      setActiveTasks(Array.from(activeTasksRef.current.values()));
                      syncLegacyBackgroundTask();
                    }
                    collectedToolCalls.push({
                      toolName: data.toolName,
                      summary: data.summary,
                      status: "completed",
                    });
                  } else if (event === "artifact") {
                    const art: ArtifactPayload = {
                      artifactId: data.artifactId,
                      targetArtifactId: data.targetArtifactId,
                      isUpdated: data.isUpdated,
                      artifactType: data.artifactType,
                      title: data.title,
                      summary: data.summary,
                      data: data.data,
                    };
                    setLiveArtifact(art);
                    setLiveArtifactChatId(chatId || null);
                    optionsRef.current.onArtifactAction?.(art);

                    const appropriateToolName =
                      art.artifactType === "document"
                        ? "stageDocument"
                        : art.artifactType === "chart"
                          ? "stageChart"
                          : art.artifactType === "budget"
                            ? "stageBudget"
                            : art.artifactType === "expense"
                              ? "stageExpense"
                              : "stageForm";

                    // Prepend into sessionCompletedTasks (latest first)
                    const compItem: CompletedTaskItem = {
                      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                      completedAt: Date.now(),
                      title: art.title || "Ready on Screen",
                      summary: art.summary || "Draft prepared • Tap to review",
                      artifact: art,
                      toolName: appropriateToolName,
                      query: args?.query,
                    };
                    sessionCompletedTasksRef.current = [
                      compItem,
                      ...sessionCompletedTasksRef.current.filter(
                        (c) => c.artifact.artifactId !== art.artifactId,
                      ),
                    ];
                    setSessionCompletedTasks([...sessionCompletedTasksRef.current]);

                    const cur = activeTasksRef.current.get(taskId);
                    if (cur) {
                      cur.artifact = art;
                      activeTasksRef.current.set(taskId, cur);
                      setActiveTasks(Array.from(activeTasksRef.current.values()));
                      syncLegacyBackgroundTask();
                    }

                    const existingIdx = collectedToolCalls.findIndex(
                      (tc) =>
                        (tc.result as any)?.artifactId === art.artifactId ||
                        tc.toolName === appropriateToolName ||
                        tc.toolName === "stageForm" ||
                        tc.toolName === "stageDocument",
                    );
                    const artifactToolCall: ToolCallItem = {
                      toolName: appropriateToolName,
                      summary: art.summary || art.title,
                      status: "completed",
                      result: {
                        isArtifact: true,
                        ...art,
                      },
                    };
                    if (existingIdx >= 0) {
                      collectedToolCalls[existingIdx] = artifactToolCall;
                    } else {
                      collectedToolCalls.push(artifactToolCall);
                    }
                  } else if (event === "done") {
                    if (data.savedImageUrl)
                      capturedImageUrl = data.savedImageUrl;
                    if (
                      Array.isArray(data.toolCalls) &&
                      data.toolCalls.length > 0
                    ) {
                      collectedToolCalls = data.toolCalls;
                    }
                    if (data.assistantContent) {
                      accumulatedAssistantText = data.assistantContent;
                    }
                    if (typeof data.thoughtDurationSeconds === "number") {
                      taskThoughtDurationSeconds = data.thoughtDurationSeconds;
                    }

                    const finalUserQuery =
                      data.query ||
                      args?.query ||
                      (capturedImageUrl ? "Scanned Document" : "Screen Task");
                    const finalAssistant =
                      accumulatedAssistantText ||
                      "Maine aapka request process kar diya hai.";

                    // Task finished: remove from activeTasks
                    activeTasksRef.current.delete(taskId);
                    const remaining = Array.from(activeTasksRef.current.values());
                    setActiveTasks(remaining);

                    const remainingRunning = remaining.filter(
                      (t) => t.status === "working",
                    );
                    if (remainingRunning.length === 1) {
                      backgroundTaskRef.current = {
                        status: "working",
                        activeTool: remainingRunning[0].activeTool,
                        description: remainingRunning[0].description,
                        spokenHint: remainingRunning[0].spokenHint,
                        progressPhase: remainingRunning[0].progressPhase,
                        artifact: remainingRunning[0].artifact || null,
                      };
                    } else if (remainingRunning.length >= 2) {
                      backgroundTaskRef.current = {
                        status: "working",
                        description: `${remainingRunning.length} Agents Working in Parallel...`,
                      };
                    } else {
                      backgroundTaskRef.current = {
                        status: "completed",
                        artifact: backgroundTaskRef.current.artifact || null,
                      };
                    }
                    setBackgroundTask({ ...backgroundTaskRef.current });
                    if (backgroundTaskRef.current.artifact) {
                      setActiveArtifactOverview({
                        type: backgroundTaskRef.current.artifact.artifactType,
                        title: backgroundTaskRef.current.artifact.title,
                        summary: backgroundTaskRef.current.artifact.summary,
                      });
                    }

                    resolve({
                      finalAssistant,
                      artifact: backgroundTaskRef.current.artifact || null,
                      toolCalls: collectedToolCalls,
                      savedImageUrl: capturedImageUrl,
                      query: finalUserQuery,
                      thoughtDurationSeconds: taskThoughtDurationSeconds,
                    });
                  }
                } catch (parseErr) {
                  console.warn("[voice/subagent-stream] parse error:", parseErr);
                }
              }
            }
          } catch (err: any) {
            console.error("[voice/subagent-stream error]:", err);
            activeTasksRef.current.delete(taskId);
            const remaining = Array.from(activeTasksRef.current.values());
            setActiveTasks(remaining);

            const remainingRunning = remaining.filter(
              (t) => t.status === "working",
            );
            if (remainingRunning.length === 1) {
              backgroundTaskRef.current = {
                status: "working",
                activeTool: remainingRunning[0].activeTool,
                description: remainingRunning[0].description,
                spokenHint: remainingRunning[0].spokenHint,
                progressPhase: remainingRunning[0].progressPhase,
                artifact: remainingRunning[0].artifact || null,
              };
            } else if (remainingRunning.length >= 2) {
              backgroundTaskRef.current = {
                status: "working",
                description: `${remainingRunning.length} Agents Working in Parallel...`,
              };
            } else {
              backgroundTaskRef.current = {
                status: "error",
                description: "Subagent encountered an error",
                spokenHint: "Task me dikkat aayi.",
              };
            }
            setBackgroundTask({ ...backgroundTaskRef.current });

            resolve({
              finalAssistant: "Task execute karne me dikkat aayi.",
              artifact: null,
              toolCalls: collectedToolCalls,
              savedImageUrl: capturedImageUrl,
              query: args?.query || "Screen action",
            });
          }
        })();
      });
    },
    [],
  );

  const captureDocumentManual = useCallback(
    async (overrideQuery?: string) => {
      if (!cameraManagerRef.current || !cameraManagerRef.current.isActive())
        return;
      const captureStartTime = Date.now();
      const burst = await cameraManagerRef.current.captureBestFrameBlob();
      if (!burst) return;

      const query =
        overrideQuery ||
        userTranscriptRef.current.trim() ||
        nativeCaptionFinalRef.current.trim() ||
        "Inspect and process captured document";

      const subResult = await launchBackgroundScreenTask(
        { query },
        undefined,
        burst.blob,
        burst.sharpnessScore,
      );

      const elapsedSeconds =
        subResult.thoughtDurationSeconds ||
        Math.max(1, Math.round((Date.now() - captureStartTime) / 1000));

      // If manual capture triggered outside of voice tool call, persist the result
      optionsRef.current.onTurnComplete?.({
        userTranscript: query,
        assistantTranscript: subResult.finalAssistant,
        files: subResult.savedImageUrl ? [subResult.savedImageUrl] : undefined,
        toolCalls:
          subResult.toolCalls.length > 0 ? subResult.toolCalls : undefined,
        thoughtDurationSeconds: elapsedSeconds,
        thinking: JSON.stringify({ durationSeconds: elapsedSeconds }),
      });
    },
    [launchBackgroundScreenTask],
  );

  const handleToolCalls = useCallback(
    async (calls: VertexFunctionCall[], socket: WebSocket) => {
      const functionResponses: VertexFunctionResponse[] = [];
      const audioBase64 = recorderRef.current?.getLastTurnWavBase64() || undefined;

      for (const call of calls) {
        setActiveToolName(call.name);

        if (call.name === "captureDocument") {
          const isCameraOn = Boolean(
            cameraManagerRef.current && cameraManagerRef.current.isActive()
          );

          if (!isCameraOn) {
            const result = {
              status: "error",
              error: "CAMERA_NOT_ACTIVE",
              message:
                "Camera is currently turned off. Please ask the user to turn on their camera first so you can see and capture the document.",
            };

            toolCallsRef.current.push({
              toolName: call.name,
              args: call.args,
              result,
              status: "error",
            });

            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { output: result },
            });
          } else {
            // 1. Run rapid 3-frame burst with Laplacian variance sharpness scoring
            const burst = await cameraManagerRef.current!.captureBestFrameBlob();

            // 2. Launch background subagent with the sharpest in-focus Blob and formulated query, awaiting completion
            turnTaskTriggeredRef.current = true;
            const subResult = await launchBackgroundScreenTask(
              {
                query:
                  call.args?.query ||
                  "Inspect and process the captured document",
              },
              audioBase64,
              burst?.blob,
              burst?.sharpnessScore,
            );

            // 3. Push real sub-agent tool calls
            if (subResult.toolCalls && subResult.toolCalls.length > 0) {
              toolCallsRef.current.push(...subResult.toolCalls);
            } else {
              toolCallsRef.current.push({
                toolName: call.name,
                args: call.args,
                result: {
                  status: "completed",
                  findings: subResult.finalAssistant,
                },
                status: "completed",
              });
            }

            // 4. Return native toolResponse to Gemini Live
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: {
                output: {
                  status: "completed",
                  findings: subResult.finalAssistant,
                  artifact: subResult.artifact
                    ? {
                        title: subResult.artifact.title,
                        summary: subResult.artifact.summary,
                        type: subResult.artifact.artifactType,
                      }
                    : null,
                  instruction:
                    "Document analysis and extraction completed successfully. Speak the summary naturally to the user now.",
                },
              },
            });
          }
        } else if (call.name === "triggerScreenAction") {
          turnTaskTriggeredRef.current = true;
          // Await autonomous subagent execution (web search, data extraction, forms/tables)
          const subResult = await launchBackgroundScreenTask(call.args, audioBase64);

          // Push real sub-agent tool calls
          if (subResult.toolCalls && subResult.toolCalls.length > 0) {
            toolCallsRef.current.push(...subResult.toolCalls);
          } else {
            toolCallsRef.current.push({
              toolName: call.name,
              args: call.args,
              result: {
                status: "completed",
                findings: subResult.finalAssistant,
              },
              status: "completed",
            });
          }

          // Return native toolResponse to Gemini Live
          functionResponses.push({
            id: call.id,
            name: call.name,
            response: {
              output: {
                status: "completed",
                findings: subResult.finalAssistant,
                artifact: subResult.artifact
                  ? {
                      title: subResult.artifact.title,
                      summary: subResult.artifact.summary,
                      type: subResult.artifact.artifactType,
                    }
                  : null,
                instruction:
                  "Screen action and research completed successfully. Speak the oral summary naturally to the user now.",
              },
            },
          });
        } else if (call.name === "checkScreenActionStatus") {
          // Query live background task state in < 5ms
          const cur = backgroundTaskRef.current;
          const result = {
            status: cur.status,
            activeTool: cur.activeTool || "none",
            description: cur.description || (cur.status === "completed" ? "Completed on screen" : "No active task"),
            spokenHint: cur.spokenHint || (cur.status === "completed" ? "Form screen par taiyar ho chuka hai, aap ise dekh sakte hain." : "Abhi koi screen action active nahi hai."),
            title: cur.artifact?.title,
          };

          toolCallsRef.current.push({
            toolName: call.name,
            args: call.args,
            result,
            status: "completed",
          });

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: { output: result },
          });
        } else {
          // Fallback legacy tool execution
          try {
            const response = await fetch("/api/voice/execute-tool", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toolName: call.name,
                args: {
                  ...(call.args || {}),
                  audioBase64,
                  userTranscript: userTranscriptRef.current || undefined,
                },
                conversationId:
                  typeof activeChatIdRef.current === "string" && activeChatIdRef.current.trim()
                    ? activeChatIdRef.current.trim()
                    : undefined,
              }),
            });
            if (!response.ok) throw new Error("Tool request failed");
            const data = (await response.json()) as { result?: unknown };
            const result = data.result ?? { success: true };
            toolCallsRef.current.push({
              toolName: call.name,
              args: call.args,
              result,
              status: "completed",
            });

            if ((result as any)?.isArtifact && (result as any)?.artifactType) {
              const art: ArtifactPayload = {
                artifactId:
                  (result as any).artifactId || (result as any).data?.artifactId,
                targetArtifactId: (result as any).targetArtifactId,
                isUpdated: (result as any).isUpdated,
                artifactType: (result as any).artifactType,
                title: (result as any).title,
                summary: (result as any).summary,
                data: (result as any).data,
              };
              setLiveArtifact(art);
              optionsRef.current.onArtifactAction?.(art);
            }

            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { output: { success: true, message: "Completed" } },
            });
          } catch {
            toolCallsRef.current.push({
              toolName: call.name,
              args: call.args,
              result: { error: "Execution failed" },
              status: "error",
            });
            functionResponses.push({
              id: call.id,
              name: call.name,
              response: { output: { error: "Execution failed" } },
            });
          }
        }
      }
      setActiveToolName(null);
      if (socket.readyState === WebSocket.OPEN && functionResponses.length) {
        socket.send(JSON.stringify({ toolResponse: { functionResponses } }));
      }
      // Safety fallback: if Gemini does not stream back a response after toolResponse within 6s, release flag
      setTimeout(() => {
        if (isExecutingToolRef.current) {
          isExecutingToolRef.current = false;
          if (turnCompleteRef.current && !playbackActiveRef.current) {
            schedulePersistence(500);
          }
        }
      }, 6000);
    },
    [launchBackgroundScreenTask],
  );

  const disconnect = useCallback(() => {
    connectedRef.current = false;
    assistantSpeakingRef.current = false;
    playbackActiveRef.current = false;
    isHoldingRef.current = false;
    setIsHoldingToSpeak(false);
    clearThinkingTimeout();
    if (micVolumeTimerRef.current) {
      clearTimeout(micVolumeTimerRef.current);
      micVolumeTimerRef.current = null;
    }

    // Flush and persist any pending unsaved turn before closing
    flushAndPersistActiveTurn();

    stopCameraPreviewLoop();
    cameraManagerRef.current?.stop();
    setIsCameraActive(false);

    const socket = socketRef.current;
    socketRef.current = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      )
        socket.close();
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
    playerRef.current?.stop();
    playerRef.current = null;

    pendingAutoStartCameraRef.current = false;
    userSpeakingRef.current = false;
    setIsUserSpeaking(false);
    displayedMicVolumeRef.current = 0;
    pendingMicVolumeRef.current = 0;
    setMicVolume(0);
    setStatus("disconnected");
    setLiveUserTranscript("");
    setLiveAssistantTranscript("");
    setActiveToolName(null);
    setLiveArtifact(null);
    setLiveArtifactChatId(null);
    sessionCompletedTasksRef.current = [];
    setSessionCompletedTasks([]);
    activeTasksRef.current.clear();
    setActiveTasks([]);
    backgroundTaskRef.current = { status: "idle" };
    setBackgroundTask({ status: "idle" });
  }, [clearThinkingTimeout, flushAndPersistActiveTurn]);

  useEffect(() => disconnect, [disconnect]);

  const connect = useCallback(
    async (
      conversationIdOverride?: string,
      initialOptions?: { autoStartCamera?: boolean; initialMuted?: boolean },
    ) => {
      const validOverride =
        typeof conversationIdOverride === "string" && conversationIdOverride.trim()
          ? conversationIdOverride.trim()
          : undefined;
      if (validOverride) {
        activeChatIdRef.current = validOverride;
      }
      disconnect();
      setStatus("connecting");
      setErrorMessage(null);
      connectedRef.current = true;
      const willBeMuted = Boolean(initialOptions?.initialMuted);
      mutedRef.current = willBeMuted;
      setIsMuted(willBeMuted);
      if (initialOptions?.autoStartCamera) {
        pendingAutoStartCameraRef.current = true;
      }
      assistantSpeakingRef.current = false;
      playbackActiveRef.current = false;
      isHoldingRef.current = false;
      setIsHoldingToSpeak(false);
      turnTaskTriggeredRef.current = false;

      try {
        const currentChatId =
          typeof activeChatIdRef.current === "string" && activeChatIdRef.current.trim()
            ? activeChatIdRef.current.trim()
            : undefined;

        const response = await fetch("/api/voice/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: currentChatId,
            language: selectedLanguageRef.current,
            activeArtifactOverview: activeArtifactOverviewRef.current || undefined,
          }),
        });
        const session = (await response.json()) as VoiceSessionConfig & {
          error?: string;
        };
        if (!response.ok || !session.accessToken)
          throw new Error(
            session.error || "Unable to create a Vertex voice session.",
          );

        const player = new PCMPlayer({
          sampleRate: 24000,
          onPlaybackStateChange: (playing) => {
            if (!connectedRef.current) return;
            playbackActiveRef.current = playing;
            if (playing) {
              setAssistantSpeaking(true);
            } else {
              // Audio queue drained and finished playing: transition to ready immediately
              setAssistantSpeaking(false);
              flushAndPersistActiveTurn();
            }
          },
        });
        await player.init();
        playerRef.current = player;

        const wsUrl = `wss://aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent?access_token=${session.accessToken}`;
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          socket.send(
            JSON.stringify({
              setup: {
                model: session.model,
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: session.voiceName },
                    },
                  },
                },
                safetySettings: session.safetySettings || [
                  {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_LOW_AND_ABOVE",
                  },
                  {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_LOW_AND_ABOVE",
                  },
                  {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_LOW_AND_ABOVE",
                  },
                  {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_LOW_AND_ABOVE",
                  },
                ],
                realtimeInputConfig: {
                  automaticActivityDetection: {
                    disabled: true,
                  },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: {
                  parts: [{ text: session.systemInstruction }],
                },
                tools: session.tools,
                toolConfig: session.toolConfig || {
                  functionCallingConfig: {
                    mode: "AUTO",
                  },
                },
              },
            }),
          );
        };

        socket.onmessage = async (event) => {
          try {
            const raw =
              typeof event.data === "string"
                ? event.data
                : event.data instanceof Blob
                  ? await event.data.text()
                  : new TextDecoder().decode(event.data as ArrayBuffer);
            const message = JSON.parse(raw);
            if (message.setupComplete) {
              const recorder = new PCMRecorder({
                onChunk: (data) => {
                  if (
                    isHoldingRef.current &&
                    !mutedRef.current &&
                    !assistantSpeakingRef.current &&
                    socketRef.current &&
                    socketRef.current.readyState === WebSocket.OPEN
                  ) {
                    socketRef.current.send(
                      JSON.stringify({
                        realtimeInput: {
                          mediaChunks: [
                            {
                              mimeType: `audio/pcm;rate=${GEMINI_LIVE_INPUT_SAMPLE_RATE}`,
                              data,
                            },
                          ],
                        },
                      }),
                    );
                  }
                },
                onVolume: handleMicVolume,
                onAudioLevel: handleAudioLevel,
                onError: (error) => {
                  setStatus("error");
                  setErrorMessage(displayMicError(error));
                },
              });
              recorderRef.current = recorder;
              if (!(await recorder.start())) return;
              if (mutedRef.current) {
                recorder.setMuted(true);
              }
              console.log(
                "[voice] Gemini input sample rate:",
                recorder.getNativeSampleRate(),
              );
              console.log("[voice] mic input info:", recorder.getInputInfo());
              setStatus("ready");
              if (pendingAutoStartCameraRef.current) {
                pendingAutoStartCameraRef.current = false;
                void startCamera();
              }
              return;
            }

            const serverContent = message.serverContent;

            if (serverContent) {
              clearThinkingTimeout();
              if (!turnStartTimeRef.current) {
                turnStartTimeRef.current = Date.now();
              }
            }

            if (serverContent?.inputTranscription?.text) {
              const vertexText = serverContent.inputTranscription.text.trim();
              console.log("[voice] FINAL user:", vertexText);
              if (vertexText) {
                userTranscriptRef.current = mergeTranscript(
                  userTranscriptRef.current,
                  vertexText,
                );
                setLiveUserTranscript(userTranscriptRef.current);
              }
            }

            if (serverContent?.outputTranscription?.text) {
              isExecutingToolRef.current = false;
              if (!assistantUsesOutputTranscriptRef.current) {
                assistantUsesOutputTranscriptRef.current = true;
                assistantTranscriptRef.current = "";
              }
              assistantTranscriptRef.current = mergeTranscript(
                assistantTranscriptRef.current,
                serverContent.outputTranscription.text,
              );
              setLiveAssistantTranscript(assistantTranscriptRef.current);
            }

            for (const part of serverContent?.modelTurn?.parts || []) {
              if (part.inlineData?.data) {
                isExecutingToolRef.current = false;
                if (isHoldingRef.current) continue;
                playerRef.current?.playChunk(part.inlineData.data);
              }
              if (part.text && !assistantUsesOutputTranscriptRef.current) {
                isExecutingToolRef.current = false;
                assistantTranscriptRef.current = mergeTranscript(
                  assistantTranscriptRef.current,
                  part.text,
                );
                setLiveAssistantTranscript(assistantTranscriptRef.current);
                if (assistantSpeakingRef.current) {
                  setStatus("speaking");
                }
              }
            }

            if (serverContent?.interrupted) {
              playerRef.current?.interrupt();
              turnCompleteRef.current = true;
            }

            const calls: VertexFunctionCall[] = [
              ...((message.toolCall?.functionCalls ||
                []) as VertexFunctionCall[]),
              ...((serverContent?.modelTurn?.parts || [])
                .filter((p: any) => p.functionCall)
                .map((p: any) => p.functionCall) as VertexFunctionCall[]),
            ];
            if (calls.length) {
              isExecutingToolRef.current = true;
              turnTaskTriggeredRef.current = true;
              clearFlushTimer();
              await handleToolCalls(calls, socket);
            }

            if (serverContent?.turnComplete) {
              turnCompleteRef.current = true;
              // If tools are executing or being called, this is an intermediate yield from Gemini Live.
              // Do not persist yet; wait for tool execution and assistant verbal speech!
              if (!calls.length && !isExecutingToolRef.current) {
                if (!playbackActiveRef.current) {
                  setAssistantSpeaking(false);
                  // Allow in-flight inputTranscription packets to settle before flushing
                  schedulePersistence(userTranscriptRef.current ? 300 : 800);
                } else {
                  schedulePersistence(1500);
                }
              }
            }
          } catch (error) {
            console.error("[voice] message processing failed", error);
          }
        };

        socket.onerror = () => {
          setStatus("error");
          setErrorMessage(
            "The voice connection failed. Please check your internet connection and try again.",
          );
        };

        socket.onclose = () => {
          if (connectedRef.current) {
            setStatus("disconnected");
          }
        };
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Voice agent connection error.",
        );
      }
    },
    [
      captureDocumentManual,
      clearThinkingTimeout,
      disconnect,
      flushAndPersistActiveTurn,
      handleAudioLevel,
      handleMicVolume,
      handleToolCalls,
      launchBackgroundScreenTask,
      schedulePersistence,
      setAssistantSpeaking,
      startCamera,
    ],
  );

  const setLanguage = useCallback(
    (lang: SupportedLanguageCode) => {
      if (selectedLanguageRef.current === lang) return;
      selectedLanguageRef.current = lang;
      setSelectedLanguage(lang);
      if (connectedRef.current) {
        // Reconnect with new language session instructions immediately
        void connect();
      }
    },
    [connect],
  );

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setIsMuted(next);
    recorderRef.current?.setMuted(next);
    if (next) {
      if (micVolumeTimerRef.current) {
        clearTimeout(micVolumeTimerRef.current);
        micVolumeTimerRef.current = null;
      }
      displayedMicVolumeRef.current = 0;
      pendingMicVolumeRef.current = 0;
      setMicVolume(0);
    }
  }, []);

  const reportError = useCallback((msg: string) => {
    setStatus("error");
    setErrorMessage(msg);
  }, []);

  return {
    status,
    setStatus,
    reportError,
    isMuted,
    micVolume,
    isUserSpeaking,
    isHoldingToSpeak,
    errorMessage,
    liveUserTranscript,
    liveAssistantTranscript,
    activeToolName,
    liveArtifact,
    setLiveArtifact,
    activeArtifact: liveArtifact,
    activeArtifactOverview,
    setActiveArtifactOverview,
    selectedLanguage,
    setLanguage,
    connect,
    disconnect,
    toggleMute,
    startSpeaking,
    stopSpeaking,
    backgroundTask,
    activeTasks,
    sessionCompletedTasks,
    liveArtifactChatId,
    isCameraActive,
    cameraFacingMode,
    cameraError,
    clearCameraError,
    startCamera,
    stopCamera,
    toggleCamera,
    switchCameraFacing,
    attachCameraVideoElement,
    captureDocumentManual,
  };
}
