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
    const savingGoals = await prisma.savingGoal.findMany({
      where: { businessId: business.id },
      include: {
        contributions: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(savingGoals);
  } catch (error) {
    console.error("GET /api/savings error:", error);
    return NextResponse.json({ error: "Failed to fetch saving goals" }, { status: 500 });
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

    if (!body.name || !body.targetAmount) {
      return NextResponse.json({ error: "Goal name and target amount are required" }, { status: 400 });
    }

    const goal = await prisma.savingGoal.create({
      data: {
        businessId: business.id,
        name: body.name,
        targetAmount: parseFloat(body.targetAmount),
        savedAmount: body.savedAmount ? parseFloat(body.savedAmount) : 0,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        status: body.status || "ACTIVE",
      },
      include: {
        contributions: true,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("POST /api/savings error:", error);
    return NextResponse.json({ error: "Failed to create saving goal" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    await prisma.savingGoal.deleteMany({
      where: {
        id,
        businessId: business.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/savings error:", error);
    return NextResponse.json({ error: "Failed to delete saving goal" }, { status: 500 });
  }
}
