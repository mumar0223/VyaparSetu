import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { TransactionType } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    const transactions = await prisma.transaction.findMany({
      where: { businessId: business.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
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

    if (!body.amount || !body.type) {
      return NextResponse.json({ error: "Amount and Type are required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        businessId: business.id,
        type: body.type as TransactionType,
        amount: parseFloat(body.amount),
        date: body.date ? new Date(body.date) : new Date(),
        category: body.category || "General",
        description: body.description || null,
        referenceId: body.referenceId || null,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
