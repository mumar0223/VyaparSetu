import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAgentTools, TOOL_DEFINITIONS } from "@/lib/agent/tools";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { DASHBOARD_CHAT_CONFIG } from "@/lib/agent/chat-config";
import { streamText, isStepCount } from "ai";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let query = "";
    let actionType = "general";
    let conversationId: string | undefined = undefined;
    let audioBase64: string | undefined = undefined;
    let imageBuffer: Buffer | null = null;
    let imageMimeType = "image/jpeg";
    let sharpnessScore: number | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      query = (formData.get("query") as string) || "";
      actionType = (formData.get("actionType") as string) || "form";
      conversationId = (formData.get("conversationId") as string) || undefined;
      audioBase64 = (formData.get("audioBase64") as string) || undefined;
      const scoreStr = formData.get("sharpnessScore") as string;
      if (scoreStr) sharpnessScore = Number(scoreStr);

      const imageFile = formData.get("image");
      if (imageFile && typeof (imageFile as any).arrayBuffer === "function") {
        const ab = await (imageFile as Blob).arrayBuffer();
        imageBuffer = Buffer.from(ab);
        imageMimeType = (imageFile as Blob).type || "image/jpeg";
      }
    } else {
      const body = await req.json().catch(() => ({}));
      query = body.query || "";
      actionType = body.actionType || "general";
      conversationId = body.conversationId;
      audioBase64 = body.audioBase64;
      if (body.imageBase64) {
        try {
          imageBuffer = Buffer.from(body.imageBase64, "base64");
        } catch (e) {
          console.warn("[voice/subagent-stream] Failed to parse base64 image:", e);
        }
      }
      if (typeof body.sharpnessScore === "number") {
        sharpnessScore = body.sharpnessScore;
      }
    }

    if (!query || typeof query !== "string" || !query.trim()) {
      query = imageBuffer ? "Extract and fill out the captured document form" : "";
    }

    if (!query.trim()) {
      return NextResponse.json(
        { error: "Query or document is required" },
        { status: 400 },
      );
    }

    const streamStartTime = Date.now();

    // ── File & Database Persistence ──
    let savedImageUrl: string | null = null;
    if (imageBuffer) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "captured-documents");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const fileName = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, imageBuffer);
        savedImageUrl = `/uploads/captured-documents/${fileName}`;
      } catch (fsErr) {
        console.warn("[voice/subagent-stream] Failed to save image to disk:", fsErr);
      }
    }

    const tools = getAgentTools({
      userId: user.id,
      conversationId,
    });

    const model = getLanguageModel(
      DASHBOARD_CHAT_CONFIG.provider,
      DASHBOARD_CHAT_CONFIG.model,
    );

    const systemInstruction = `You are VyaparSetu's specialized Autonomous Chat AI Sub-Agent running on Google Cloud Vertex AI (Gemini 3.7 Flash) with native Multimodal Vision & OCR.
You were invoked by a live voice user to perform an authentic, professional action for Indian small businesses, shopkeepers, traders, and farmers.

User Action Request: "${query}"
${savedImageUrl ? `Captured Document File: "${savedImageUrl}" (Sharpness Score: ${sharpnessScore ?? "N/A"})` : ""}

DOCUMENT VISION & MULTIMODAL EXECUTION PROTOCOL (WHEN AN IMAGE IS ATTACHED):
1. LEGIBILITY CHECK:
   • First, visually inspect the provided document image.
   • IF the image is heavily blurred, out-of-focus, obscured by strong glare/shadows, or the text is impossible to read with certainty:
     - DO NOT invent or hallucinate field values!
     - Immediately output the exact phrase: "IMAGE_UNCLEAR: <reason>" (e.g. "IMAGE_UNCLEAR: Document text is blurry due to motion. Please hold steady in good lighting and capture again.").
     - Do not call staging tools with fake or guessed data.

2. AUTONOMOUS TASK FULFILLMENT BASED ON USER QUERY:
   • Read the user's request and fulfill it intelligently using the document image and your tools:
     a) FILL ACTIVE FORM ON SCREEN:
        - If the user asks to fill, populate, or update an active form on screen from this document (e.g. passbook, Aadhaar, PAN, GST certificate, or physical paper):
        - Call 'getArtifacts' to inspect the open form on screen.
        - Extract the relevant fields from the document image with OCR.
        - Call 'stageForm' passing 'targetArtifactId' to update the open form's fields in place with the extracted values.
     b) STEP-BY-STEP PEN-AND-PAPER GUIDANCE:
        - If the user is writing with a pen on desk and asks what to write or where to write:
        - Inspect the document layout and fields from the image.
        - Provide crisp, clear spoken/written column-by-column instructions.
     c) VERIFICATION & ERROR AUDIT:
        - If the user asks whether they filled the form correctly or if anything is missing:
        - Inspect all fields in the image: check for missing mandatory information, signatures, stamps, or incomplete details.
        - Provide a clear, helpful audit report.
     d) EXPLAIN BILL / NOTICE / RECEIPT / STATEMENT:
        - If the user asks about a bill, bank notice, tax deduction, or APMC mandi receipt:
        - Run OCR and clearly explain the numbers, charges, and next steps.
     e) STAGE NEW FORM / COPY PHYSICAL PAPER ON SCREEN:
        - If the user asks to copy or digitize this physical paper into an authentic official form:
        - Call 'stageForm' mirroring the exact paper structure:
          * Use 'documentBadge' (e.g. "OFFICIAL REGISTRATION SLIP").
          * Use 'rows' with multi-field arrays (1, 2, or 3 fields per line) matching the document's layout.
          * If the document has a passport photo box, add 'photoBox: { label: "पासपोर्ट फोटो / Passport Photo" }' to the identity section.
          * If the document contains a marksheet or qualification table, include 'table: { headers: [...], rows: [...] }'.
          * For registration/roll numbers, set 'displayVariant: "char_boxes"'.
     f) STAGE PRICE CATALOG / WHOLESALE RATE SHEET / AGREEMENT:
        - If the user asks for a price catalog, wholesale rate list, item quotation, or policy document:
        - Call 'stageDocument' with rich GitHub-Flavored Markdown tables, clean headings, bullet points, and theme colors.

AUTONOMOUS EXECUTION PROTOCOL FOR REQUESTS WITHOUT IMAGES:
1. FOR LOAN & GOVT SCHEME FORMS (SMART PER-BANK RESEARCH PROTOCOL):
   • Step 1: Check active session memory. If this specific bank or scheme's official format was ALREADY researched via 'webSearch' earlier in this conversation, skip 'webSearch' and directly use the layout from memory.
   • Step 2: If this bank/scheme has NOT yet been researched in this conversation (or user switched to a different bank): ALWAYS FIRST invoke 'webSearch' with targeted query (e.g. "<Bank Name> MSME loan application form pdf fields format layout") to retrieve authentic official document sections and fields.
   • Step 3: Section titles must be clean strings (e.g. "1. Branch Particulars", "2. Enterprise Profile") — NEVER prefix or wrap titles with dashes, brackets, pipes, or tokens like "—[ ... ]—" or "|-".
   • Step 4: Invoke 'stageForm' using 'rows' (1, 2, or 3 fields per line), 'documentBadge', and 'table' for embedded tabular lists mirroring the bank's format.

2. FOR EDITING / UPDATING FIELDS IN AN ACTIVE ON-SCREEN FORM:
   • If the user asks to edit, update, fill, correct, or change any field in the active form on screen (e.g. 'update applicant name to Mohammad Umar Farooque', 'loan amount 5 lakh karo', 'address change karo'):
   • Step 1: Call 'getArtifacts' to inspect the active form, its sections, and current field values.
   • Step 2: Call 'stageForm' passing 'targetArtifactId' with the updated field values to update the form in-place on the user's screen!
   • Step 3: State clearly what field was updated so the voice agent can explain it orally.

3. FOR PRICE CATALOGS, WHOLESALE RATE LISTS, TABLES & FORMAL DOCUMENTS:
   • Call 'stageDocument' with title, summary, badge, and rich Markdown tables/formatting.
   • Ideal for wholesale rate sheets, mandi price catalogs, product inventory matrices, terms of trade, and partnership guidelines.

4. FOR MANDI COMMODITY RATES:
   • Call 'getMandiRates' with commodity and district/state in English.

5. FOR CHARTS / VISUAL TRENDS:
   • Call 'stageChart' with at least 5-6 realistic monthly or category data points.

6. FOR BUDGETS / EXPENSES:
   • Call 'stageBudget' or 'stageExpense' with realistic breakdown.

7. GENERAL RESEARCH & SEARCH INQUIRIES:
   • When the user asks to search the web or research information (e.g. 'search SBI Mudra loan eligibility', 'search mandi rates', 'check guidelines'):
   • Call 'webSearch' (or 'getMandiRates') to fetch authentic, verified details.
   • Provide a clear, concise spoken summary so the live voice agent can explain it orally to the user.
   • If the search results warrant an official table or form, call 'stageDocument' or 'stageForm' to display it on screen simultaneously.

CRITICAL POST-TOOL CONCISENESS RULE (MANDATORY 15 TO 40 WORDS MAXIMUM):
- Once you call 'stageForm', 'stageDocument', or 'stageChart':
- The visual interface is ALREADY rendered directly on the user's screen!
- Your final text response MUST be ONLY 1 single short spoken confirmation sentence (strictly 15 to 40 words maximum) in the user's spoken conversational language (e.g. "मैंने आपके दस्तावेज़ के आधार पर लोन एप्लीकेशन फॉर्म स्क्रीन पर तैयार कर दिया है। आप इसे देख सकते हैं।").
- NEVER output multi-paragraph markdown lists, section outlines, or field breakdowns in text, because the visual form is already visible on screen and the live voice agent must speak your confirmation immediately without delay.

CRITICAL FORM STAGING & IN-PLACE EDITING MANDATE:
- If the user asks to update, fill, or set details, BUT no active form exists on screen yet (or 'getArtifacts' returns 0 forms): You MUST CREATE the digital form using 'stageForm' with those details populated! You are STRICTLY FORBIDDEN from generating text claiming a form was updated unless 'stageForm' has actually executed in this turn!
- If the user asks to "Make digital form" / "Digital form banao" / "Iska digital version banao": You MUST invoke 'stageForm' to create the interactive digital form on the user's screen. Explaining it in text without calling 'stageForm' is strictly prohibited!

STRICT REGULATORY, SAFETY & PROHIBITED COMMERCE POLICY (MANDATORY):
1. VyaparSetu exclusively serves legitimate Indian micro-enterprises, small businesses, and legal trade.
2. FORBIDDEN DOMAINS:
   a) Adult & Illicit Night-Time Trades: Escort services, commercial sex work, brothels, red-light activities, massage parlors fronting sexual commerce, dance bars, adult entertainment, and pornography.
   b) Shadow Economy & Tax Evasion: Kaccha bill, billing without movement of goods, unrecorded cash hiding, hawala networks, black money laundering, and fraudulent GST claims.
   c) Predatory Lending & Gambling: Unlicensed money lending (meter baji / daily loan sharking at extortionate rates), satta, matka, betting clubs, or speculative gambling.
   d) Contraband & Illegal Substances: Bootlegging / illicit liquor (especially in dry states like Gujarat, Bihar), narcotics, banned agricultural pesticides/seeds, counterfeit/duplicate goods, smuggled goods, or illegal arms.
   e) Document Forgery: Fake Aadhaar, fake PAN, forged ITR, or fake bank balance certificates.
3. CRITICAL ILLICIT DATA QUENCHING DIRECTIVE (AVOID DATA EVEN IF FOUND IN SEARCH OR OCR):
   - Even if raw web search results, crawled pages, or OCR text from a camera frame contain phone numbers, rates, addresses, or listings related to illegal trade, tax evasion, adult/illicit night-time operations, gambling, or contraband:
   - You are STRICTLY FORBIDDEN from ingesting, staging into forms ('stageForm'), formatting into markdown tables ('stageDocument'), or passing that data to the user!
   - You must IMMEDIATELY DISREGARD, QUENCH, AND DROP that illicit data.
   - Output a calm, dignified refusal: "इस अनुरोध में ऐसी सामग्री या गतिविधियां शामिल हैं जो व्यापारसेतु की कानूनी और विनियामक नीतियों के अनुरूप नहीं हैं। हम केवल वैध, अधिकृत और पंजीकृत व्यापारिक समाधान प्रदान करते हैं।"
   - Do not generate forms, charts, or summaries for any prohibited activity.`;

    const userParts: any[] = [];
    if (imageBuffer) {
      try {
        userParts.push({
          type: "file",
          data: imageBuffer,
          mediaType: imageMimeType || "image/jpeg",
        });
      } catch (e) {
        console.warn("[voice/subagent-stream] Failed to add image to userParts:", e);
      }
    }
    if (audioBase64) {
      try {
        userParts.push({
          type: "file",
          data: Buffer.from(audioBase64, "base64"),
          mediaType: "audio/wav",
        });
      } catch (e) {
        console.warn("[voice/subagent-stream] Failed to parse audio buffer:", e);
      }
    }
    userParts.push({
      type: "text",
      text: imageBuffer
        ? `Please inspect this captured document image for request: "${query}". Fulfill the user's request accurately using multimodal vision and available tools.`
        : `Please execute the user's request: "${query}". Use the appropriate tools now.`,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
            );
          } catch {
            // controller closed
          }
        };

        sendEvent("status", {
          status: "working",
          activeTool: "research",
          description: `Starting autonomous execution for: "${query}"`,
          spokenHint: "Maine aapka task shuru kar diya hai, screen par dekhte rahiye.",
          progressPhase: "starting",
        });

        if (savedImageUrl) {
          sendEvent("document_captured", {
            url: savedImageUrl,
            sharpnessScore,
            query: query || "Document Scan",
          });
        }

        const executedToolCalls: any[] = [];

        // Wrap tools to send real-time progress events
        const wrappedTools: Record<string, any> = {};
        for (const [name, t] of Object.entries(tools)) {
          wrappedTools[name] = {
            ...t,
            execute: async (toolArgs: any, context: any) => {
              if (name === "webSearch") {
                sendEvent("status", {
                  status: "working",
                  activeTool: "webSearch",
                  description: `Searching official guidelines for: ${toolArgs.query || query}`,
                  spokenHint: "Main abhi official portal par niyam aur zaroori documents search kar raha hoon, bas thoda intezar kijiye.",
                  progressPhase: "researching",
                });
              } else if (name === "stageForm") {
                sendEvent("status", {
                  status: "working",
                  activeTool: "stageForm",
                  description: `Generating dynamic MSME form: "${toolArgs.title || query}"`,
                  spokenHint: "Form ke chaar sections aur zaroori fields screen par assemble ho rahe hain, lagbhag taiyar hai.",
                  progressPhase: "building_form",
                });
              } else if (name === "stageDocument") {
                sendEvent("status", {
                  status: "working",
                  activeTool: "stageDocument",
                  description: `Generating document / catalog: "${toolArgs.title || query}"`,
                  spokenHint: "Aapka document aur price catalog screen par taiyar ho raha hai.",
                  progressPhase: "building_document",
                });
              } else if (name === "getMandiRates") {
                sendEvent("status", {
                  status: "working",
                  activeTool: "getMandiRates",
                  description: `Fetching live mandi commodity rates for: ${toolArgs.commodity || query}`,
                  spokenHint: "Mandi portal se taaza bhav nikaale ja rahe hain.",
                  progressPhase: "fetching_rates",
                });
              } else if (name === "stageChart") {
                sendEvent("status", {
                  status: "working",
                  activeTool: "stageChart",
                  description: `Building visual market trend chart for: ${toolArgs.title || query}`,
                  spokenHint: "Screen par graph aur trend chart ban raha hai.",
                  progressPhase: "building_chart",
                });
              }

              const def = (TOOL_DEFINITIONS as any)[name] || {
                icon: "bot",
                formatSummary: () => `Executing ${name}...`,
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs)
                  : `Executing ${name}...`;

              sendEvent("tool_call", {
                toolName: name,
                icon: def.icon || "bot",
                args: toolArgs,
                summary,
                status: "calling",
              });

              let toolOut: any = null;
              try {
                toolOut = await (t as any).execute(toolArgs, context);
              } catch (execErr: any) {
                toolOut = { success: false, error: execErr?.message || "Execution error" };
              }

              const finalSummary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs, toolOut)
                  : "Completed";

              const invocationRecord = {
                toolCallId: `call_${Date.now()}_${name}`,
                toolName: name,
                args: toolArgs,
                result: toolOut,
              };
              executedToolCalls.push(invocationRecord);

              sendEvent("tool_result", {
                toolName: name,
                icon: def.icon || "bot",
                args: toolArgs,
                result: toolOut,
                summary: finalSummary,
                status: "completed",
              });

              if (toolOut?.isArtifact) {
                sendEvent("artifact", {
                  artifactId: toolOut.artifactId || toolOut.data?.artifactId,
                  targetArtifactId: toolOut.targetArtifactId,
                  isUpdated: toolOut.isUpdated,
                  artifactType: toolOut.artifactType,
                  title: toolOut.title,
                  summary: toolOut.summary,
                  data: toolOut.data,
                });

                sendEvent("status", {
                  status: "completed",
                  activeTool: "completed",
                  description: `Completed: ${toolOut.title || "Item ready"}`,
                  spokenHint: `${toolOut.title || "Aapka form"} bilkul taiyar hai aur screen par open ho chuka hai.`,
                  progressPhase: "completed",
                  artifact: {
                    artifactId: toolOut.artifactId || toolOut.data?.artifactId,
                    artifactType: toolOut.artifactType,
                    title: toolOut.title,
                    summary: toolOut.summary,
                    data: toolOut.data,
                  },
                });
              }

              return toolOut;
            },
          };
        }

        try {
          const aiStream = streamText({
            model,
            system: systemInstruction,
            messages: [{ role: "user", content: userParts }],
            tools: wrappedTools as any,
            stopWhen: isStepCount(5),
          });

          let fullGeneratedText = "";
          for await (const part of (aiStream as any).fullStream) {
            if (part.type === "text-delta" || part.type === "text") {
              const text = part.textDelta ?? part.text ?? "";
              if (text) {
                fullGeneratedText += text;
                sendEvent("chunk", { text });
              }
            }
          }

          if (fullGeneratedText.includes("IMAGE_UNCLEAR:")) {
            const reason =
              fullGeneratedText.split("IMAGE_UNCLEAR:")[1]?.trim() ||
              "Document image is blurry or unreadable.";
            sendEvent("status", {
              status: "unclear",
              activeTool: "camera_retry",
              description: `Image unclear: ${reason.slice(0, 140)}`,
              spokenHint:
                "Photo thodi blur aayi hai, kripya camera thoda steady aur paas rakh kar dobara dikhayein.",
              progressPhase: "needs_retry",
            });
          }

          const thoughtDurationSeconds = Math.max(
            1,
            Math.round((Date.now() - streamStartTime) / 1000),
          );

          const finalAssistantText =
            fullGeneratedText.trim() ||
            "Maine aapka document process kar diya hai aur form screen par khol diya hai.";

          sendEvent("done", {
            status: "finished",
            savedImageUrl,
            query: query || (savedImageUrl ? "Scanned Document" : "Screen task"),
            assistantContent: finalAssistantText,
            toolCalls: executedToolCalls,
            thoughtDurationSeconds,
          });
        } catch (err: any) {
          console.error("[voice/subagent-stream Error]:", err);
          sendEvent("error", { error: err?.message || "Stream error" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[POST /api/voice/subagent-stream error]:", error);
    return NextResponse.json(
      { error: error?.message || "Subagent streaming failed" },
      { status: 500 },
    );
  }
}
