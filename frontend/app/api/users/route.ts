import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, hashPassword, createAuditLog } from "@/lib/auth";

// List users or get user by email query
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(user);
    }

    if (!hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLoginAt: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

// Create new sub-user account (User-ID-based IAM)
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { name, email, password, role, permissions } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    let finalPermissions = Array.isArray(permissions) ? permissions : [];
    if (role === "SUPER_ADMIN") {
      finalPermissions = ["*"];
    }

    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: role || "USER",
        permissions: finalPermissions,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "CREATE_USER",
      entity: "User",
      entityId: newUser.id,
      details: `Created sub-account for ${newUser.email} with role ${newUser.role}.`,
    });

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
