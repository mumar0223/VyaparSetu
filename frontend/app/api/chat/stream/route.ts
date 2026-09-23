import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentTools, TOOL_DEFINITIONS } from "@/lib/agent/tools";
import { getLanguageModel } from "@/lib/agent/ai-provider";
import { DASHBOARD_CHAT_CONFIG } from "@/lib/agent/chat-config";
import { streamText, isStepCount } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      message,
      attachments = [],
      conversationId,
      history = [],
      language = "en",
      files = [],
    } = await req.json();

    const textContent = typeof message === "string" ? message.trim() : "";
    if (
      !textContent &&
      (!Array.isArray(attachments) || attachments.length === 0)
    ) {
      return NextResponse.json(
        { error: "Message or attachment is required" },
        { status: 400 },
      );
    }

    // 1. Find or create conversation
    let activeConversationId = conversationId;
    let isNewConversation = false;
    let conversationTitle = "New Conversation";

    if (!activeConversationId) {
      const fallback = (
        textContent ||
        attachments[0]?.uploadedName ||
        "New Conversation"
      )
        .replace(/\n+/g, " ")
        .split(" ")
        .slice(0, 6)
        .join(" ");
      conversationTitle =
        fallback.length > 40
          ? fallback.slice(0, 37) + "..."
          : fallback || "New Conversation";

      const conv = await prisma.conversation.create({
        data: {
          title: conversationTitle,
          userId: user.id,
          pinned: false,
        },
      });
      activeConversationId = conv.id;
      isNewConversation = true;
    } else {
      const existing = await prisma.conversation.findFirst({
        where: { id: activeConversationId, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }
      conversationTitle = existing.title;
    }

    // 2. Persist User Message with serialized dual-name attachments
    const serializedFiles: string[] = [];
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        serializedFiles.push(
          typeof att === "string" ? att : JSON.stringify(att),
        );
      }
    }
    if (Array.isArray(files)) {
      for (const f of files) {
        if (!serializedFiles.includes(f)) {
          serializedFiles.push(f);
        }
      }
    }

    await prisma.conversationMessage.create({
      data: {
        conversationId: activeConversationId,
        role: "user",
        content: textContent,
        files: serializedFiles,
      },
    });

    await prisma.conversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() },
    });

    // 3. Prepare AI execution and tools
    const tools = getAgentTools({
      userId: user.id,
      conversationId: activeConversationId,
    });

    const model = getLanguageModel(
      DASHBOARD_CHAT_CONFIG.provider,
      DASHBOARD_CHAT_CONFIG.model,
    );

    const LANGUAGE_MAP: Record<string, { name: string; native: string }> = {
      en: { name: "English", native: "English" },
      hi: { name: "Hindi", native: "हिन्दी" },
      hinglish: {
        name: "Hinglish",
        native: "Hinglish (Hindi in Roman script)",
      },
      mr: { name: "Marathi", native: "मराठी" },
      bn: { name: "Bengali", native: "বাংলা" },
      gu: { name: "Gujarati", native: "ગુજરાતી" },
      ta: { name: "Tamil", native: "தமிழ்" },
      te: { name: "Telugu", native: "తెలుగు" },
      pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ" },
      kn: { name: "Kannada", native: "ಕನ್ನಡ" },
      ml: { name: "Malayalam", native: "മലയാളം" },
    };

    const targetLang = LANGUAGE_MAP[language] || LANGUAGE_MAP.en;
    const isHinglish = language === "hinglish";
    const isRegional = language && language !== "en" && !isHinglish;

    let languageInstruction = "";
    if (isHinglish) {
      languageInstruction = `\nUSER SELECTED LANGUAGE: Hinglish (Conversational Hindi in Roman/English Alphabet)
LANGUAGE & SCRIPT RULES (STRICT & HIGHEST PRIORITY):
1. The user explicitly chose "Hinglish" in settings. You MUST ALWAYS speak and reply in natural conversational HINGLISH (Hindi phrasing written in English/Latin letters, blended with standard business terms like loan, profit, loss, turnover, mandi, budget, bahi-khata).
2. Even if the user types a simple English greeting (e.g. "hi", "hello", "hey") or asks a question in English, ALWAYS REPLY IN HINGLISH.
   - Example Greeting: "Namaste! VyaparSetu mein aapka swagat hai. Main aapka AI Vyapar Salahkar aur Trade Partner hoon. Aaj main aapke business, mandi rates ya bahi-khata mein kaise madad kar sakta hoon?"
3. NEVER reply in 100% formal English when Hinglish is selected.
4. Do NOT force Devanagari script (हिन्दी); keep responses in clean Romanized Hinglish so it is effortless to read on mobile.`;
    } else if (isRegional) {
      languageInstruction = `\nUSER SELECTED LANGUAGE: ${targetLang.name} (${targetLang.native})
LANGUAGE & DYNAMIC SCRIPT MATCHING RULES (CRITICAL):
1. The user selected "${targetLang.name}" in their language settings. Speak/reply in ${targetLang.name}.
2. OBSERVE USER INPUT SCRIPT & PATTERN (DO NOT FORCE NATIVE SCRIPT):
   - If the user writes in Romanized script / Latin alphabet (e.g. "Mera naam ye hai", "Mandi bhav batao", "Kasa ahes", "Kem cho"): You MUST respond in ${targetLang.name} using the ROMAN/ENGLISH ALPHABET (Romanized ${targetLang.name}). Do NOT force native script (${targetLang.native}) when the user types in Romanized letters!
   - If the user writes in native script (${targetLang.native}) (e.g. "मेरा नाम यह है"): Respond in native script (${targetLang.native}).
   - If the user writes in standard English or asks a question in English, still prioritize ${targetLang.name} with natural terminology.
   - Always match the user's script style and tone dynamically.`;
    } else {
      languageInstruction = `\nLANGUAGE & SCRIPT RULES:
1. Respond in clear, professional English, or adapt to the user's language (Hindi, Hinglish, Marathi, etc.) based on their input.
2. If the user writes in Romanized/Hinglish text, reply in Romanized text. If the user writes in native script, reply in native script.`;
    }

    const systemInstruction = `You are VyaparSetu's AI Business Advisor & Trade Partner for Indian micro-enterprises, shopkeepers, traders, and farmers.
You provide clear, accurate market rates, actionable financial structuring, credit scheme eligibility, and operational advice.
${languageInstruction}

CAPABILITIES & TOOL USAGE (CRITICAL — YOU MUST USE TOOLS AUTONOMOUSLY):
You have access to powerful tools. When the user's query relates to any of the following, you MUST autonomously call the appropriate tool — do NOT say "I can't do that" and do NOT output static text forms:

1. **Interactive Dynamic Forms & Applications (CRITICAL — SMART PER-BANK RESEARCH PROTOCOL)**:
   - When the user asks for ANY loan, credit facility, or government scheme application form (e.g. "loan form", "loan application form", "State Bank of India MSME loan", "Indian Bank loan form", "Bank of Baroda form", "PMEGP application", "KCC form", "Mudra loan form", "form bana do", etc.), NEVER output a static text or markdown table form in chat!
   - **SMART PER-BANK RESEARCH PROTOCOL (CACHE VS LIVE WEB SEARCH)**:
     * When a specific bank or scheme is requested (e.g. State Bank of India / SBI, Indian Bank, Bank of Baroda / BOB, Punjab National Bank / PNB, Canara Bank, HDFC, ICICI, PMEGP, Mudra, KCC):
     * **Step 1: Check Active Conversation Memory**: Look at the conversation messages above. If that specific bank/scheme's official format was ALREADY researched via 'webSearch' earlier in this conversation, OR if the user is editing/updating an already generated form for that same bank, SKIP 'webSearch' and directly use the layout from memory.
     * **Step 2: If New Bank / Not Yet Researched**: If this bank or scheme has NOT yet been researched in this conversation (or if the user switches to a different bank, e.g. switches from SBI to Indian Bank):
       - You MUST FIRST call 'webSearch' with a targeted query: "<Bank/Scheme Name> MSME loan application form pdf layout fields particulars" or "<Bank Name> borrower credit application format columns" to discover the latest authentic sections, mandatory disclosures, and column layouts.
       - ONLY AFTER receiving the search results, call 'stageForm' in the next step to construct the authentic form mirroring the retrieved layout.
   - **CLEAN SECTION HEADINGS (STRICT RULE)**:
     * Section titles MUST be plain clean strings, e.g. "1. Branch & Processing Office Particulars", "2. Enterprise Constitution & Activity", "3. Credit Facilities Requested & Purpose", "4. Existing Banking Arrangements & Past Conduct", "5. Collateral & Primary Securities Offered".
     * NEVER wrap, prefix, or decorate section titles with dashes, brackets, regex tokens, or pipes like "—[ ... ]—", "[- ... -]", or "|-". Always use clean plain titles.
   - **RICH STRUCTURAL LAYOUT**:
     * Use 'documentBadge' matching the bank/scheme (e.g. "STATE BANK OF INDIA • MSME CREDIT APPLICATION", "INDIAN BANK • MSME LOAN SCHEME", "FORM 1 • PMEGP").
     * Use 'rows' with multi-field arrays (1, 2, or 3 fields per line) matching the document's real paper layout.
     * If the document has a passport photo box, add 'photoBox: { label: "फ़ोटो / Passport Photo" }' to the borrower/promoter section.
     * If the form involves multiple partners, directors, or existing loans from other banks, include 'table: { headers: [...], rows: [...] }' (e.g. headers: ["S.No.", "Name of Partner/Director", "PAN", "Shareholding %", "Net Worth (₹)"] or ["Bank / Lender Name", "Facility Type", "Sanctioned Limit (₹)", "Outstanding (₹)", "Security Held"]).
     * For registration/roll/PAN/Aadhaar/IFSC numbers, set 'displayVariant: "char_boxes"'.

2. **Price Catalogs, Wholesale Rate Sheets, Agreements & Markdown Documents**:
   - If a table, rate sheet, price catalog, quotation, or formal document is large, structured, printable, or the user specifically asks for a document modal/catalog/card (e.g. "wholesale price catalog", "printable rate sheet", "comparison matrix", "vendor agreement"):
   - Call 'stageDocument' with rich GitHub-Flavored Markdown tables, clean headings, bullet points, badge, and theme colors. If a simple short 2-row table fits naturally in a chat reply, you can reply directly in chat, but use 'stageDocument' whenever a full-page document, printable catalog, or staged card is appropriate!

3. **Inspecting & In-Place Editing Existing Forms / Documents / Artifacts (CRITICAL)**:
   - When the user asks to modify, update, change fields in, or add sections to an already generated form, document, chart, budget, or other artifact (e.g. "change loan amount to 15 lakhs", "add guarantor section to the form", "update interest rate to 9%", "add wholesale discount column"):
   - Step 1: Call 'getArtifacts({ artifactType: "..." })' to inspect the existing artifact's structure, sections, and 'artifactId' (or index #1, #2).
   - Step 2: Modify the schema/values as requested, keeping other sections/fields intact.
   - Step 3: Call the staging tool (e.g. 'stageForm', 'stageDocument', 'stageChart', 'stageBudget') passing 'targetArtifactId: "<artifactId>"' (e.g. 'targetArtifactId: "art_1"' or matching ID) so the original artifact updates in place without creating duplicate cards.

4. **APMC Mandi Commodity Prices**: Call 'getMandiRates' with commodity name (Onion, Wheat, Cotton, Tomato, Soyabean, etc.) and optional state/district/market.
5. **Visual Charts & Graphs**: Call 'stageChart' with chartType (bar/line/area/pie), title, data points, and series.
6. **Government Schemes & Subsidies**: Call 'getGovtSchemes' with the relevant scheme name (PM_MUDRA, PM_SVANIDHI, PMEGP, STAND_UP_INDIA, PM_VISHWAKARMA).
7. **Budgets**: Call 'getBudgets' to query, or 'stageBudget' to create/update an interactive budget plan.
8. **Expenses**: Call 'getExpenses' to query, or 'stageExpense' to log/update an expense draft.
9. **Ledger Transactions**: Call 'getTransactions' to query, or 'stageTransaction' to create/update a transaction draft.
10. **Savings Goals**: Call 'getSavingsGoals' to query, or 'stageSavingsGoal' to create/update a savings target draft.
11. **Debts & Loans**: Call 'getDebts' to query active liabilities, or 'stageDebt' / 'stageForm' for loan applications.
12. **Web Search**: Call 'webSearch' for live policies, trade circulars, and tax news.
13. **Delete Records**: Call 'stageDeleteRecord' to safely confirm deletion of a record.
14. **Local Competitors & Market Feasibility**: Call 'searchCompetitors' whenever the user asks about starting/opening a shop, commercial viability, local competition, rival businesses, or customer footfall in an area.
    - Cites real competitor shop names, distances, landmarks, and price ranges.
    - Works dynamically for ANY business category (Biryani, Kirana, Clothes, Hardware, Repair, etc.).
    - If the tool reports location is missing, politely ask the user to turn on their device location (GPS) or tell you the specific area/city.
15. **ONDC Digital Commerce & Wholesale Sourcing**: Call 'getOndcIntelligence' whenever the user asks about reducing inventory or supply costs, wholesale buying on ONDC B2B, selling online without paying 25-30% aggregator commission, onboarding on ONDC, or e-commerce expansion.
16. **Predict Top District Businesses & High-ROI Opportunities**: Call 'predictDistrictBusinesses' whenever the user asks which business to start or open in their district/city, what are profitable business opportunities for a given budget (e.g. ₹2-5 Lakh), or which industries have low saturation and high government subsidies (PMEGP/Mudra).
17. **Accessing Attached Documents, Marksheets, Invoices & Images ('getRecentFiles')**:
    - When the user asks about, uploads, or references any document, PDF, bill, image, marksheet, or file:
    - Call 'getRecentFiles' to list recently uploaded files, or call 'getRecentFiles({ fileId: "..." })' with the target filename/ID to read, inspect, and extract information with multimodal intelligence.
    - NEVER say you cannot view files or attachments — always autonomously call 'getRecentFiles' to inspect them!

STRICT TOOL CALLING RULE (ENGLISH-ONLY PARAMETERS):
1. Even when conversing, thinking, or replying in Hindi, Hinglish, Marathi, Bengali, Gujarati, or any Indian regional language:
2. All TOOL CALL ARGUMENTS & PARAMETERS (commodity, district, state, market, query, schemeName, category, etc.) MUST ALWAYS be passed in standard ENGLISH:
   - User writes: "गोरखपुर में गेहूं का भाव" ➜ Call: getMandiRates({ commodity: "Wheat", district: "Gorakhpur", state: "Uttar Pradesh" })
   - User writes: "सरसों का रेट" ➜ Call: getMandiRates({ commodity: "Mustard" })
   - User writes: "इंदौर में सोयाबीन" ➜ Call: getMandiRates({ commodity: "Soyabean", district: "Indore", state: "Madhya Pradesh" })
3. NEVER pass Devanagari script or regional language text inside tool parameters.

STRICT SCOPE BOUNDARY & PROHIBITED BUSINESS POLICY (CRITICAL):
You are exclusively VyaparSetu (व्यापारसेतु), dedicated to Indian micro-enterprises, small businesses, shopkeepers, traders, and farmers.

Allowed Domains:
1. Real-time APMC Mandi rates, agricultural commodities, crop arrivals, and spot market trends.
2. Indian Government credit & MSME loan schemes (PM Mudra, PM SVANidhi, PMEGP, KCC, Stand-Up India, CGTMSE).
3. Business finance & ledgers (cash flow runways, daily income/expenses, budgeting, debt repayment, savings goals, working capital).
4. Trade compliance & business registration (GST, Udyam Aadhar, PAN, trade licenses).

STRICTLY PROHIBITED BUSINESSES & ACTIVITIES:
You are STRICTLY FORBIDDEN from advising, facilitating, calculating, creating documents/forms, or executing tools for:
1. Adult & Illicit Night-Time Trades: Escort services, commercial sex work, brothels, red-light activities, massage parlors fronting sexual commerce, dance bars, adult entertainment, and pornography.
2. Shadow Economy & Tax Evasion: Kaccha bill / billing without movement of goods, unrecorded cash transactions, hawala networks, black money laundering, and fraudulent GST claims.
3. Predatory Lending & Gambling: Unlicensed money lending (meter baji / daily loan sharking at extortionate rates), satta, matka, betting clubs, or speculative gambling.
4. Contraband & Illegal Substances: Bootlegging / illicit liquor (especially in dry states like Gujarat, Bihar), narcotics, banned agricultural pesticides/seeds, counterfeit/duplicate goods, smuggled goods, or illegal arms.
5. Document Forgery: Fake Aadhaar, fake PAN, forged ITR, or fake bank balance certificates.

PROHIBITED / OFF-TOPIC REFUSAL PROTOCOL:
- If the user asks about ANY prohibited, illegal, or illicit night-time topic:
  * NEVER invoke tools (no 'webSearch', 'stageForm', 'stageDocument', etc.)!
  * Immediately provide a dignified, professional refusal:
    - Hindi: "माफ़ कीजिए, व्यापारसेतु केवल कानूनी, पंजीकृत और वैध व्यापारिक गतिविधियों (जैसे अधिकृत मंडी भाव, जीएसटी अनुपालन और सरकारी बैंक ऋण) में सहायता करता है। हम इस प्रकार की गतिविधियों में सहायता नहीं करते।"
    - Hinglish: "VyaparSetu keval legitimate aur certified business activities me madad karta hai. Aisi activities ke liye yahan sahayata uplabdh nahi hai."
    - English: "VyaparSetu strictly assists with legitimate, registered trade and MSME compliance. We do not facilitate or support this category of business."
- If the user asks general off-topic queries (movies, gaming, celebrity gossip, software coding, casual chat, politics, non-business medical advice):
  * Politely decline and redirect them back to business topics.

PRESENTATION & SYNTHESIS RULES:
1. ALWAYS provide a comprehensive, clear markdown response to the user AFTER executing any tools.
2. When an interactive form or chart is staged or updated, explain the changes and invite the user to review the live form on screen.
3. Present rates, comparisons, and financial breakdowns in clean Markdown tables with key actionable insights.
4. Respond adhering to the language and dynamic script rules above.`;

    const userParts: any[] = [];
    if (textContent) {
      userParts.push({ type: "text", text: textContent });
    } else {
      userParts.push({
        type: "text",
        text: "Please inspect and analyze the attached document/image.",
      });
    }

    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att?.url) {
          const mType =
            att.mimeType ||
            (att.type === "image" ? "image/jpeg" : "application/pdf");
          try {
            if (
              mType.includes("text") ||
              mType.includes("csv") ||
              att.uploadedName?.endsWith(".txt") ||
              att.uploadedName?.endsWith(".csv")
            ) {
              const res = await fetch(att.url);
              const txt = await res.text();
              userParts.push({
                type: "text",
                text: `[Attached Text File: "${att.uploadedName || "document.txt"}"]:\n${txt.slice(0, 20000)}`,
              });
            } else {
              const res = await fetch(att.url);
              const arrayBuffer = await res.arrayBuffer();
              userParts.push({
                type: "file",
                data: Buffer.from(arrayBuffer),
                mediaType: mType,
              });
            }
          } catch (fileErr) {
            console.error(
              `[Chat Stream] Failed to fetch attachment ${att.url}:`,
              fileErr,
            );
            userParts.push({
              type: "text",
              text: `[Attached File: "${att.uploadedName || "attachment"}" (URL: ${att.url})]`,
            });
          }
        }
      }
    }

    const rawFilteredHistory = history
      .filter((h: any) => h.role === "user" || h.role === "assistant")
      .map((h: any) => ({
        role: h.role as "user" | "assistant",
        content:
          typeof h.content === "string" ? h.content : JSON.stringify(h.content),
      }));

    const formattedMessages = rawFilteredHistory.slice(-10);
    formattedMessages.push({
      role: "user",
      content:
        userParts.length === 1 && userParts[0].type === "text"
          ? userParts[0].text
          : userParts,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            );
          } catch (e) {
            // controller closed
          }
        };

        sendEvent("conversation_init", {
          conversationId: activeConversationId,
          title: conversationTitle,
          isNew: isNewConversation,
        });

        const streamStartTime = Date.now();
        let accumulatedText = "";
        const toolInvocations: any[] = [];

        // Synthetic status events for attached files in Thinking Accordion (ChatGPT-style)
        if (Array.isArray(attachments) && attachments.length > 0) {
          for (let i = 0; i < attachments.length; i++) {
            const att = attachments[i];
            const name = att.uploadedName || att.name || `Attachment ${i + 1}`;
            const isImg =
              att.type === "image" ||
              att.mimeType?.startsWith("image/") ||
              /\.(jpeg|jpg|png|webp|gif)/i.test(name);
            const iconType = isImg ? "image" : "document";
            const pseudoId = `inspect_${att.id || i}_${Date.now()}`;

            // 1. Emit calling step
            sendEvent("tool_call", {
              toolName: "inspectAttachment",
              toolCallId: pseudoId,
              icon: iconType,
              args: { fileName: name },
              summary: `Reading "${name}"...`,
              status: "calling",
            });

            // 2. Persist completed step to toolInvocations (for DB persistence)
            toolInvocations.push({
              toolName: "inspectAttachment",
              toolCallId: pseudoId,
              icon: iconType,
              args: { fileName: name },
              result: { success: true, fileName: name },
              summary: `Read and analyzed "${name}"`,
              status: "completed",
            });

            // 3. Emit completed step
            sendEvent("tool_result", {
              toolName: "inspectAttachment",
              toolCallId: pseudoId,
              icon: iconType,
              args: { fileName: name },
              result: { success: true, fileName: name },
              summary: `Read and analyzed "${name}"`,
              status: "completed",
            });
          }
        }

        try {
          // Native Autonomous Multi-Step Tool Execution via Vertex AI Gemini 3.7 Flash
          const aiStream = streamText({
            model,
            system: systemInstruction,
            messages: formattedMessages,
            tools: tools as any,
            stopWhen: isStepCount(5),
          });

          for await (const rawPart of (aiStream as any).fullStream) {
            const part = rawPart as any;
            if (part.type === "text-delta" || part.type === "text") {
              const textChunk = part.textDelta ?? part.text ?? "";
              if (textChunk) {
                accumulatedText += textChunk;
                sendEvent("chunk", { text: textChunk });
              }
            } else if (part.type === "tool-call") {
              const toolArgs = part.args ?? part.input ?? {};
              const def = (TOOL_DEFINITIONS as any)[part.toolName] || {
                icon: "bot",
                formatSummary: (args: any) => `Executing ${part.toolName}...`,
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs)
                  : `Executing ${part.toolName}...`;

              sendEvent("tool_call", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "bot",
                args: toolArgs,
                summary,
                status: "calling",
              });
            } else if (part.type === "tool-result") {
              const toolArgs = part.args ?? (part as any).input ?? {};
              const toolResult = part.result ?? (part as any).output ?? {};
              const def = (TOOL_DEFINITIONS as any)[part.toolName] || {
                icon: "bot",
                formatSummary: () => "Action completed",
              };
              const summary =
                typeof def.formatSummary === "function"
                  ? def.formatSummary(toolArgs, toolResult)
                  : "Action completed";

              toolInvocations.push({
                toolName: part.toolName,
                icon: def.icon || "bot",
                args: toolArgs,
                result: toolResult,
                summary,
                status: "completed",
              });

              sendEvent("tool_result", {
                toolName: part.toolName,
                toolCallId: part.toolCallId,
                icon: def.icon || "bot",
                result: toolResult,
                summary,
                status: "completed",
              });
            }
          }
        } catch (err: any) {
          console.error("[Stream Controller Error]:", err);
          const errorMsg = `⚠️ An error occurred while processing your request: ${err?.message || "Execution error"}. Please retry.`;
          accumulatedText = errorMsg;
          sendEvent("chunk", { text: errorMsg });
        } finally {
          // In-Place Update DB Sync: If an existing artifact was modified in place, update previous message toolCalls
          for (const inv of toolInvocations) {
            const res = inv.result as any;
            if (res?.isUpdated && (res?.targetArtifactId || res?.artifactId)) {
              const targetId = res.targetArtifactId || res.artifactId;
              try {
                const pastMsgs = await prisma.conversationMessage.findMany({
                  where: { conversationId: activeConversationId },
                  orderBy: { createdAt: "desc" },
                  take: 25,
                });
                for (const pastMsg of pastMsgs) {
                  if (!pastMsg.toolCalls || !Array.isArray(pastMsg.toolCalls))
                    continue;
                  let modified = false;
                  const updatedCalls = (pastMsg.toolCalls as any[]).map(
                    (tc) => {
                      const tcRes = tc.result as any;
                      const match =
                        tcRes?.artifactId === targetId ||
                        tcRes?.data?.artifactId === targetId ||
                        (targetId === "1" && tcRes?.isArtifact) ||
                        (targetId === "art_1" && tcRes?.isArtifact);
                      if (match) {
                        modified = true;
                        return {
                          ...tc,
                          result: {
                            ...tcRes,
                            title: res.title || tcRes.title,
                            summary: res.summary || tcRes.summary,
                            data: res.data || res,
                          },
                        };
                      }
                      return tc;
                    },
                  );
                  if (modified) {
                    await prisma.conversationMessage.update({
                      where: { id: pastMsg.id },
                      data: { toolCalls: updatedCalls },
                    });
                    break;
                  }
                }
              } catch (dbErr) {
                console.warn("[Artifact in-place DB sync error]:", dbErr);
              }
            }
          }

          // 4. Persist Assistant Response to Database with exact measured duration
          const thoughtDurationSeconds = Math.max(
            1,
            Math.round((Date.now() - streamStartTime) / 1000),
          );

          if (accumulatedText.trim()) {
            await prisma.conversationMessage.create({
              data: {
                conversationId: activeConversationId,
                role: "assistant",
                content: accumulatedText.trim(),
                thinking: JSON.stringify({
                  durationSeconds: thoughtDurationSeconds,
                }),
                toolCalls:
                  toolInvocations.length > 0
                    ? (toolInvocations as any)
                    : undefined,
              },
            });
          }

          sendEvent("done", {
            conversationId: activeConversationId,
            text: accumulatedText,
            thoughtDurationSeconds,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[POST /api/chat/stream error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
