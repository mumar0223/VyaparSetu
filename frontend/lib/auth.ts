import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { AuthUser } from "./auth-types";

export const SESSION_COOKIE_NAME = "vyaparsetu_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export { type AuthUser } from "./auth-types";

// In-memory high-speed cache for active session tokens (30 seconds TTL)
interface CachedSession {
  user: AuthUser;
  expiresAt: number;
}
const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 30 * 1000;

/**
 * Hashes a plain password using PBKDF2 with 100,000 iterations and a 16-byte random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain password against a stored salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const computedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(computedHash, "hex")
  );
}

/**
 * Creates a persistent database session for the user and sets the HTTP-only cookie
 */
export async function createDbSession(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // Store active session in PostgreSQL
  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          mustChangePassword: true,
          isActive: true,
          lastLoginAt: true,
          avatar: true,
        },
      },
    },
  });

  // Update user lastLoginAt timestamp
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  // Populate cache for 0.01ms instant subsequent access
  if (session.user) {
    sessionCache.set(sessionToken, {
      user: session.user,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

/**
 * Revokes an active database session and clears cache
 */
export async function revokeDbSession(token?: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = token || cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      sessionCache.delete(sessionToken);
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (err) {
    console.error("Error revoking session:", err);
  }
}

/**
 * Revokes all sessions for a specific user
 */
export async function revokeAllUserSessions(userId: string) {
  try {
    sessionCache.clear();
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (err) {
    console.error("Error revoking all user sessions:", err);
  }
}

/**
 * Resolves the currently authenticated user on the server.
 * Uses in-memory caching to avoid round-trip latency, falling back to database verification.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const sessionToken = sessionCookie.value;

    // 1. Fast in-memory cache check (< 0.01ms)
    const cached = sessionCache.get(sessionToken);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }

    // 2. Query database session
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
            mustChangePassword: true,
            isActive: true,
            lastLoginAt: true,
            avatar: true,
          },
        },
      },
    });

    if (!session) {
      sessionCache.delete(sessionToken);
      return null;
    }

    // 3. Check if session has expired
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      sessionCache.delete(sessionToken);
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // 4. Confirm user exists and is active in database
    if (!session.user || !session.user.isActive) {
      sessionCache.delete(sessionToken);
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Store in cache
    sessionCache.set(sessionToken, {
      user: session.user,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return session.user;
  } catch (err) {
    console.error("Failed to retrieve current user session:", err);
    return null;
  }
}

/**
 * Requires an authenticated user or throws an unauthorized error
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Checks if user has a required permission or is a Super Admin
 */
export function hasPermission(user: AuthUser, requiredPermission: string): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === "SUPER_ADMIN" || user.permissions.includes("*")) return true;
  return user.permissions.includes(requiredPermission);
}

/**
 * Audit log helper
 */
export async function createAuditLog(data: {
  userId?: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
