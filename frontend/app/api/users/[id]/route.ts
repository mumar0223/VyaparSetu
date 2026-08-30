import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission, hashPassword, createAuditLog } from "@/lib/auth";

// Get single user by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // A user can view their own profile, or admins can view any profile
    if (currentUser.id !== id && !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}

// Update user details, roles, permissions, active status, or password by ID
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isSelf = currentUser.id === id;
    const isManager = hasPermission(currentUser, "users:manage");

    if (!isSelf && !isManager) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { name, role, permissions, isActive, password, avatar } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatar !== undefined) updateData.avatar = avatar;

    // Only managers can change role, permissions, and active status
    if (isManager) {
      if (isActive !== undefined) updateData.isActive = isActive;
      if (role !== undefined) {
        updateData.role = role;
        if (role === "SUPER_ADMIN") {
          updateData.permissions = ["*"];
        } else if (permissions !== undefined) {
          updateData.permissions = Array.isArray(permissions) ? permissions : [];
        }
      } else if (permissions !== undefined) {
        updateData.permissions = Array.isArray(permissions) ? permissions : [];
      }
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }
      updateData.passwordHash = hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        mustChangePassword: true,
        isActive: true,
        avatar: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "UPDATE_USER",
      entity: "User",
      entityId: id,
      details: `Updated account for ${targetUser.email}.`,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

// Delete user by ID
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    if (currentUser.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own active account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    await createAuditLog({
      userId: currentUser.id,
      userEmail: currentUser.email,
      action: "DELETE_USER",
      entity: "User",
      entityId: id,
      details: `Deleted user ${targetUser.email}.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
