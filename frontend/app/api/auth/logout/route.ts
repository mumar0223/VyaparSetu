import { NextResponse } from "next/server";
import { getCurrentUser, revokeDbSession, createAuditLog } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (user) {
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: "LOGOUT",
        entity: "User",
        entityId: user.id,
        details: "User signed out.",
      });
    }

    await revokeDbSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: true });
  }
}
