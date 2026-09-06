import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { getRpID, setPasskeyChallenge } from "@/lib/passkey";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email?.trim()?.toLowerCase();

    const rpID = getRpID(req);

    // If email is provided, restrict to this user's passkeys; otherwise allow discoverable credentials (1-tap login)
    let allowCredentials = undefined;
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { passkeys: true },
      });

      if (user && user.passkeys.length > 0) {
        allowCredentials = user.passkeys.map((p) => ({
          id: p.credentialId,
          transports: (p.transports || []) as any,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials,
    });

    // Save challenge in secure HTTP-only cookie
    await setPasskeyChallenge(options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error("[passkey-login-options] failed:", error);
    return NextResponse.json(
      { error: "Failed to generate biometric login challenge" },
      { status: 500 }
    );
  }
}
