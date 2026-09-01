"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PCMPlayer } from "@/lib/voice/pcm-player";
import { PCMRecorder } from "@/lib/voice/pcm-recorder";
import {
  type SupportedLanguageCode,
} from "@/lib/agent/chat-config";
import type { VoiceAgentStatus } from "./voice-agent-view";
import type { ToolCallItem } from "./types";
import type { ArtifactPayload } from "./artifact-modal";

export interface LiveTurnData {
  userTranscript: string;
  assistantTranscript: string;
  toolCalls?: ToolCallItem[];
}

export interface UseLiveAgentOptions {
  activeChatId?: string | null;
  defaultLanguage?: SupportedLanguageCode;
  onTurnComplete?: (turn: LiveTurnData) => void;
  onArtifactAction?: (action: unknown) => void;
  onError?: (err: Error) => void;
}

type VoiceSessionConfig = {
  accessToken: string;
  model: string;
  voiceName: string;
  systemInstruction: string;
  tools: unknown[];
};

type VertexFunctionCall = {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
};

type VertexFunctionResponse = {
  id?: string;
  name?: string;
  response: { output: unknown };
};

function mergeTranscript(current: string, incoming: string) {
  const next = incoming.trim();
  if (!next) return current;
  if (!current) return next;
  if (next.startsWith(current)) return next;
  if (current.endsWith(next) || current.includes(next)) return current;

  const limit = Math.min(current.length, next.length);
  for (let overlap = limit; overlap > 0; overlap--) {
    if (
      current.slice(-overlap).toLowerCase() ===
      next.slice(0, overlap).toLowerCase()
    ) {
      return `${current}${next.slice(overlap)}`.trim();
    }
  }
  return `${current} ${next}`.trim();
}

function displayMicError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Microphone access is blocked. Allow it in your browser site settings, then retry.";
  }
  if (name === "NotFoundError")
    return "No microphone was found. Connect or select a microphone, then retry.";
  if (name === "NotReadableError")
    return "Your microphone is busy in another app. Close the other app and retry.";
  return error instanceof Error
    ? error.message
    : "Unable to start the microphone.";
}

export function useLiveAgent(options: UseLiveAgentOptions = {}) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const [status, setStatus] = useState<VoiceAgentStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [liveUserTranscript, setLiveUserTranscript] = useState("");
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState("");
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [liveArtifact, setLiveArtifact] = useState<ArtifactPayload | null>(
    null,
  );
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isHoldingToSpeak, setIsHoldingToSpeak] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguageCode>(options.defaultLanguage || "hi-IN");
  const selectedLanguageRef = useRef<SupportedLanguageCode>(
    options.defaultLanguage || "hi-IN",
  );

  const activeChatIdRef = useRef<string | null>(options.activeChatId || null);
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<PCMRecorder | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const connectedRef = useRef(false);
  const mutedRef = useRef(false);
  const assistantSpeakingRef = useRef(false);
  const playbackActiveRef = useRef(false);
  const userSpeakingRef = useRef(false);
  const isHoldingRef = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const userTranscriptRef = useRef("");
  const assistantTranscriptRef = useRef("");
  const assistantUsesOutputTranscriptRef = useRef(false);
  const toolCallsRef = useRef<ToolCallItem[]>([]);
  const nativeCaptionFinalRef = useRef("");
  /** True once the model signals turnComplete for the current response. */
  const turnCompleteRef = useRef(false);
  /** Native sample rate from the PCMRecorder's AudioContext. */
  const micSampleRateRef = useRef(48000);
  /** Safety timer: if thinking state lasts longer than this, auto-recover. */
  const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeChatIdRef.current = options.activeChatId || null;
  }, [options.activeChatId]);

  const setLanguage = useCallback((lang: SupportedLanguageCode) => {
    selectedLanguageRef.current = lang;
    setSelectedLanguage(lang);
  }, []);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = null;
  }, []);

  const persistCurrentTurn = useCallback(async () => {
    if (flushingRef.current) return;
    // Pick the longer (more complete) transcript between Vertex AI's
    // inputTranscription and the browser's Web Speech API.  Vertex often
    // returns garbled romanised fragments for Hindi/regional speech, while
    // the browser's recognition is more accurate for Indic scripts.
    const vertexUser = userTranscriptRef.current.trim();
    const browserUser = nativeCaptionFinalRef.current.trim();
    const userTranscript =
      vertexUser.length >= browserUser.length ? vertexUser : browserUser;
    let assistantTranscript = assistantTranscriptRef.current.trim();
    const toolCalls = [...toolCallsRef.current];

    // If tools were called but the assistant transcript is empty or very
    // short (outputTranscription may not have arrived yet), build a
    // human-readable summary so the text chat view isn't blank.
    if (toolCalls.length > 0 && assistantTranscript.length < 20) {
      const summaries = toolCalls
        .filter((tc) => tc.status === "completed")
        .map((tc) => {
          const r = tc.result as any;
          if (r?.isArtifact) return `[${r.title || tc.toolName}]`;
          return `[${tc.toolName}]`;
        });
      if (summaries.length > 0) {
        assistantTranscript = assistantTranscript
          ? `${assistantTranscript}\n\n${summaries.join(", ")}`
          : summaries.join(", ");
      }
    }

    // Do not invent placeholder data. A turn is useful only when we have
    // an actual user transcript.
    if (!userTranscript) return;
    flushingRef.current = true;
    userTranscriptRef.current = "";
    nativeCaptionFinalRef.current = "";
    assistantTranscriptRef.current = "";
    assistantUsesOutputTranscriptRef.current = false;
    toolCallsRef.current = [];

    try {
      optionsRef.current.onTurnComplete?.({
        userTranscript,
        assistantTranscript,
        toolCalls,
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
          }),
        });
        if (!response.ok) throw new Error("The voice turn could not be saved.");
      }
    } catch (error) {
      console.error("[voice] persistence failed", error);
      optionsRef.current.onError?.(
        error instanceof Error ? error : new Error("Voice persistence failed"),
      );
    } finally {
      flushingRef.current = false;
    }
  }, []);

  const schedulePersistence = useCallback(() => {
    clearFlushTimer();
    // Output transcription can arrive well after turnComplete; Vertex sends
    // outputTranscription fragments over several seconds as the audio plays.
    // Wait long enough for ALL fragments to arrive before persisting to DB.
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void persistCurrentTurn();
    }, 2500);
  }, [clearFlushTimer, persistCurrentTurn]);

  // ── Web Speech API (SpeechRecognition) REMOVED ──
  // Running SpeechRecognition simultaneously with getUserMedia causes the
  // mobile OS to fight over the microphone hardware, producing audio
  // dropouts and corrupted PCM frames.  Gemini Live's own
  // inputTranscription / interimInputTranscription is used for captions
  // instead — it's more accurate and doesn't require a second mic stream.

  const clearThinkingTimeout = useCallback(() => {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
  }, []);

  const startSpeaking = useCallback(() => {
    if (mutedRef.current || !connectedRef.current) return;

    // ── Bulletproof turn-boundary cleanup ──
    // 1. Kill any residual audio from the previous AI response immediately.
    playerRef.current?.flush();

    // 2. Forcefully reset assistant-speaking state so we don't block.
    assistantSpeakingRef.current = false;
    playbackActiveRef.current = false;

    // 3. Persist the previous turn NOW if there is unsaved data, and
    //    cancel any pending delayed persistence timer.
    clearFlushTimer();
    clearThinkingTimeout();
    if (
      userTranscriptRef.current.trim() ||
      nativeCaptionFinalRef.current.trim() ||
      assistantTranscriptRef.current.trim()
    ) {
      void persistCurrentTurn();
    }

    // 4. Reset ALL transcript state for the new turn.
    userTranscriptRef.current = "";
    nativeCaptionFinalRef.current = "";
    assistantTranscriptRef.current = "";
    assistantUsesOutputTranscriptRef.current = false;
    toolCallsRef.current = [];
    turnCompleteRef.current = false;
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
    //    With automatic VAD disabled, this is required for manual endpointing.
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        realtimeInput: { activityStart: {} },
      }));
    }

    setStatus("listening");
  }, [clearFlushTimer, clearThinkingTimeout, persistCurrentTurn]);

  const stopSpeaking = useCallback(() => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    setIsHoldingToSpeak(false);
    userSpeakingRef.current = false;
    setIsUserSpeaking(false);

    // Flush any partial audio buffer still sitting in the AudioWorklet
    // so we don't lose the tail end of the user's speech.
    recorderRef.current?.flush();

    const socket = socketRef.current;
    // Allow a brief delay for the flushed chunk to post its final data
    // to the WebSocket (the worklet runs on a different thread).
    setTimeout(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        // Signal Gemini that the user has finished speaking.
        // Audio was already streamed in real-time via onChunk, so we
        // only need to send the activityEnd "go" signal here.
        socket.send(
          JSON.stringify({
            realtimeInput: { activityEnd: {} },
          }),
        );
      }
      if (connectedRef.current && !assistantSpeakingRef.current) {
        setStatus("thinking");
        // Safety net: if thinking state persists for more than 20 seconds
        // without any model response, auto-recover to ready state.
        clearThinkingTimeout();
        thinkingTimeoutRef.current = setTimeout(() => {
          thinkingTimeoutRef.current = null;
          if (!assistantSpeakingRef.current && !isHoldingRef.current && connectedRef.current) {
            console.warn("[voice] thinking timeout — auto-recovering to ready state");
            setStatus("ready");
          }
        }, 20_000);
      }
    }, 100); // 100ms: enough for worklet flush to post its final chunk
  }, [clearThinkingTimeout]);

  const setAssistantSpeaking = useCallback(
    (speaking: boolean) => {
      if (speaking) {
        // ── IDEMPOTENT: if already speaking, do nothing. ──
        // This prevents the mic from toggling on/off on every audio chunk,
        // and stops hold-to-speak state from being reset mid-recording.
        if (assistantSpeakingRef.current) return;

        assistantSpeakingRef.current = true;
        recorderRef.current?.setMuted(true);
        // The next user utterance starts with a clean live caption.
        nativeCaptionFinalRef.current = "";
        setLiveUserTranscript("");
        setMicVolume(0);
        userSpeakingRef.current = false;
        setIsUserSpeaking(false);
        isHoldingRef.current = false;
        setIsHoldingToSpeak(false);
        setStatus("speaking");
      } else {
        if (!assistantSpeakingRef.current) return; // already not speaking
        assistantSpeakingRef.current = false;
        recorderRef.current?.setMuted(mutedRef.current);
        if (connectedRef.current && !mutedRef.current) {
          // Only transition to idle if the model has finished generating.
          if (turnCompleteRef.current) {
            setStatus("ready");
          }
        }
      }
    },
    [],
  );

  const handleAudioLevel = useCallback((rms: number) => {
    if (
      mutedRef.current ||
      assistantSpeakingRef.current ||
      !connectedRef.current
    )
      return;
    // Volume level is provided directly via onVolume for visual feedback
  }, []);

  const disconnect = useCallback(() => {
    connectedRef.current = false;
    assistantSpeakingRef.current = false;
    playbackActiveRef.current = false;
    isHoldingRef.current = false;
    setIsHoldingToSpeak(false);
    clearFlushTimer();
    clearThinkingTimeout();
    if (
      nativeCaptionFinalRef.current.trim() ||
      userTranscriptRef.current.trim()
    )
      void persistCurrentTurn();

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
    setMicVolume(0);
    setStatus("disconnected");
    setLiveUserTranscript("");
    setLiveAssistantTranscript("");
    setActiveToolName(null);
  }, [clearFlushTimer, clearThinkingTimeout, persistCurrentTurn]);

  useEffect(() => disconnect, [disconnect]);

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
    },
    [],
  );

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
              // Player started playing — ensure we are in speaking state
              setAssistantSpeaking(true);
            } else {
              // Player finished playing ALL audio — NOW it's safe to leave
              // speaking state.  But ONLY do so when the model has also
              // signalled turnComplete. Otherwise we'd flicker to "ready"
              // during inter-chunk gaps from the Vertex stream.
              if (assistantSpeakingRef.current && turnCompleteRef.current) {
                setAssistantSpeaking(false);
              }
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
                // ── Manual endpointing: disable automatic VAD ──
                // With this disabled, Gemini will NEVER interrupt the user
                // during natural pauses. It will ONLY respond after we
                // explicitly send activityEnd on button release.
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
                  // ── REAL-TIME STREAMING ──
                  // Send each audio chunk to Gemini immediately as it arrives
                  // from the AudioWorklet.  This gives Gemini a clean,
                  // continuous audio stream instead of a burst-dump which
                  // confuses its audio decoder and produces garbage.
                  if (
                    isHoldingRef.current &&
                    !mutedRef.current &&
                    !assistantSpeakingRef.current &&
                    socketRef.current &&
                    socketRef.current.readyState === WebSocket.OPEN
                  ) {
                    const rate = micSampleRateRef.current;
                    socketRef.current.send(
                      JSON.stringify({
                        realtimeInput: {
                          mediaChunks: [
                            {
                              mimeType: `audio/pcm;rate=${rate}`,
                              data,
                            },
                          ],
                        },
                      }),
                    );
                  }
                },
                onVolume: setMicVolume,
                onAudioLevel: handleAudioLevel,
                onError: (error) => {
                  setStatus("error");
                  setErrorMessage(displayMicError(error));
                },
              });
              recorderRef.current = recorder;
              if (!(await recorder.start())) return;
              // Store the native sample rate for MIME type in audio chunks.
              micSampleRateRef.current = recorder.getNativeSampleRate();
              console.log("[voice] mic native sample rate:", micSampleRateRef.current);
              console.log("[voice] mic input info:", recorder.getInputInfo());
              setStatus("ready");
              return;
            }

            const serverContent = message.serverContent;

            // ── Any model response clears the thinking timeout ──
            if (serverContent) {
              clearThinkingTimeout();
            }

            // ── Interim input transcription (diagnostic) ──
            if (serverContent?.interimInputTranscription?.text) {
              console.log("[voice] INTERIM user:", serverContent.interimInputTranscription.text);
            }

            if (serverContent?.inputTranscription?.text) {
              const vertexText = serverContent.inputTranscription.text.trim();
              console.log("[voice] FINAL user:", vertexText);
              if (vertexText) {
                // Vertex AI's Gemini-powered transcription is far more accurate
                // than the browser's Web Speech API. ALWAYS use it to replace
                // whatever the browser captured, even if native captions are on.
                userTranscriptRef.current = mergeTranscript(
                  userTranscriptRef.current,
                  vertexText,
                );
                setLiveUserTranscript(userTranscriptRef.current);
              }
            }
            if (serverContent?.outputTranscription?.text) {
              // Don't call setAssistantSpeaking(true) here — the PCMPlayer's
              // onPlaybackStateChange(true) is the single source of truth.
              // Just update transcript text.
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
                // If the user has already started a new turn (isHoldingRef),
                // discard stale audio from the previous AI response.
                if (isHoldingRef.current) continue;
                // playChunk triggers onPlaybackStateChange(true) which calls
                // setAssistantSpeaking(true) exactly once (idempotent).
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
              // After interrupt, player's onPlaybackStateChange(false) will fire
              // and handle the state transition to ready. Don't force it here.
            }
            if (serverContent?.turnComplete) {
              // turnComplete means the MODEL is done generating audio, but the
              // PCMPlayer may still be playing queued chunks.  Set the flag so
              // the player's onPlaybackStateChange(false) knows it's safe to
              // transition to idle once the audio queue drains.
              turnCompleteRef.current = true;
              schedulePersistence();
              // If the player has ALREADY finished (no active nodes), we need
              // to transition immediately since the callback already fired.
              if (!playbackActiveRef.current && assistantSpeakingRef.current) {
                setAssistantSpeaking(false);
              }
            }
            const calls: VertexFunctionCall[] = [
              ...((message.toolCall?.functionCalls ||
                []) as VertexFunctionCall[]),
              ...((serverContent?.modelTurn?.parts || [])
                .filter((p: any) => p.functionCall)
                .map((p: any) => p.functionCall) as VertexFunctionCall[]),
            ];
            if (calls.length) {
              await handleToolCalls(calls, socket);
            }
          } catch (error) {
            console.error("[voice] message processing failed", error);
          }
        };

        socket.onerror = () => {
          if (!connectedRef.current) return;
          setStatus("error");
          setErrorMessage(
            "The secure Vertex voice connection could not be established. Please retry.",
          );
        };
        socket.onclose = () => {
          if (!connectedRef.current) return;
          connectedRef.current = false;
          assistantSpeakingRef.current = false;
          playbackActiveRef.current = false;
          recorderRef.current?.stop();
          recorderRef.current = null;
          playerRef.current?.stop();
          playerRef.current = null;
          setStatus("error");
          setErrorMessage(
            "The voice connection ended unexpectedly. Retry to reconnect.",
          );
        };
      } catch (error) {
        connectedRef.current = false;
        setStatus("error");
        setErrorMessage(displayMicError(error));
        optionsRef.current.onError?.(
          error instanceof Error ? error : new Error("Voice connection failed"),
        );
      }
    },
    [
      disconnect,
      handleAudioLevel,
      handleToolCalls,
      schedulePersistence,
      setAssistantSpeaking,
      clearThinkingTimeout,
    ],
  );

  const toggleMute = useCallback(() => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    recorderRef.current?.setMuted(nextMuted || assistantSpeakingRef.current);
    if (nextMuted) {
      isHoldingRef.current = false;
      setIsHoldingToSpeak(false);
      userSpeakingRef.current = false;
      setIsUserSpeaking(false);
      setMicVolume(0);
    } else if (connectedRef.current && !assistantSpeakingRef.current) {
      setStatus("ready");
    }
  }, []);

  const reportError = useCallback((message: string) => {
    connectedRef.current = false;
    setStatus("error");
    setErrorMessage(message);
  }, []);

  return {
    status,
    errorMessage,
    isMuted,
    micVolume,
    isUserSpeaking,
    isHoldingToSpeak,
    selectedLanguage,
    setLanguage,
    startSpeaking,
    stopSpeaking,
    toggleMute,
    connect,
    disconnect,
    liveUserTranscript,
    liveAssistantTranscript,
    activeToolName,
    liveArtifact,
    setLiveArtifact,
    setStatus,
    reportError,
  };
}
