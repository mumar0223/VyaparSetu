import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIVE_VOICE_AGENT_CONFIG } from "@/lib/agent/chat-config";
import { GoogleAuth } from "google-auth-library";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleVoiceSession(req);
}

export async function GET(req: NextRequest) {
  return handleVoiceSession(req);
}

async function handleVoiceSession(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const project = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION || "global";
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!project || !clientEmail || !privateKey) {
      return NextResponse.json(
        {
          error:
            "Vertex AI credentials are incomplete. Configure GOOGLE_VERTEX_PROJECT, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY.",
        },
        { status: 500 },
      );
    }

    // Unescape \n in the private key
    privateKey = privateKey.replace(/\\n/g, "\n");

    // Generate short-lived Google OAuth2 access token for Vertex AI Live
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse?.token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to generate Vertex AI access token." },
        { status: 500 },
      );
    }

    const body =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const conversationId =
      body.conversationId ||
      new URL(req.url).searchParams.get("conversationId") ||
      undefined;
    const modelId = (LIVE_VOICE_AGENT_CONFIG.model || "gemini-live-2.5-flash")
      .replace(/^models\//, "")
      .replace(
        /^projects\/[^/]+\/locations\/[^/]+\/publishers\/google\/models\//,
        "",
      );
    const model = `projects/${project}/locations/${location}/publishers/google/models/${modelId}`;

    let systemInstruction = `You are VyaparSetu Voice (व्यापारसेतु), a male AI business advisor and trade partner for Indian micro-enterprises, shopkeepers, traders, and farmers.

MALE PERSONA & GRAMMAR RULES:
1. You are strictly a male persona. In all Indian languages (Hindi, Marathi, Bengali, Punjabi, Gujarati, etc.), always use masculine self-referential verb inflections, pronouns, and adjectives (e.g. in Hindi: "मैं करूँगा", "बता सकता हूँ", "मैं समझता हूँ", never use feminine forms like "करूँगी" or "सकती हूँ").
2. In English, maintain a warm, confident, professional male advisor tone.

MULTILINGUAL SUPPORT (10 Indian Languages):
1. You natively understand and speak: Hindi (हिन्दी), English (India), Bengali (বাংলা), Marathi (मराठी), Telugu (తెలుగు), Tamil (தமிழ்), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), and Punjabi (ਪੰਜਾਬੀ), including Hinglish and colloquial regional business terminology.
2. Always respond directly in the language spoken by the user (or the language the user asks for).
3. Keep spoken replies concise, clear, natural, and respectful. Never read out hidden reasoning.
4. When the user asks for APMC commodity mandi prices, market trends, or loan credit schemes (PM Mudra, PM SVANidhi), execute the relevant tool immediately.`;

    if (conversationId) {
      const history = await prisma.conversationMessage.findMany({
        where: { conversationId, conversation: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { role: true, content: true },
      });
      if (history.length) {
        systemInstruction += `\n\nConversation context:\n${history
          .reverse()
          .map(
            (message) =>
              `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`,
          )
          .join("\n")}`;
      }
    }

    const tools = [
      {
        functionDeclarations: [
          {
            name: "getMandiRates",
            description:
              "Fetches live APMC market prices, arrivals, and trends for an Indian commodity.",
            parameters: {
              type: "OBJECT",
              properties: {
                commodity: {
                  type: "STRING",
                  description: "Commodity, for example Onion, Wheat, or Tomato",
                },
                market: {
                  type: "STRING",
                  description: "Optional APMC market or mandi",
                },
              },
              required: ["commodity"],
            },
          },
          {
            name: "evaluateSchemeEligibility",
            description:
              "Evaluates eligibility for PM Mudra and PM SVANidhi credit schemes.",
            parameters: {
              type: "OBJECT",
              properties: {
                schemeName: {
                  type: "STRING",
                  description: "For example PM_MUDRA or PM_SVANIDHI",
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
      accessToken,
      model,
      voiceName: LIVE_VOICE_AGENT_CONFIG.voiceName || "Puck",
      systemInstruction,
      tools,
      conversationId,
    });
  } catch (error) {
    console.error("[voice/session]", error);
    return NextResponse.json(
      { error: "Failed to initialize the Vertex voice session" },
      { status: 500 },
    );
  }
}
