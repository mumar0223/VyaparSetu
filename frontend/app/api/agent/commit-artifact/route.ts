import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await getOrCreateUserBusiness(user.id);
    const body = await req.json();
    const { artifactType, data } = body;

    if (!artifactType || !data) {
      return NextResponse.json(
        { error: "artifactType and data are required" },
        { status: 400 }
      );
    }

    let createdRecord: any = null;

    if (artifactType === "budget") {
      const { name, period, totalAmount, startDate, endDate, items } = data;
      createdRecord = await prisma.budget.create({
        data: {
          businessId: business.id,
          name: name || "New Budget",
          period: period || "Monthly",
          totalAmount: Number(totalAmount) || 0,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: {
            create: (items || []).map((item: any) => ({
              category: item.category || "General",
              allocatedAmount: Number(item.allocatedAmount) || 0,
            })),
          },
        },
        include: { items: true },
      });
    } else if (artifactType === "expense") {
      const { category, amount, date, vendor, description, paymentMethod, notes } = data;
      createdRecord = await prisma.expense.create({
        data: {
          businessId: business.id,
          category: category || "General Expense",
          amount: Number(amount) || 0,
          date: date ? new Date(date) : new Date(),
          vendor: vendor || null,
          description: description || null,
          paymentMethod: paymentMethod || "UPI",
          notes: notes || null,
        },
      });

      // Also create matching master ledger transaction
      await prisma.transaction.create({
        data: {
          businessId: business.id,
          type: "EXPENSE",
          amount: Number(amount) || 0,
          date: date ? new Date(date) : new Date(),
          category: category || "General Expense",
          description: description || (vendor ? `Expense to ${vendor}` : "Logged expense"),
        },
      });
    } else if (artifactType === "transaction") {
      const { type, amount, date, category, description } = data;
      createdRecord = await prisma.transaction.create({
        data: {
          businessId: business.id,
          type: type || "EXPENSE",
          amount: Number(amount) || 0,
          date: date ? new Date(date) : new Date(),
          category: category || "General",
          description: description || null,
        },
      });
    } else if (artifactType === "saving_goal") {
      const { name, targetAmount, targetDate } = data;
      createdRecord = await prisma.savingGoal.create({
        data: {
          businessId: business.id,
          name: name || "Savings Target",
          targetAmount: Number(targetAmount) || 0,
          savedAmount: 0,
          targetDate: targetDate ? new Date(targetDate) : null,
          status: "ACTIVE",
        },
      });
    } else if (artifactType === "debt") {
      const { type, lender, totalAmount, amountOutStanding, interestRate, emiAmount } = data;
      createdRecord = await prisma.debt.create({
        data: {
          businessId: business.id,
          type: type || "WORKING_CAPITAL",
          lender: lender || "Lender",
          totalAmount: Number(totalAmount) || Number(amountOutStanding) || 0,
          amountOutStanding: Number(amountOutStanding) || 0,
          interestRate: interestRate ? Number(interestRate) : null,
          emiAmount: emiAmount ? Number(emiAmount) : null,
          status: "ACTIVE",
        },
      });
    } else if (artifactType === "delete_record") {
      const { entityType, entityId } = data;
      if (entityType === "expense") {
        await prisma.expense.update({
          where: { id: entityId, businessId: business.id },
          data: { deletedAt: new Date() },
        });
      } else if (entityType === "budget") {
        await prisma.budget.delete({
          where: { id: entityId, businessId: business.id },
        });
      } else if (entityType === "savingGoal") {
        await prisma.savingGoal.delete({
          where: { id: entityId, businessId: business.id },
        });
      } else if (entityType === "debt") {
        await prisma.debt.delete({
          where: { id: entityId, businessId: business.id },
        });
      } else if (entityType === "transaction") {
        await prisma.transaction.delete({
          where: { id: entityId, businessId: business.id },
        });
      }
      createdRecord = { deleted: true, entityType, entityId };
    } else if (artifactType === "form") {
      const { title, formType, values, sections } = data;
      // If the dynamic form has loan/debt data, record it to debt table as well
      const flattened: Record<string, any> = { ...(values || {}) };
      if (sections && Array.isArray(sections)) {
        for (const sec of sections) {
          for (const f of sec.fields || []) {
            if (f.id && flattened[f.id] === undefined && f.defaultValue !== undefined) {
              flattened[f.id] = f.defaultValue;
            }
          }
        }
      }

      if (formType === "loan_application" || formType === "debt" || flattened.loanAmount || flattened.totalAmount) {
        const totalAmt = Number(flattened.loanAmount || flattened.totalAmount || flattened.amount || 0);
        if (totalAmt > 0) {
          try {
            await prisma.debt.create({
              data: {
                businessId: business.id,
                type: (flattened.loanType as any) || "WORKING_CAPITAL",
                lender: flattened.lender || flattened.bankName || flattened.primaryBank || "Sanctioned Lender",
                totalAmount: totalAmt,
                amountOutStanding: totalAmt,
                interestRate: flattened.interestRate ? Number(flattened.interestRate) : null,
                emiAmount: flattened.emiAmount || flattened.monthlyEmi ? Number(flattened.emiAmount || flattened.monthlyEmi) : null,
                status: "ACTIVE",
              },
            });
          } catch (e) {
            console.warn("[commit-artifact form debt linkage warning]:", e);
          }
        }
      }

      createdRecord = {
        title: title || "Submitted Form",
        formType: formType || "general",
        submittedData: flattened,
        submittedAt: new Date(),
      };
    } else {
      return NextResponse.json(
        { error: `Unknown artifactType: ${artifactType}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      artifactType,
      record: createdRecord,
      message: "Artifact successfully approved and committed to database.",
    });
  } catch (error: any) {
    console.error("[POST /api/agent/commit-artifact error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to commit artifact" },
      { status: 500 }
    );
  }
}
