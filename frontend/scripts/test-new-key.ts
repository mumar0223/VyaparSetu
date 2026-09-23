const TEST_KEY = process.env.GOOGLE_VERTEX_API_KEY;

async function runTests() {
  console.log("=================================================");
  console.log("Testing API Key:", TEST_KEY);
  console.log("=================================================\n");

  // Test 1: List Models via query param (?key=...)
  console.log("--- Test 1: GET /v1beta/models (Query Param `?key=`) ---");
  let allModelNames: string[] = [];
  try {
    const res1 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${TEST_KEY}`,
    );
    const data1 = await res1.json();
    console.log(`Status: ${res1.status} ${res1.statusText}`);
    if (res1.ok) {
      allModelNames = (data1.models || []).map((m: any) =>
        m.name.replace("models/", ""),
      );
      console.log(`✅ Success! Found ${allModelNames.length} models:`);
      console.log(allModelNames.join(", "));
    } else {
      console.log("❌ Failed:", JSON.stringify(data1, null, 2));
    }
  } catch (err: any) {
    console.log("❌ Network Error:", err.message);
  }

  // Test 2: List Models via Header (x-goog-api-key)
  console.log("\n--- Test 2: GET /v1beta/models (Header `x-goog-api-key`) ---");
  try {
    const res2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models`,
      {
        headers: {
          "x-goog-api-key": TEST_KEY,
        },
      },
    );
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} ${res2.statusText}`);
    if (res2.ok) {
      console.log(
        `✅ Success with header! Found ${data2.models?.length || 0} models.`,
      );
    } else {
      console.log("❌ Failed:", JSON.stringify(data2, null, 2));
    }
  } catch (err: any) {
    console.log("❌ Network Error:", err.message);
  }

  // Test 3: Generate Content via gemini-3.6-flash (Header)
  const targetModel = allModelNames.includes("gemini-3.6-flash")
    ? "gemini-3.6-flash"
    : allModelNames[0] || "gemini-2.5-flash";
  console.log(
    `\n--- Test 3: POST ${targetModel}:generateContent (Header \`x-goog-api-key\`) ---`,
  );
  try {
    const res3 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": TEST_KEY,
        },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: "Say 'Hello, VyaparSetu!'" }] },
          ],
        }),
      },
    );
    const data3 = await res3.json();
    console.log(`Status: ${res3.status} ${res3.statusText}`);
    if (res3.ok) {
      console.log(
        "✅ Success! Response:",
        data3.candidates?.[0]?.content?.parts?.[0]?.text,
      );
    } else {
      console.log("❌ Failed:", JSON.stringify(data3, null, 2));
    }
  } catch (err: any) {
    console.log("❌ Network Error:", err.message);
  }

  // Test 4: OpenAI Compatible endpoint (Bearer token)
  console.log(
    "\n--- Test 4: POST /v1beta/openai/chat/completions (Bearer) ---",
  );
  try {
    const res4 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_KEY}`,
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "user", content: "Hi" }],
        }),
      },
    );
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} ${res4.statusText}`);
    if (res4.ok) {
      console.log(
        "✅ Success! Response:",
        data4.choices?.[0]?.message?.content,
      );
    } else {
      console.log("❌ Failed:", JSON.stringify(data4, null, 2));
    }
  } catch (err: any) {
    console.log("❌ Network Error:", err.message);
  }

  // Test 5: Live Multimodal WebSocket Test
  console.log("\n--- Test 5: WebSocket BidiGenerateContent ---");
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${TEST_KEY}`;
  try {
    const WebSocket = (await import("ws")).default;
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        ws.terminate();
        console.log("⏱️ WebSocket timeout (5s)");
        resolve();
      }, 5000);

      ws.on("open", () => {
        console.log("✅ WebSocket connected! Sending setup handshake...");
        ws.send(
          JSON.stringify({
            setup: {
              model: "models/gemini-2.5-flash-native-audio-latest",
            },
          }),
        );
      });

      ws.on("message", (data) => {
        console.log("✅ WS Message received:", data.toString().slice(0, 150));
        clearTimeout(timer);
        ws.close();
        resolve();
      });

      ws.on("error", (err) => {
        console.log("❌ WS Error:", err.message);
        clearTimeout(timer);
        resolve();
      });

      ws.on("close", (code, reason) => {
        console.log(`ℹ️ WS Closed: code=${code}, reason=${reason.toString()}`);
        clearTimeout(timer);
        resolve();
      });
    });
  } catch (err: any) {
    console.log("❌ WS execution error:", err.message);
  }

  // Test 6: Official Google GenAI SDK (@google/genai)
  console.log("\n--- Test 6: @google/genai SDK test ---");
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: TEST_KEY });
    const resp = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say hello in one word",
    });
    console.log("✅ SDK Success! Response:", resp.text);
  } catch (err: any) {
    console.log("❌ SDK Error:", err.message);
    if (err.status) console.log("Status:", err.status);
    if (err.errorDetails)
      console.log("Details:", JSON.stringify(err.errorDetails));
  }

  // Test 7: Vertex AI with API Key
  console.log("\n--- Test 7: Vertex AI Express REST endpoint ---");
  for (const model of ["gemini-2.5-flash", "gemini-3.7-flash"]) {
    for (const loc of ["global", "us-central1"]) {
      const host =
        loc === "global"
          ? "aiplatform.googleapis.com"
          : `${loc}-aiplatform.googleapis.com`;
      const vUrl = `https://${host}/v1/projects/930708138553/locations/${loc}/publishers/google/models/${model}:generateContent?key=${TEST_KEY}`;
      try {
        const res = await fetch(vUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: "Respond in 3 words: VyaparSetu connection status." },
                ],
              },
            ],
          }),
        });
        const data = await res.json();
        if (res.ok) {
          console.log(
            `✅ Vertex [${loc}] [${model}]: Status 200 ->`,
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim(),
          );
        } else {
          console.log(
            `❌ Vertex [${loc}] [${model}]: Status ${res.status} ->`,
            JSON.stringify(data.error?.message || data).slice(0, 100),
          );
        }
      } catch (e: any) {
        console.log(`Vertex (${loc}) err:`, e.message);
      }
    }
  }

  // Test 9: Vertex AI WebSocket with API Key
  console.log(
    "\n--- Test 9: Vertex AI WebSocket (BidiGenerateContent) with ?key= ---",
  );
  const liveCandidate = "gemini-live-2.5-flash";
  const vertexWsUrl = `wss://aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1.LlmBidiService/BidiGenerateContent?key=${TEST_KEY}`;
  try {
    const WebSocket = (await import("ws")).default;
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(vertexWsUrl);
      const timer = setTimeout(() => {
        ws.terminate();
        console.log("⏱️ Vertex WS timeout (6s)");
        resolve();
      }, 6000);

      ws.on("open", () => {
        console.log(
          `✅ Vertex WS connected! Sending setup for ${liveCandidate}...`,
        );
        ws.send(
          JSON.stringify({
            setup: {
              model: `projects/930708138553/locations/global/publishers/google/models/${liveCandidate}`,
              generationConfig: {
                responseModalities: ["AUDIO"],
              },
            },
          }),
        );
      });

      ws.on("message", (data) => {
        console.log(
          "✅ Vertex WS Message received:",
          data.toString().slice(0, 150),
        );
        clearTimeout(timer);
        ws.close();
        resolve();
      });

      ws.on("error", (err) => {
        console.log("❌ Vertex WS Error:", err.message);
        clearTimeout(timer);
        resolve();
      });

      ws.on("close", (code, reason) => {
        console.log(
          `ℹ️ Vertex WS Closed: code=${code}, reason=${reason.toString()}`,
        );
        clearTimeout(timer);
        resolve();
      });
    });
  } catch (err: any) {
    console.log("❌ Vertex WS execution error:", err.message);
  }
}

runTests();
