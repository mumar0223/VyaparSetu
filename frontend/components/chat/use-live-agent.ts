"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PCMRecorder } from "@/lib/voice/pcm-recorder";
import { PCMPlayer } from "@/lib/voice/pcm-player";
import { CameraManager, type BurstCaptureResult } from "@/lib/voice/camera-manager";
import { uploadFiles } from "@/lib/uploadthing";
import type { SupportedLanguageCode } from "@/lib/agent/chat-config";
import type { ArtifactPayload } from "./artifact-modal";
import type { ToolCallItem } from "./types";

const GEMINI_LIVE_INPUT_SAMPLE_RATE = 16000;

export interface VoiceAttachedDocument {
  id: string;
  name: string;
  size: number;
  type: "image" | "file";
  mimeType: string;
  previewUrl?: string;
  persistentUrl?: string;
  blob?: Blob;
  status: "uploading" | "completed" | "error";
  progress: number;
}

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
  projectId?: string;
  location?: string;
  model: string;
  wsUrl?: string;
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
  const sendCameraPreviewFrameRef = useRef<(() => void) | null>(null);
  const pendingAutoStartCameraRef = useRef(false);

  const [attachedDocuments, setAttachedDocuments] = useState<VoiceAttachedDocument[]>([]);
  const attachedDocumentsRef = useRef<VoiceAttachedDocument[]>([]);
  useEffect(() => {
    attachedDocumentsRef.current = attachedDocuments;
  }, [attachedDocuments]);

  const clearCameraError = useCallback(() => {
    setCameraError(null);
  }, []);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);

  const connectedRef = useRef(false);
  const setupCompleteRef = useRef(false);
  const micInitPromiseRef = useRef<Promise<boolean> | null>(null);
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
  const turnFilesRef = useRef<string[]>([]);
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
      files?: string[];
      toolCalls: ToolCallItem[];
    }) => {
      let { userTranscript, assistantTranscript, files, toolCalls } = snapshot;
      userTranscript = userTranscript.trim();
      assistantTranscript = assistantTranscript.trim();

      // We need at least userTranscript or assistantTranscript or toolCalls or files to persist a turn
      if (!userTranscript && !assistantTranscript && toolCalls.length === 0 && (!files || files.length === 0)) return;

      const turnDuration = turnStartTimeRef.current
        ? Math.max(1, Math.round((Date.now() - turnStartTimeRef.current) / 1000))
        : 1;
      const thinkingPayload = JSON.stringify({ durationSeconds: turnDuration });

      console.log("[voice] Persisting turn snapshot to DB & chat list:", {
        userTranscript,
        assistantTranscript,
        filesCount: files?.length || 0,
        toolsCount: toolCalls.length,
        thoughtDurationSeconds: turnDuration,
      });

      try {
        optionsRef.current.onTurnComplete?.({
          userTranscript,
          assistantTranscript,
          files,
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
              files,
              toolCalls,
              thinking: thinkingPayload,
            }),
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error || "The voice turn could not be saved.");
          }
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

  const flushAndPersistActiveTurn = useCallback(async () => {
    clearFlushTimer();
    if (isExecutingToolRef.current) return;
    const vertexUser = userTranscriptRef.current.trim();
    const browserUser = nativeCaptionFinalRef.current.trim();
    const userTranscript =
      vertexUser.length >= browserUser.length ? vertexUser : browserUser;
    const assistantTranscript = assistantTranscriptRef.current.trim();
    const toolCalls = [...toolCallsRef.current];
    const files = [...turnFilesRef.current];

    if (!userTranscript && !assistantTranscript && toolCalls.length === 0 && files.length === 0) return;

    // Reset active refs immediately for the next turn
    userTranscriptRef.current = "";
    nativeCaptionFinalRef.current = "";
    assistantTranscriptRef.current = "";
    assistantUsesOutputTranscriptRef.current = false;
    toolCallsRef.current = [];
    turnFilesRef.current = [];
    turnCompleteRef.current = false;
    turnTaskTriggeredRef.current = false;
    isExecutingToolRef.current = false;

    // Safely persist with the captured immutable strings (no synthetic fallback text)
    await persistTurnSnapshot({
      userTranscript: userTranscript.trim(),
      assistantTranscript,
      files,
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
      toolCallsRef.current.length > 0 ||
      turnFilesRef.current.length > 0;

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
    if (recorderRef.current) {
      recorderRef.current.setMuted(false);
      void recorderRef.current.resume();
      recorderRef.current.startTurn();
    }
    void playerRef.current?.resume();
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
      // Immediately send current camera frame if camera is active so Gemini gets vision context with speech
      sendCameraPreviewFrameRef.current?.();
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

  const startMicrophone = useCallback(async (): Promise<boolean> => {
    if (recorderRef.current) return true;
    if (micInitPromiseRef.current) return micInitPromiseRef.current;

    const promise = (async () => {
      try {
        const recorder = new PCMRecorder({
          onChunk: (data) => {
            if (
              setupCompleteRef.current &&
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
        const started = await recorder.start();
        if (!started) return false;
        if (mutedRef.current) {
          recorder.setMuted(true);
        }
        console.log(
          "[voice] Gemini input sample rate:",
          recorder.getNativeSampleRate(),
        );
        console.log("[voice] mic input info:", recorder.getInputInfo());
        return true;
      } catch (err: any) {
        console.error("[voice] mic start failed", err);
        setStatus("error");
        setErrorMessage(displayMicError(err));
        return false;
      } finally {
        micInitPromiseRef.current = null;
      }
    })();

    micInitPromiseRef.current = promise;
    return promise;
  }, [handleAudioLevel, handleMicVolume]);

  const stopCameraPreviewLoop = useCallback(() => {
    if (cameraPreviewIntervalRef.current) {
      clearInterval(cameraPreviewIntervalRef.current);
      cameraPreviewIntervalRef.current = null;
    }
  }, []);

  const sendCameraPreviewFrame = useCallback(() => {
    const socket = socketRef.current;
    const camera = cameraManagerRef.current;
    if (
      !camera ||
      !camera.isActive() ||
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !connectedRef.current ||
      !isHoldingRef.current || // STRICT: Only stream camera frames when user is speaking!
      assistantSpeakingRef.current || // Never stream when AI is speaking
      thinkingTimeoutRef.current !== null // Never stream when AI is thinking/generating
    ) {
      return;
    }

    const frameBase64 = camera.capturePreviewFrameBase64(768, 0.65);
    if (frameBase64) {
      try {
        socket.send(
          JSON.stringify({
            clientContent: {
              turns: [
                {
                  role: "user",
                  parts: [
                    {
                      inlineData: {
                        mimeType: "image/jpeg",
                        data: frameBase64,
                      },
                    },
                  ],
                },
              ],
              turnComplete: false,
            },
          }),
        );
      } catch (e) {
        console.warn("[voice] preview frame send error", e);
      }
    }
  }, []);

  useEffect(() => {
    sendCameraPreviewFrameRef.current = sendCameraPreviewFrame;
  }, [sendCameraPreviewFrame]);

  const startCameraPreviewLoop = useCallback(() => {
    stopCameraPreviewLoop();
    cameraPreviewIntervalRef.current = setInterval(() => {
      sendCameraPreviewFrame();
    }, 1500);
  }, [stopCameraPreviewLoop, sendCameraPreviewFrame]);

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

  const attachDocuments = useCallback(async (filesInput: FileList | File[]) => {
    const rawFiles = Array.from(filesInput);
    if (!rawFiles.length) return;

    const currentCount = attachedDocumentsRef.current.length;
    if (currentCount >= 5) return;

    const availableSlots = 5 - currentCount;
    const filesToProcess = rawFiles.slice(0, availableSlots);

    const newDocs: VoiceAttachedDocument[] = filesToProcess.map((f, i) => {
      const isImg = f.type.startsWith("image/");
      return {
        id: `att_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        size: f.size,
        type: isImg ? "image" : "file",
        mimeType: f.type || "application/octet-stream",
        previewUrl: isImg ? URL.createObjectURL(f) : undefined,
        blob: f,
        status: "uploading",
        progress: 25,
      };
    });

    setAttachedDocuments((prev) => [...prev, ...newDocs]);

    // ── Concurrent Track 1: Stream images into Gemini Live WebSocket immediately ──
    for (const f of filesToProcess) {
      if (f.type.startsWith("image/")) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const resultStr = reader.result as string;
            const base64 = resultStr.split(",")[1];
            const socket = socketRef.current;
            if (socket && socket.readyState === WebSocket.OPEN && base64) {
              socket.send(
                JSON.stringify({
                  clientContent: {
                    turns: [
                      {
                        role: "user",
                        parts: [
                          {
                            inlineData: {
                              mimeType: f.type || "image/jpeg",
                              data: base64,
                            },
                          },
                        ],
                      },
                    ],
                    turnComplete: false,
                  },
                }),
              );
            }
          };
          reader.readAsDataURL(f);
        } catch (e) {
          console.warn("[voice] Error streaming media chunk:", e);
        }
      }
    }

    // Proactively inform Gemini Live to acknowledge out loud
    // ── Upload to persistent storage first, then persist user turn and trigger Gemini Live response ──
    try {
      const uploadRes = await uploadFiles("chatAttachmentUploader", {
        files: filesToProcess,
        onUploadProgress: ({ file, progress }) => {
          const fileName = typeof file === "string" ? file : (file as any)?.name;
          setAttachedDocuments((prev) =>
            prev.map((doc) =>
              doc.name === fileName ? { ...doc, progress: Math.min(progress, 95) } : doc,
            ),
          );
        },
      });

      const uploadedSerializedFiles: string[] = [];

      setAttachedDocuments((prev) =>
        prev.map((doc) => {
          const matched = (uploadRes as any[])?.find((r) => r.name === doc.name);
          if (matched) {
            const persistentUrl = matched.ufsUrl || matched.url;
            const mimeType = doc.mimeType || "";
            const isImg = mimeType.startsWith("image/") || /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(doc.name);
            const isPdf = mimeType === "application/pdf" || doc.name.toLowerCase().endsWith(".pdf");
            const isSheet = mimeType.includes("sheet") || mimeType.includes("csv") || /\.(xlsx|xls|csv)$/i.test(doc.name);
            const type = isImg ? "IMAGE" : isPdf ? "PDF" : isSheet ? "SHEET" : "DOCUMENT";

            const filePayload = JSON.stringify({
              url: persistentUrl,
              name: doc.name,
              type,
              mimeType,
              size: doc.size,
            });

            uploadedSerializedFiles.push(filePayload);
            if (!turnFilesRef.current.includes(filePayload)) {
              turnFilesRef.current.push(filePayload);
            }
            return {
              ...doc,
              persistentUrl,
              status: "completed",
              progress: 100,
            };
          }
          return { ...doc, status: "completed", progress: 100 };
        }),
      );

      // Persist the user message with the uploaded files BEFORE assistant response
      if (uploadedSerializedFiles.length > 0) {
        void persistTurnSnapshot({
          userTranscript: "",
          assistantTranscript: "",
          files: uploadedSerializedFiles,
          toolCalls: [],
        });
      }

      // Then inform Gemini Live to acknowledge receipt orally
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            clientContent: {
              turns: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `The user has just uploaded ${filesToProcess.length} document(s): "${filesToProcess.map((f) => f.name).join(", ")}". Speak out loud to acknowledge receipt in a short friendly spoken sentence, and ask how they would like to proceed with the document(s).`,
                    },
                  ],
                },
              ],
              turnComplete: true,
            },
          }),
        );
      }
    } catch (uploadErr) {
      console.warn("[voice] Background upload error:", uploadErr);
      setAttachedDocuments((prev) =>
        prev.map((doc) => ({ ...doc, status: "completed", progress: 100 })),
      );
    }
  }, []);

  const removeAttachedDocument = useCallback((id?: string) => {
    setAttachedDocuments((prev) => {
      if (!id) {
        const last = prev[prev.length - 1];
        if (last?.previewUrl) URL.revokeObjectURL(last.previewUrl);
        return prev.slice(0, -1);
      }
      const target = prev.find((d) => d.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((d) => d.id !== id);
    });
  }, []);

  const attachCameraVideoElement = useCallback((videoEl: HTMLVideoElement | null) => {
    cameraManagerRef.current?.attachToVideoElement(videoEl);
  }, []);

  const launchBackgroundScreenTask = useCallback(
    (
      args: any,
      audioBase64?: string,
      imageBlob?: Blob,
      isCameraActive?: boolean,
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
            ? "Analyzing document..."
            : `Starting task for: "${args?.query || "on-screen action"}"`,
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
              formData.append("isCameraActive", String(isCameraActive ?? true));

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
                  isCameraActive: Boolean(isCameraActive),
                }),
              });
            }

            if (!res.ok || !res.body) {
              const errText = await res.text().catch(() => "");
              console.error(`[voice/subagent-stream failed HTTP ${res.status}]:`, errText);
              throw new Error(`Subagent stream connection failed: ${res.status} ${errText}`);
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
                    if (data.url) {
                      capturedImageUrl = data.url;
                      if (!turnFilesRef.current.includes(data.url)) {
                        turnFilesRef.current.push(data.url);
                      }
                    }
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
                    if (data.savedImageUrl) {
                      capturedImageUrl = data.savedImageUrl;
                      if (!turnFilesRef.current.includes(data.savedImageUrl)) {
                        turnFilesRef.current.push(data.savedImageUrl);
                      }
                    }
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
      if (!burst || !burst.blob) return;

      const query =
        overrideQuery ||
        userTranscriptRef.current.trim() ||
        nativeCaptionFinalRef.current.trim() ||
        "Inspect and process captured document";

      const subResult = await launchBackgroundScreenTask(
        { query },
        undefined,
        burst.blob,
      );

      const elapsedSeconds =
        subResult.thoughtDurationSeconds ||
        Math.max(1, Math.round((Date.now() - captureStartTime) / 1000));

      // If manual capture triggered outside of voice tool call, persist the result
      void persistTurnSnapshot({
        userTranscript: query,
        assistantTranscript: subResult.finalAssistant,
        files: subResult.savedImageUrl ? [subResult.savedImageUrl] : undefined,
        toolCalls:
          subResult.toolCalls.length > 0 ? subResult.toolCalls : [],
      });
    },
    [launchBackgroundScreenTask, persistTurnSnapshot],
  );

  const handleToolCalls = useCallback(
    async (calls: VertexFunctionCall[], socket: WebSocket) => {
      const functionResponses: VertexFunctionResponse[] = [];
      const audioBase64 = recorderRef.current?.getLastTurnWavBase64() || undefined;

      for (const call of calls) {
        setActiveToolName(call.name);

        if (call.name === "triggerScreenAction" || call.name === "captureDocument") {
          turnTaskTriggeredRef.current = true;
          const isCameraOn = Boolean(
            cameraManagerRef.current && cameraManagerRef.current.isActive()
          );

          let imageBlob: Blob | undefined = undefined;

          // Directly capture camera frame if camera is open and the task is document/camera related
          if (isCameraOn && cameraManagerRef.current) {
            const queryStr = typeof call.args?.query === "string" ? call.args.query : "";
            const actionTypeStr = typeof call.args?.actionType === "string" ? call.args.actionType : "";

            const isExplicitCapture = call.name === "captureDocument";
            const isDocAction =
              actionTypeStr === "document" ||
              actionTypeStr === "capture" ||
              actionTypeStr === "ocr" ||
              actionTypeStr === "paper";

            const isDocQuery =
              /camera|document|paper|capture|showing|passbook|receipt|bill|invoice|aadhaar|pan|scan|inspect|digitize|photo|frame|kalam|pen|dastaavez|praroop|dekho|ye\s*form|iska\s*form/i.test(
                queryStr,
              );

            const isMandiOnly =
              /mandi|rate|bhav|price|apmc|commodity/i.test(queryStr) && !isDocQuery;

            // Only capture camera if it is explicitly a document/camera task, NOT for mandi or pure search
            if (isExplicitCapture || isDocAction || isDocQuery || (!isMandiOnly && !actionTypeStr)) {
              try {
                const burst = await cameraManagerRef.current.captureBestFrameBlob();
                if (burst?.blob) {
                  imageBlob = burst.blob;
                }
              } catch (e) {
                console.warn("[voice] Error capturing camera frame for screen task:", e);
              }
            }
          }

          const subResult = await launchBackgroundScreenTask(
            call.args,
            audioBase64,
            imageBlob,
            isCameraOn,
          );

          if (
            subResult.savedImageUrl &&
            !turnFilesRef.current.includes(subResult.savedImageUrl)
          ) {
            turnFilesRef.current.push(subResult.savedImageUrl);
          }

          // Push real sub-agent tool calls (including captureDocument, stageForm, webSearch, etc.)
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
                  "Screen action and vision processing completed successfully. Speak the oral summary naturally to the user now.",
              },
            },
          });
        } else if (call.name === "checkScreenActionStatus") {
          // Query live background task state in < 5ms
          const cur = backgroundTaskRef.current;
          const isAnyDocUploading = attachedDocumentsRef.current.some((d) => d.status === "uploading");
          const firstUploading = attachedDocumentsRef.current.find((d) => d.status === "uploading");
          const result = {
            status: isAnyDocUploading ? "uploading" : cur.status,
            activeTool: isAnyDocUploading ? "document_upload" : (cur.activeTool || "none"),
            description: isAnyDocUploading
              ? `Uploading document ${firstUploading?.name} (${firstUploading?.progress}%)`
              : (cur.description || (cur.status === "completed" ? "Completed on screen" : "No active task")),
            spokenHint: isAnyDocUploading
              ? "Aapka document upload ho raha hai, bas thoda sa intezar kijiye."
              : (cur.spokenHint || (cur.status === "completed" ? "Form screen par taiyar ho chuka hai, aap ise dekh sakte hain." : "Abhi koi screen action active nahi hai.")),
            title: cur.artifact?.title || firstUploading?.name,
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
      isExecutingToolRef.current = false;
      if (socket.readyState === WebSocket.OPEN && functionResponses.length) {
        socket.send(JSON.stringify({ toolResponse: { functionResponses } }));
      }
    },
    [launchBackgroundScreenTask],
  );

  const disconnect = useCallback(async () => {
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
    await flushAndPersistActiveTurn();

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
    setupCompleteRef.current = false;
    micInitPromiseRef.current = null;
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

  useEffect(() => {
    return () => {
      void disconnect();
    };
  }, [disconnect]);

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
      clearThinkingTimeout();
      flushAndPersistActiveTurn();

      // Cleanly terminate any prior websocket without destroying the pre-warmed active microphone!
      const prevSocket = socketRef.current;
      socketRef.current = null;
      if (prevSocket) {
        prevSocket.onopen = null;
        prevSocket.onmessage = null;
        prevSocket.onerror = null;
        prevSocket.onclose = null;
        if (
          prevSocket.readyState === WebSocket.OPEN ||
          prevSocket.readyState === WebSocket.CONNECTING
        ) {
          prevSocket.close();
        }
      }

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
      setupCompleteRef.current = false;

      // Warm up microphone in parallel with session negotiation if not already active
      if (!recorderRef.current?.getIsRecording()) {
        void startMicrophone();
      }

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

        const wsHost = session.location ? `${session.location}-aiplatform.googleapis.com` : "us-central1-aiplatform.googleapis.com";
        const wsUrl =
          session.wsUrl ||
          `wss://${wsHost}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${session.accessToken}`;
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
                  mediaResolution: "MEDIA_RESOLUTION_LOW",
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
              setupCompleteRef.current = true;
              const micReady = await startMicrophone();
              if (!micReady) return;
              if (mutedRef.current) {
                recorderRef.current?.setMuted(true);
              }
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
                if (isHoldingRef.current) continue;
                playerRef.current?.playChunk(part.inlineData.data);
              }
              if (part.text && !assistantUsesOutputTranscriptRef.current) {
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
              void handleToolCalls(calls, socket);
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
                }
                // If playbackActiveRef.current is true, assistant is actively speaking.
                // Do not schedule a premature 1500ms flush that truncates or clears turnFiles early!
                // onPlaybackStateChange(false) will cleanly flush and persist when speech ends.
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

        socket.onclose = (event) => {
          console.warn("[voice] WebSocket closed:", event.code, event.reason);
          clearThinkingTimeout();
          if (connectedRef.current) {
            setStatus("disconnected");
            if (event.code !== 1000) {
              setErrorMessage(
                `Voice session disconnected (${event.code}): ${event.reason || "Connection ended"}`,
              );
            }
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
      startMicrophone,
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
    startMicrophone,
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
    attachedDocuments,
    attachedDocument: attachedDocuments[0] || null,
    attachDocuments,
    attachDocument: (file: File) => attachDocuments([file]),
    removeAttachedDocument,
  };
}
