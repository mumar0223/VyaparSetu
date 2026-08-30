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
    return NextResponse.json(business);
  } catch (error) {
    console.error("GET /api/business error:", error);
    return NextResponse.json({ error: "Failed to fetch business profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const existing = await getOrCreateUserBusiness(user.id);

    const updated = await prisma.business.update({
      where: { id: existing.id },
      data: {
        businessName: body.businessName ?? existing.businessName,
        businessType: body.businessType ?? existing.businessType,
        industry: body.industry ?? existing.industry,
        category: body.category ?? existing.category,
        description: body.description ?? existing.description,
        registrationNumber: body.registrationNumber ?? existing.registrationNumber,
        taxNumber: body.taxNumber ?? existing.taxNumber,
        address: body.address ?? existing.address,
        city: body.city ?? existing.city,
        state: body.state ?? existing.state,
        country: body.country ?? existing.country,
        pincode: body.pincode ?? existing.pincode,
        numberOfEmployees: body.numberOfEmployees !== undefined ? Number(body.numberOfEmployees) : existing.numberOfEmployees,
        annualRevenue: body.annualRevenue !== undefined ? Number(body.annualRevenue) : existing.annualRevenue,
        monthlyRevenue: body.monthlyRevenue !== undefined ? Number(body.monthlyRevenue) : existing.monthlyRevenue,
        monthlyExpenses: body.monthlyExpenses !== undefined ? Number(body.monthlyExpenses) : existing.monthlyExpenses,
        businessGoals: body.businessGoals ?? existing.businessGoals,
      },
      include: {
        milestones: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/business error:", error);
    return NextResponse.json({ error: "Failed to update business profile" }, { status: 500 });
  }
}
