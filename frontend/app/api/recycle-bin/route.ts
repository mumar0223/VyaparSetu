import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    const trashedExpenses = await prisma.expense.findMany({
      where: {
        businessId: business.id,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
    });

    return NextResponse.json(trashedExpenses);
  } catch (error) {
    console.error("GET /api/recycle-bin error:", error);
    return NextResponse.json({ error: "Failed to fetch recycle bin items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    const body = await req.json();
    const { action, id } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "ID and action ('restore' | 'purge') are required" }, { status: 400 });
    }

    if (action === "restore") {
      await prisma.expense.updateMany({
        where: { id, businessId: business.id },
        data: { deletedAt: null },
      });
      return NextResponse.json({ success: true, message: "Item restored successfully" });
    } else if (action === "purge") {
      await prisma.expense.deleteMany({
        where: { id, businessId: business.id },
      });
      return NextResponse.json({ success: true, message: "Item permanently deleted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/recycle-bin error:", error);
    return NextResponse.json({ error: "Failed to process recycle bin action" }, { status: 500 });
  }
}
