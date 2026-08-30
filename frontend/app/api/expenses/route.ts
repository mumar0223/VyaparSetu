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
    const expenses = await prisma.expense.findMany({
      where: {
        businessId: business.id,
        deletedAt: null,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
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

    if (!body.amount || !body.category) {
      return NextResponse.json({ error: "Amount and Category are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        businessId: business.id,
        category: body.category,
        amount: parseFloat(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        vendor: body.vendor || null,
        description: body.description || null,
        paymentMethod: body.paymentMethod || "UPI / Cash",
        recurring: Boolean(body.recurring),
        notes: body.notes || null,
      },
    });

    // Also record a corresponding transaction in the ledger
    await prisma.transaction.create({
      data: {
        businessId: business.id,
        type: "EXPENSE",
        amount: parseFloat(body.amount),
        date: expense.date,
        category: expense.category,
        description: expense.description || `Expense: ${expense.category}`,
        referenceId: expense.id,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
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
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    const business = await getOrCreateUserBusiness(user.id);

    // Soft delete
    const updated = await prisma.expense.updateMany({
      where: {
        id,
        businessId: business.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    console.error("DELETE /api/expenses error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
