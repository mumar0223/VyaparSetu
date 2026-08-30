import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let consent = await prisma.privacyConsent.findUnique({
      where: { userId: user.id },
    });

    if (!consent) {
      consent = await prisma.privacyConsent.create({
        data: {
          userId: user.id,
          dataSharing: true,
          marketingEmails: false,
          termsAccepted: true,
        },
      });
    }

    return NextResponse.json(consent);
  } catch (error) {
    console.error("GET /api/privacy-consent error:", error);
    return NextResponse.json({ error: "Failed to fetch privacy consent" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const consent = await prisma.privacyConsent.upsert({
      where: { userId: user.id },
      update: {
        dataSharing: body.dataSharing !== undefined ? Boolean(body.dataSharing) : undefined,
        marketingEmails: body.marketingEmails !== undefined ? Boolean(body.marketingEmails) : undefined,
        termsAccepted: body.termsAccepted !== undefined ? Boolean(body.termsAccepted) : undefined,
      },
      create: {
        userId: user.id,
        dataSharing: body.dataSharing !== undefined ? Boolean(body.dataSharing) : true,
        marketingEmails: body.marketingEmails !== undefined ? Boolean(body.marketingEmails) : false,
        termsAccepted: body.termsAccepted !== undefined ? Boolean(body.termsAccepted) : true,
      },
    });

    return NextResponse.json(consent);
  } catch (error) {
    console.error("PUT /api/privacy-consent error:", error);
    return NextResponse.json({ error: "Failed to update privacy consent" }, { status: 500 });
  }
}
