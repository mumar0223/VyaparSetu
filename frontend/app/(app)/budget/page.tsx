import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { BudgetClient } from "./budget-client";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const budgets = await prisma.budget.findMany({
    where: { businessId: business.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  // Also query actual expenses to compute department variance
  const expenses = await prisma.expense.findMany({
    where: {
      businessId: business.id,
      deletedAt: null,
    },
  });

  const formattedBudgets = budgets.map((b) => {
    const itemsWithSpent = b.items.map((item) => {
      const spent = expenses
        .filter((e) => e.category.toLowerCase() === item.category.toLowerCase())
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        id: item.id,
        category: item.category,
        allocatedAmount: item.allocatedAmount,
        spentAmount: spent,
      };
    });

    return {
      id: b.id,
      name: b.name,
      period: b.period,
      totalLimit: b.totalAmount,
      items: itemsWithSpent,
    };
  });

  return <BudgetClient initialBudgets={JSON.parse(JSON.stringify(formattedBudgets))} />;
}
