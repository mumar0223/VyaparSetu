import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.settings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: user.id,
          currency: "INR",
          language: "en",
          theme: "light",
          emailAlerts: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const settings = await prisma.settings.upsert({
      where: { userId: user.id },
      update: {
        currency: body.currency,
        language: body.language,
        theme: body.theme,
        emailAlerts: body.emailAlerts !== undefined ? Boolean(body.emailAlerts) : undefined,
      },
      create: {
        userId: user.id,
        currency: body.currency || "INR",
        language: body.language || "en",
        theme: body.theme || "light",
        emailAlerts: body.emailAlerts !== undefined ? Boolean(body.emailAlerts) : true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
