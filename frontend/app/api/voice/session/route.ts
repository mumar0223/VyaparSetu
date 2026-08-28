import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIVE_VOICE_AGENT_CONFIG } from "@/lib/agent/chat-config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleVoiceSession(req);
}

export async function GET(req: NextRequest) {
  return handleVoiceSession(req);
}

async function handleVoiceSession(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env" },
        { status: 500 },
      );
    }

    let conversationId: string | undefined;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      conversationId = body.conversationId;
    } else {
      const url = new URL(req.url);
      conversationId = url.searchParams.get("conversationId") || undefined;
    }

    const model =
      LIVE_VOICE_AGENT_CONFIG.model ||
      "models/gemini-2.5-flash-native-audio-latest";
    const voiceName = LIVE_VOICE_AGENT_CONFIG.voiceName || "Puck";
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    let baseSystemInstruction = `You are VyaparSetu Voice OS, an AI voice partner for Indian micro-enterprises, rural businesses, and farmers.
RULES:
1. Speak ONLY in natural, energetic conversational Hindi and Hinglish.
2. Never speak in English.
3. NEVER output thinking process, meta commentary, or explanations. Speak ONLY the exact direct response words to the user.
4. Keep all responses to 1 to 2 short spoken sentences.
5. When the user asks for mandi rates or loan schemes, call the appropriate tools.`;

    // Fetch prior messages for thread continuity
    if (conversationId) {
      const historyMessages = await prisma.conversationMessage.findMany({
        where: {
          conversationId,
          conversation: { userId: user.id },
        },
        take: 25,
        orderBy: { createdAt: "desc" },
      });

      if (historyMessages.length > 0) {
        const chronological = historyMessages.reverse();
        const formattedHistory = chronological
          .map(
            (m) =>
              `[${m.role === "user" ? "User" : "Assistant"}]: ${m.content}`,
          )
          .join("\n");

        baseSystemInstruction += `\n\n--- Prior Conversation History (Last ${chronological.length} turns) ---\n${formattedHistory}\n--- End Prior History ---`;
      }
    }

    const tools = [
      {
        functionDeclarations: [
          {
            name: "getMandiRates",
            description:
              "Fetches live APMC market prices, daily arrivals, and price trends for commodities across Indian mandis.",
            parameters: {
              type: "OBJECT",
              properties: {
                commodity: {
                  type: "STRING",
                  description:
                    "Name of the agricultural commodity e.g. Onion, Wheat, Tomato, Soybean",
                },
                market: {
                  type: "STRING",
                  description:
                    "Name of the APMC market/mandi e.g. Nashik, Lasalgaon, Indore, Azadpur",
                },
              },
              required: ["commodity"],
            },
          },
          {
            name: "evaluateSchemeEligibility",
            description:
              "Evaluates micro-enterprise credit eligibility for PM Mudra (Shishu/Kishore/Tarun) and PM SVANidhi loans.",
            parameters: {
              type: "OBJECT",
              properties: {
                schemeName: {
                  type: "STRING",
                  description: "Scheme name e.g. PM_MUDRA, PM_SVANIDHI",
                },
                annualTurnover: {
                  type: "NUMBER",
                  description: "Estimated annual business turnover in INR",
                },
              },
              required: ["schemeName"],
            },
          },
        ],
      },
    ];

    return NextResponse.json({
      wsUrl,
      model,
      voiceName,
      systemInstruction: baseSystemInstruction,
      tools,
      conversationId,
    });
  } catch (error: any) {
    console.error("[GET/POST /api/voice/session error]:", error);
    return NextResponse.json(
      { error: "Failed to initialize live voice session" },
      { status: 500 },
    );
  }
}
