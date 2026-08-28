"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PCMPlayer } from "@/lib/voice/pcm-player";
import { downsampleBuffer, floatTo16BitPCMBase64 } from "@/lib/voice/audio-utils";
import type { VoiceAgentStatus } from "./voice-agent-view";
import type { ToolCallItem } from "./types";

export interface LiveTurnData {
  userTranscript: string;
  assistantTranscript: string;
  toolCalls?: ToolCallItem[];
}

export interface UseLiveAgentOptions {
  activeChatId?: string | null;
  onTurnComplete?: (turn: LiveTurnData) => void;
  onArtifactAction?: (action: any) => void;
  onError?: (err: Error) => void;
}

export function useLiveAgent(options: UseLiveAgentOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [status, setStatus] = useState<VoiceAgentStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [liveUserTranscript, setLiveUserTranscript] = useState("");
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState("");
  const [activeToolName, setActiveToolName] = useState<string | null>(null);

  const activeChatIdRef = useRef<string | null>(options.activeChatId || null);

  // Audio Contexts & WebSockets
  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<PCMPlayer | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeakingRef = useRef(false);
  const isMutedRef = useRef(false);
  const isPersistingTurnRef = useRef(false);

  const accumulatedUserTextRef = useRef("");
  const accumulatedAssistantTextRef = useRef("");
  const currentTurnToolCallsRef = useRef<ToolCallItem[]>([]);

  useEffect(() => {
    activeChatIdRef.current = options.activeChatId || null;
  }, [options.activeChatId]);

  // Persist completed turn to PostgreSQL database & update React state
  const persistCompletedTurn = useCallback(async () => {
    if (isPersistingTurnRef.current) return;
    isPersistingTurnRef.current = true;

    const userText = accumulatedUserTextRef.current.trim() || "Voice Query";
    const asstText = accumulatedAssistantTextRef.current.trim();
    const toolCalls = [...currentTurnToolCallsRef.current];
    const chatId = activeChatIdRef.current;

    // Reset turn buffers
    accumulatedUserTextRef.current = "";
    accumulatedAssistantTextRef.current = "";
    currentTurnToolCallsRef.current = [];

    if (asstText || userText) {
      // Notify React Chat UI
      optionsRef.current.onTurnComplete?.({
        userTranscript: userText,
        assistantTranscript: asstText,
        toolCalls,
      });

      // Save to Database
      if (chatId) {
        try {
          await fetch(`/api/chats/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userTranscript: userText,
              assistantTranscript: asstText,
              toolCalls,
            }),
          });
        } catch (err) {
          console.error("Failed to save voice messages to database:", err);
        }
      }
    }

    setTimeout(() => {
      isPersistingTurnRef.current = false;
    }, 1000);
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }

    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch (e) {}
      scriptProcessorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch (e) {}
      sourceNodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (inputContextRef.current && inputContextRef.current.state !== "closed") {
      try { inputContextRef.current.close(); } catch (e) {}
      inputContextRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    isSpeakingRef.current = false;
    setMicVolume(0);
    setStatus("disconnected");
    setErrorMessage(null);
    setLiveUserTranscript("");
    setLiveAssistantTranscript("");
    setActiveToolName(null);
    accumulatedUserTextRef.current = "";
    accumulatedAssistantTextRef.current = "";
    currentTurnToolCallsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const connect = useCallback(async (conversationIdOverride?: string) => {
    if (conversationIdOverride) {
      activeChatIdRef.current = conversationIdOverride;
    }

    disconnect();
    setStatus("listening");
    setErrorMessage(null);

    try {
      // 1. Fetch Session Config & WSS URL
      const sessionRes = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeChatIdRef.current || undefined,
        }),
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to initialize session configuration");
      }

      const sessionData = await sessionRes.json();
      const wsUrl = sessionData.wsUrl;
      if (!wsUrl) {
        throw new Error("Missing WSS WebSocket URL");
      }

      // 2. Initialize Synchronous PCM Player (24kHz Mono Queue)
      const player = new PCMPlayer({
        sampleRate: 24000,
        onPlaybackStateChange: (isPlaying) => {
          isSpeakingRef.current = isPlaying;
          if (isPlaying) {
            setStatus("speaking");
          } else {
            setStatus("listening");
          }
        },
      });
      await player.init();
      playerRef.current = player;

      // 3. Microphone Hardware Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioCtx();

      // 4. Start Speech Recognition for User Subtitles
      const SpeechRecognition =
        typeof window !== "undefined"
          ? (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition
          : null;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "hi-IN";

          recognition.onresult = (event: any) => {
            if (isMutedRef.current || isSpeakingRef.current) return;

            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                final += transcript;
              } else {
                interim += transcript;
              }
            }

            const currentText = (final || interim).trim();
            if (currentText) {
              accumulatedUserTextRef.current = currentText;
              setLiveUserTranscript(currentText);
            }
          };

          recognition.onerror = (event: any) => {
            if (event.error === "no-speech" || event.error === "aborted") return;
            if (event.error === "language-not-supported" || event.error === "network") {
              try {
                recognition.lang = "en-IN";
                recognition.start();
              } catch (e) {}
            }
          };

          recognition.onend = () => {
            if (recognitionRef.current && !isMutedRef.current && !isSpeakingRef.current) {
              try { recognition.start(); } catch (e) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition init error:", e);
        }
      }

      // 5. Direct Native WebSocket Connection to Gemini Live with Dual Modality
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[LiveAgent] Native WebSocket connected to Gemini Live");
        setStatus("listening");

        // Send Setup Frame with Dual Modality ["AUDIO", "TEXT"]
        const setupPayload = {
          setup: {
            model: sessionData.model || "models/gemini-2.5-flash-native-audio-latest",
            generationConfig: {
              responseModalities: ["AUDIO", "TEXT"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: sessionData.voiceName || "Puck",
                  },
                },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: `${sessionData.systemInstruction}\nSpeak naturally and concisely in Hindi/Hinglish. Provide real-time text parts accompanying all speech for live captions.`,
                },
              ],
            },
            tools: sessionData.tools || [],
          },
        };

        ws.send(JSON.stringify(setupPayload));

        // Start Input Audio Stream with Clean 16kHz Downsampling
        if (inputContextRef.current && streamRef.current) {
          if (inputContextRef.current.state === "suspended") {
            inputContextRef.current.resume().catch(() => {});
          }

          const inputRate = inputContextRef.current.sampleRate;
          const source = inputContextRef.current.createMediaStreamSource(streamRef.current);
          sourceNodeRef.current = source;

          const scriptProcessor = inputContextRef.current.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = scriptProcessor;

          scriptProcessor.onaudioprocess = (e) => {
            if (isMutedRef.current) {
              setMicVolume(0);
              return;
            }

            const inputData = e.inputBuffer.getChannelData(0);

            // Compute RMS Volume Level
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);

            // Half-Duplex Gate: Hold mic audio while model is speaking to prevent self-interruption
            if (isSpeakingRef.current) {
              setMicVolume(0);
              return;
            }

            setMicVolume(Math.min(1, rms * 8));

            // Downsample cleanly to 16kHz PCM
            const downsampled = downsampleBuffer(inputData, inputRate, 16000);
            const base64Chunk = floatTo16BitPCMBase64(downsampled);

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  realtimeInput: {
                    mediaChunks: [
                      {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Chunk,
                      },
                    ],
                  },
                }),
              );
            }
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(inputContextRef.current.destination);
        }
      };

      ws.onmessage = async (event) => {
        try {
          let msg: any = null;
          if (typeof event.data === "string") {
            msg = JSON.parse(event.data);
          } else if (event.data instanceof Blob) {
            const text = await event.data.text();
            msg = JSON.parse(text);
          }

          if (!msg) return;

          // 1. Audio and Text Model Output
          const parts = msg.serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.thought || part.thoughtContent) continue;

            if (part.text) {
              accumulatedAssistantTextRef.current += part.text;
              setLiveAssistantTranscript(accumulatedAssistantTextRef.current);
            }

            if (part.inlineData?.data && playerRef.current) {
              playerRef.current.playChunk(part.inlineData.data);
            }
          }

          // 2. Interruption / Barge-in
          if (msg.serverContent?.interrupted && playerRef.current) {
            playerRef.current.interrupt();
            isSpeakingRef.current = false;
            setStatus("listening");
          }

          // 3. Tool Call Dispatches (Mandi Rates & Loan Eligibility)
          const toolCalls = msg.toolCall?.functionCalls || [];
          if (toolCalls.length > 0) {
            const functionResponses: any[] = [];

            for (const call of toolCalls) {
              setActiveToolName(call.name);

              try {
                const res = await fetch("/api/voice/execute-tool", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    toolName: call.name,
                    args: call.args || {},
                  }),
                });

                const data = await res.json();
                const toolResult = data.result || { success: true };

                currentTurnToolCallsRef.current.push({
                  toolName: call.name,
                  args: call.args,
                  result: toolResult,
                  status: "completed",
                });

                functionResponses.push({
                  response: { output: toolResult },
                  id: call.id,
                });
              } catch (e) {
                console.error("Tool execution failed:", e);
                functionResponses.push({
                  response: { output: { error: "Execution failed" } },
                  id: call.id,
                });
              }
            }

            setActiveToolName(null);

            // Send toolResponse back to Live WebSocket
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  toolResponse: {
                    functionResponses,
                  },
                }),
              );
            }
          }

          // 4. Turn Complete -> Save to DB & Sync State
          if (msg.serverContent?.turnComplete) {
            persistCompletedTurn();
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setStatus("error");
        setErrorMessage("Connection error with Live Voice OS.");
      };

      ws.onclose = () => {
        console.log("[LiveAgent] WebSocket closed");
      };
    } catch (err: any) {
      console.error("Voice connection error:", err);
      setStatus("error");
      setErrorMessage(
        err?.name === "NotAllowedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : err?.message || "Failed to initialize Voice OS.",
      );
    }
  }, [disconnect, persistCompletedTurn]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;

    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    if (nextMuted && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    } else if (!nextMuted && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  }, [isMuted]);

  return {
    status,
    errorMessage,
    isMuted,
    micVolume,
    toggleMute,
    connect,
    disconnect,
    liveUserTranscript,
    liveAssistantTranscript,
    activeToolName,
    setStatus,
  };
}
