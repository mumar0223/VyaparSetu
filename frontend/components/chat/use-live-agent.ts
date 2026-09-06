"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PCMRecorder } from "@/lib/voice/pcm-recorder";
import { PCMPlayer } from "@/lib/voice/pcm-player";
import type { SupportedLanguageCode } from "@/lib/agent/chat-config";
import type { ArtifactPayload } from "./artifact-modal";
import type { ToolCallItem } from "./types";

const GEMINI_LIVE_INPUT_SAMPLE_RATE = 16000;

export interface LiveAgentOptions {
  activeChatId?: string | null;
  onTurnComplete?: (turn: {
    userTranscript: string;
    assistantTranscript: string;
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
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguageCode>("hi-IN");

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

      // Ensure userTranscript is not blank if the assistant responded
      if (!userTranscript && (assistantTranscript || toolCalls.length > 0)) {
        userTranscript = "Voice query";
      }

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

    // 3. Persist previous turn NOW before wiping state for the new turn.
    clearThinkingTimeout();
    turnStartTimeRef.current = 0;
    flushAndPersistActiveTurn();

    // 4. Reset UI captions for new turn.
    setLiveUserTranscript("");
    setLiveAssistantTranscript("");

    // 5. Begin new recording turn.
    void recorderRef.current?.resume();
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

  const handleToolCalls = useCallback(
    async (calls: VertexFunctionCall[], socket: WebSocket) => {
      const functionResponses: VertexFunctionResponse[] = [];
      for (const call of calls) {
        setActiveToolName(call.name);
        try {
          const response = await fetch("/api/voice/execute-tool", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolName: call.name,
              args: call.args || {},
              conversationId: activeChatIdRef.current || undefined,
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

          // If tool produced a staged artifact, publish to live state
          if ((result as any)?.isArtifact && (result as any)?.artifactType) {
            const art: ArtifactPayload = {
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
            response: { output: result },
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
    [],
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
  }, [clearThinkingTimeout, flushAndPersistActiveTurn]);

  useEffect(() => disconnect, [disconnect]);

  const connect = useCallback(
    async (conversationIdOverride?: string) => {
      if (conversationIdOverride)
        activeChatIdRef.current = conversationIdOverride;
      disconnect();
      setStatus("connecting");
      setErrorMessage(null);
      connectedRef.current = true;
      mutedRef.current = false;
      assistantSpeakingRef.current = false;
      playbackActiveRef.current = false;
      isHoldingRef.current = false;
      setIsHoldingToSpeak(false);
      setIsMuted(false);

      try {
        const response = await fetch("/api/voice/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeChatIdRef.current || undefined,
            language: selectedLanguageRef.current,
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
              console.log(
                "[voice] Gemini input sample rate:",
                recorder.getNativeSampleRate(),
              );
              console.log("[voice] mic input info:", recorder.getInputInfo());
              setStatus("ready");
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
      clearThinkingTimeout,
      disconnect,
      flushAndPersistActiveTurn,
      handleAudioLevel,
      handleMicVolume,
      handleToolCalls,
      schedulePersistence,
      setAssistantSpeaking,
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

  const downloadDebugAudio = useCallback(() => {
    recorderRef.current?.downloadDebugWav();
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
    selectedLanguage,
    setLanguage,
    connect,
    disconnect,
    toggleMute,
    startSpeaking,
    stopSpeaking,
    downloadDebugAudio,
  };
}
