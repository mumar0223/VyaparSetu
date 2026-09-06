import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const RP_NAME = "VyaparSetu";
export const PASSKEY_CHALLENGE_COOKIE = "vyaparsetu_passkey_challenge";

/**
 * Extracts RP ID (domain without port) dynamically from request headers
 * This seamlessly supports localhost, ngrok tunnels, and custom domains.
 */
export function getRpID(req: NextRequest | Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost";
  return host.split(":")[0];
}

/**
 * Extracts the exact Origin (protocol + host) from request headers
 */
export function getOrigin(req: NextRequest | Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Sets the WebAuthn challenge in an HTTP-only short-lived cookie (5 minutes)
 */
export async function setPasskeyChallenge(challenge: string) {
  const cookieStore = await cookies();
  cookieStore.set(PASSKEY_CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });
}

/**
 * Retrieves and clears the stored WebAuthn challenge from cookie
 */
export async function getAndClearPasskeyChallenge(): Promise<string | null> {
  const cookieStore = await cookies();
  const challenge = cookieStore.get(PASSKEY_CHALLENGE_COOKIE)?.value || null;
  if (challenge) {
    cookieStore.delete(PASSKEY_CHALLENGE_COOKIE);
  }
  return challenge;
}
