import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRpID, RP_NAME, setPasskeyChallenge } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve existing passkeys to prevent duplicate registrations on the same device
    const existingPasskeys = await prisma.passkey.findMany({
      where: { userId: user.id },
      select: { credentialId: true, transports: true },
    });

    const rpID = getRpID(req);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: "none",
      excludeCredentials: existingPasskeys.map((p) => ({
        id: p.credentialId,
        transports: (p.transports || []) as any,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Save challenge in secure HTTP-only cookie
    await setPasskeyChallenge(options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error("[passkey-register-options] failed:", error);
    return NextResponse.json(
      { error: "Failed to generate passkey registration options" },
      { status: 500 }
    );
  }
}
