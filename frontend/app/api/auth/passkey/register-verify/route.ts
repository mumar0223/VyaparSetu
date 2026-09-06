import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAndClearPasskeyChallenge, getOrigin, getRpID } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const expectedChallenge = await getAndClearPasskeyChallenge();

    if (!expectedChallenge) {
      return NextResponse.json(
        { error: "Registration session timed out. Please try again." },
        { status: 400 }
      );
    }

    const expectedOrigin = getOrigin(req);
    const expectedRPID = getRpID(req);

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Passkey registration verification failed." },
        { status: 400 }
      );
    }

    const { credential } = verification.registrationInfo;

    // Convert public key bytes to Base64URL string for storage
    const publicKeyBase64 = Buffer.from(credential.publicKey).toString("base64url");

    // Save passkey credential linked to user
    await prisma.passkey.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: publicKeyBase64,
        counter: BigInt(credential.counter || 0),
        deviceName: body.deviceName || "Fingerprint / Passkey",
        transports: body.response?.transports || [],
      },
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("[passkey-register-verify] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify passkey registration" },
      { status: 500 }
    );
  }
}
