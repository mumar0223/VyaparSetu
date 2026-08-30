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
    const budgets = await prisma.budget.findMany({
      where: { businessId: business.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Also fetch active expenses to compute category variance
    const expenses = await prisma.expense.findMany({
      where: {
        businessId: business.id,
        deletedAt: null,
      },
    });

    const categorySpentMap = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const budgetsWithSpent = budgets.map((b) => ({
      ...b,
      items: b.items.map((item) => ({
        ...item,
        actualSpent: categorySpentMap[item.category] || 0,
      })),
      totalSpent: b.items.reduce((sum, item) => sum + (categorySpentMap[item.category] || 0), 0),
    }));

    return NextResponse.json(budgetsWithSpent);
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
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

    const { name, period, startDate, endDate, totalAmount, items } = body;
    if (!name || !totalAmount) {
      return NextResponse.json({ error: "Budget name and total amount are required" }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        businessId: business.id,
        name,
        period: period || "Monthly",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalAmount: parseFloat(totalAmount),
        items: {
          create: (items || []).map((item: { category: string; allocatedAmount: number | string }) => ({
            category: item.category,
            allocatedAmount: parseFloat(String(item.allocatedAmount)),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
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
      return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    await prisma.budget.deleteMany({
      where: {
        id,
        businessId: business.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/budgets error:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}
