/**
 * RAW PCM MICROPHONE RECORDER
 *
 * Microphone -> AudioWorklet -> 16-bit mono PCM -> onChunk()
 *
 * Capture is deliberately left to the browser's platform audio stack for
 * echo cancellation, noise suppression, and gain control. This is much more
 * reliable on desktop devices than a hand-rolled noise gate.
 *
 * IMPORTANT: No sample-rate conversion is performed. Audio is captured at the
 * browser's native sample rate (usually 48 kHz) and sent as-is. The Gemini
 * Live API natively resamples when the MIME type declares the actual rate
 * (e.g., "audio/pcm;rate=48000"), so there is no need for a client-side
 * resampler. This eliminates interpolation artifacts and simplifies the code.
 */

export interface PCMRecorderOptions {
  /** @deprecated Not used — audio is sent at native sample rate. */
  targetSampleRate?: number;
  bufferSize?: number;
  noiseGateThreshold?: number; // API compatibility; NOT USED
  gainBoost?: number;           // API compatibility; NOT USED
  onChunk: (base64Chunk: string) => void;
  onVolume?: (volume: number) => void;
  onAudioLevel?: (rms: number) => void;
  onError?: (err: Error) => void;
}

export class PCMRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private silentGainNode: GainNode | null = null;
  private isRecording = false;
  private isMuted = false;
  private isAssistantSpeaking = false;
  private options: PCMRecorderOptions;
  /** The actual sample rate of the AudioContext (browser native). */
  private nativeSampleRate: number = 48000;

  constructor(options: PCMRecorderOptions) {
    this.options = {
      bufferSize: 2048,
      ...options,
    };
  }

  public async start(): Promise<boolean> {
    if (this.isRecording) return true;

    try {
      // Use explicit constraints. `exact` for channelCount ensures mono.
      // `ideal` for processing features is appropriate — the browser will
      // enable them if the hardware/driver supports them.
      const audioConstraints: MediaTrackConstraints = {
        channelCount: { exact: 1 },
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      const track = this.mediaStream.getAudioTracks()[0];
      if (!track) {
        throw new Error("No microphone audio track was returned.");
      }

      // ── Log actual mic settings for diagnostics ──
      const actualSettings = track.getSettings();
      console.log("[PCMRecorder] Microphone granted:", {
        label: track.label,
        sampleRate: actualSettings.sampleRate ?? "unknown",
        channelCount: actualSettings.channelCount ?? "unknown",
        echoCancellation: actualSettings.echoCancellation ?? "unknown",
        noiseSuppression: actualSettings.noiseSuppression ?? "unknown",
        autoGainControl: actualSettings.autoGainControl ?? "unknown",
        deviceId: actualSettings.deviceId ?? "unknown",
      });

      const AudioCtx =
        window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        throw new Error("Web Audio API is not supported in this browser.");
      }

      this.audioContext = new AudioCtx();

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Store the native sample rate — this is what Gemini needs in the MIME type.
      this.nativeSampleRate = this.audioContext.sampleRate;
      console.log("[PCMRecorder] AudioContext sample rate:", this.nativeSampleRate);

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      const bufferSize = this.options.bufferSize ?? 2048;

      // The worklet performs NO resampling. It simply collects Float32 samples
      // into fixed-size chunks and posts them to the main thread.
      // It also supports a "flush" command to emit any partial buffer.
      const workletCode = `
        class RawPCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = ${bufferSize};
            this.outputBuffer = new Float32Array(this.bufferSize);
            this.outputIndex = 0;

            // Listen for flush commands from the main thread.
            this.port.onmessage = (event) => {
              if (event.data && event.data.type === 'flush') {
                this._flushPartial();
              }
            };
          }

          _flushPartial() {
            if (this.outputIndex > 0) {
              this.port.postMessage({
                type: 'chunk',
                buffer: this.outputBuffer.slice(0, this.outputIndex),
              });
              this.outputIndex = 0;
            }
          }

          process(inputs) {
            const input = inputs[0];
            if (!input || !input[0] || input[0].length === 0) return true;

            const inputChannel = input[0];

            for (let i = 0; i < inputChannel.length; i++) {
              this.outputBuffer[this.outputIndex++] = inputChannel[i];

              if (this.outputIndex >= this.bufferSize) {
                this.port.postMessage({
                  type: 'chunk',
                  buffer: this.outputBuffer.slice(0, this.bufferSize),
                });
                this.outputIndex = 0;
              }
            }
            return true;
          }
        }

        registerProcessor('raw-pcm-processor', RawPCMProcessor);
      `;

      const blob = new Blob([workletCode], {
        type: "application/javascript",
      });
      const workletUrl = URL.createObjectURL(blob);

      try {
        await this.audioContext.audioWorklet.addModule(workletUrl);
      } finally {
        URL.revokeObjectURL(workletUrl);
      }

      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        "raw-pcm-processor"
      );

      this.workletNode.port.onmessage = (event: MessageEvent<{ type?: string; buffer?: Float32Array }>) => {
        if (!this.isRecording || this.isMuted) return;

        const data = event.data;
        if (!data || data.type !== "chunk" || !data.buffer) return;

        const float32Data = data.buffer as Float32Array;
        const pcm16Data = this.floatTo16BitPCM(float32Data);
        const base64Chunk = this.arrayBufferToBase64(pcm16Data.buffer);

        if (base64Chunk) {
          this.options.onChunk(base64Chunk);
        }

        // Meter only. This never changes the audio sent to onChunk().
        if (this.options.onVolume && float32Data.length > 0) {
          let sumSquares = 0;
          for (let i = 0; i < float32Data.length; i++) {
            sumSquares += float32Data[i] * float32Data[i];
          }
          const rms = Math.sqrt(sumSquares / float32Data.length);
          this.options.onVolume(Math.min(1, rms * 6));
          this.options.onAudioLevel?.(rms);
        }
      };

      // The graph must be connected to keep the worklet processing.
      // Gain = 0 makes sure microphone audio is NOT played back through speakers.
      this.silentGainNode = this.audioContext.createGain();
      this.silentGainNode.gain.value = 0;

      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.silentGainNode);
      this.silentGainNode.connect(this.audioContext.destination);

      this.isRecording = true;
      return true;
    } catch (err: unknown) {
      this.stop();

      const error =
        err instanceof Error ? err : new Error(String(err ?? "Unknown error"));

      this.options.onError?.(error);
      return false;
    }
  }

  /**
   * Flush any partial buffer remaining in the AudioWorklet.
   *
   * Call this when the user releases the hold-to-speak button so that the
   * last few milliseconds of audio are not silently discarded.  Without
   * this, up to `bufferSize` samples (~42 ms at 48 kHz with 2048) could be
   * lost at the tail of each utterance.
   */
  public flush(): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: "flush" });
    }
  }

  public setAssistantSpeaking(speaking: boolean): void {
    // Kept for API compatibility. RAW mode does not suppress microphone audio.
    this.isAssistantSpeaking = speaking;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    // NOTE: We deliberately do NOT toggle track.enabled here.
    // On mobile browsers (Chrome Android, iOS Safari), toggling
    // track.enabled causes the OS to re-initialize the microphone
    // hardware, creating audio pops, gaps, and frame corruption.
    // Instead, the isMuted flag is checked in the onmessage handler
    // which silently discards chunks while muted.
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Returns the native sample rate of the AudioContext.
   * Use this to set the correct MIME type when sending to Gemini Live
   * (e.g., `audio/pcm;rate=48000`).
   */
  public getNativeSampleRate(): number {
    return this.nativeSampleRate;
  }

  public async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /** Returns the actual microphone settings reported by the browser. */
  public getInputInfo(): Record<string, unknown> | null {
    const track = this.mediaStream?.getAudioTracks()[0];
    if (!track) return null;

    const settings = track.getSettings();
    return {
      label: track.label,
      deviceId: settings.deviceId ?? null,
      groupId: settings.groupId ?? null,
      sampleRate: settings.sampleRate ?? this.audioContext?.sampleRate ?? null,
      sampleSize: settings.sampleSize ?? null,
      channelCount: settings.channelCount ?? null,
      echoCancellation: settings.echoCancellation ?? null,
      noiseSuppression: settings.noiseSuppression ?? null,
      autoGainControl: settings.autoGainControl ?? null,
    };
  }

  public stop(): void {
    this.isRecording = false;
    this.isAssistantSpeaking = false;

    if (this.workletNode) {
      this.workletNode.port.onmessage = null;
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.silentGainNode) {
      this.silentGainNode.disconnect();
      this.silentGainNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);

    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = "";
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }

    return window.btoa(binary);
  }
}
