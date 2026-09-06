import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { createDbSession } from "@/lib/auth";
import { getAndClearPasskeyChallenge, getOrigin, getRpID } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const credentialId = body.id;

    if (!credentialId) {
      return NextResponse.json(
        { error: "Missing credential identification." },
        { status: 400 }
      );
    }

    const expectedChallenge = await getAndClearPasskeyChallenge();
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: "Login session timed out. Please try again." },
        { status: 400 }
      );
    }

    // Look up the registered passkey in PostgreSQL
    const passkey = await prisma.passkey.findUnique({
      where: { credentialId },
      include: { user: true },
    });

    if (!passkey || !passkey.user || !passkey.user.isActive) {
      return NextResponse.json(
        { error: "Biometric credential not recognized or user account is inactive." },
        { status: 401 }
      );
    }

    const expectedOrigin = getOrigin(req);
    const expectedRPID = getRpID(req);

    // Convert stored base64url public key back to Uint8Array
    const publicKeyBytes = new Uint8Array(Buffer.from(passkey.publicKey, "base64url"));

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: passkey.credentialId,
        publicKey: publicKeyBytes,
        counter: Number(passkey.counter),
        transports: (passkey.transports || []) as any,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json(
        { error: "Biometric authentication signature invalid." },
        { status: 401 }
      );
    }

    // Update passkey counter and usage timestamp
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    // Update user last login
    await prisma.user.update({
      where: { id: passkey.userId },
      data: { lastLoginAt: new Date() },
    });

    // Reuse the exact existing session creation logic
    await createDbSession(passkey.userId);

    return NextResponse.json({
      success: true,
      user: {
        id: passkey.user.id,
        name: passkey.user.name,
        email: passkey.user.email,
        role: passkey.user.role,
      },
    });
  } catch (error) {
    console.error("[passkey-login-verify] failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify biometric login" },
      { status: 500 }
    );
  }
}
