import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    const body = await req.json();

    const { savingGoalId, amount, notes } = body;
    if (!savingGoalId || !amount) {
      return NextResponse.json({ error: "Goal ID and amount are required" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid contribution amount" }, { status: 400 });
    }

    // Verify ownership
    const goal = await prisma.savingGoal.findFirst({
      where: {
        id: savingGoalId,
        businessId: business.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const [contribution, updatedGoal] = await prisma.$transaction([
      prisma.savingContribution.create({
        data: {
          savingGoalId,
          amount: parsedAmount,
          notes: notes || null,
        },
      }),
      prisma.savingGoal.update({
        where: { id: savingGoalId },
        data: {
          savedAmount: { increment: parsedAmount },
        },
        include: {
          contributions: { orderBy: { date: "desc" } },
        },
      }),
    ]);

    // Also record transaction
    await prisma.transaction.create({
      data: {
        businessId: business.id,
        type: "SAVING",
        amount: parsedAmount,
        date: new Date(),
        category: "Savings Deposit",
        description: `Deposit for goal: ${goal.name}`,
        referenceId: contribution.id,
      },
    });

    return NextResponse.json({ contribution, goal: updatedGoal });
  } catch (error) {
    console.error("POST /api/savings/contribute error:", error);
    return NextResponse.json({ error: "Failed to record contribution" }, { status: 500 });
  }
}
