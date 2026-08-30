import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { DebtType } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    const debts = await prisma.debt.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(debts);
  } catch (error) {
    console.error("GET /api/debts error:", error);
    return NextResponse.json({ error: "Failed to fetch debts" }, { status: 500 });
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

    const { type, lender, amountOutStanding, totalAmount, interestRate, nextPaymentDate, emiAmount, status } = body;
    if (!lender || !amountOutStanding) {
      return NextResponse.json({ error: "Lender and outstanding amount are required" }, { status: 400 });
    }

    const debt = await prisma.debt.create({
      data: {
        businessId: business.id,
        type: (type as DebtType) || "TERM_LOAN",
        lender,
        amountOutStanding: parseFloat(amountOutStanding),
        totalAmount: totalAmount ? parseFloat(totalAmount) : parseFloat(amountOutStanding),
        interestRate: interestRate ? parseFloat(interestRate) : null,
        nextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate) : null,
        emiAmount: emiAmount ? parseFloat(emiAmount) : null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json(debt);
  } catch (error) {
    console.error("POST /api/debts error:", error);
    return NextResponse.json({ error: "Failed to create debt" }, { status: 500 });
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
      return NextResponse.json({ error: "Debt ID is required" }, { status: 400 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    await prisma.debt.deleteMany({
      where: {
        id,
        businessId: business.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/debts error:", error);
    return NextResponse.json({ error: "Failed to delete debt" }, { status: 500 });
  }
}
