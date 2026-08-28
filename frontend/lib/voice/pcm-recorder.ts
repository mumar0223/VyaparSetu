/**
 * RAW PCM MICROPHONE RECORDER
 *
 * Microphone -> AudioWorklet -> 16-bit mono PCM -> onChunk()
 *
 * No custom noise filtering, no noise gate, no gain boost,
 * no custom echo cancellation, no custom noise suppression.
 * Browser audio processing is explicitly disabled for this test.
 */

export interface PCMRecorderOptions {
  targetSampleRate?: number;
  bufferSize?: number;
  noiseGateThreshold?: number; // API compatibility; NOT USED
  gainBoost?: number;           // API compatibility; NOT USED
  onChunk: (base64Chunk: string) => void;
  onVolume?: (volume: number) => void;
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

  constructor(options: PCMRecorderOptions) {
    this.options = {
      targetSampleRate: 16000,
      bufferSize: 2048,
      ...options,
    };
  }

  public async start(): Promise<boolean> {
    if (this.isRecording) return true;

    try {
      // Raw browser capture for this test.
      // Disable browser-side AEC/NS/AGC so the signal is not intentionally processed.
      const audioConstraints: MediaTrackConstraints = {
        channelCount: { ideal: 1 },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      const track = this.mediaStream.getAudioTracks()[0];
      if (!track) {
        throw new Error("No microphone audio track was returned.");
      }

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioCtx) {
        throw new Error("Web Audio API is not supported in this browser.");
      }

      this.audioContext = new AudioCtx();

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      const targetSampleRate = this.options.targetSampleRate ?? 16000;
      const bufferSize = this.options.bufferSize ?? 2048;
      const inputSampleRate = this.audioContext.sampleRate;

      // Only sample-rate conversion and chunking happen inside the worklet.
      const workletCode = `
        class RawPCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.inputSampleRate = ${inputSampleRate};
            this.targetSampleRate = ${targetSampleRate};
            this.ratio = this.inputSampleRate / this.targetSampleRate;
            this.bufferSize = ${bufferSize};
            this.outputBuffer = new Float32Array(this.bufferSize);
            this.outputIndex = 0;
            this.resampleOffset = 0;
          }

          process(inputs) {
            const input = inputs[0];
            if (!input || !input[0] || input[0].length === 0) return true;

            const inputChannel = input[0];
            const inputLen = inputChannel.length;

            while (this.resampleOffset < inputLen) {
              const index0 = Math.floor(this.resampleOffset);
              const index1 = Math.min(index0 + 1, inputLen - 1);
              const fraction = this.resampleOffset - index0;

              // Direct sample value. No filter, gain, gate, or noise reduction.
              const sample =
                inputChannel[index0] * (1 - fraction) +
                inputChannel[index1] * fraction;

              this.outputBuffer[this.outputIndex++] = sample;

              if (this.outputIndex >= this.bufferSize) {
                this.port.postMessage({
                  type: "chunk",
                  buffer: this.outputBuffer.slice(0, this.bufferSize),
                });
                this.outputIndex = 0;
              }

              this.resampleOffset += this.ratio;
            }

            this.resampleOffset -= inputLen;
            return true;
          }
        }

        registerProcessor("raw-pcm-processor", RawPCMProcessor);
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

      this.workletNode.port.onmessage = (event: MessageEvent<any>) => {
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
    } catch (err: any) {
      this.stop();

      const error =
        err instanceof Error ? err : new Error(String(err ?? "Unknown error"));

      this.options.onError?.(error);
      return false;
    }
  }

  public setAssistantSpeaking(speaking: boolean): void {
    // Kept for API compatibility. RAW mode does not suppress microphone audio.
    this.isAssistantSpeaking = speaking;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
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
