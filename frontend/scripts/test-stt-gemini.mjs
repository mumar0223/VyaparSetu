import dotenv from "dotenv";
dotenv.config();

async function testGeminiAudioSTT() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing Gemini 2.5 Flash Audio STT speed and accuracy...");

  // Generate a 1-second 16kHz sine wave WAV buffer as test audio
  const sampleRate = 16000;
  const numSamples = sampleRate * 1;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // WAV header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  const base64Wav = buffer.toString("base64");

  const start = Date.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "You are a speech-to-text transcriber. Transcribe the spoken audio into text verbatim. Support Hindi, Hinglish, and English. If there is no speech, output nothing.",
            },
            {
              inlineData: {
                mimeType: "audio/wav",
                data: base64Wav,
              },
            },
          ],
        },
      ],
    }),
  });

  const duration = Date.now() - start;
  const data = await res.json();
  console.log(`⏱️ Gemini Audio STT completed in ${duration}ms. Output:`, data.candidates?.[0]?.content?.parts?.[0]?.text || "(empty/silence)");
}

testGeminiAudioSTT().catch(console.error);
