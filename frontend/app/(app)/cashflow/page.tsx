import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { CashflowClient } from "./cashflow-client";

export const dynamic = "force-dynamic";

export default async function CashflowPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);

  // Get all transactions
  const transactions = await prisma.transaction.findMany({
    where: { businessId: business.id },
  });

  // Get active expenses
  const expenses = await prisma.expense.findMany({
    where: { businessId: business.id, deletedAt: null },
  });

  let totalInflow = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  if (totalInflow === 0 && business.monthlyRevenue) {
    totalInflow = business.monthlyRevenue;
  }

  const totalExpenseOutflow = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTxOutflow = transactions
    .filter((t) => t.type === "EXPENSE" || t.type === "DEBT_PAYMENT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = Math.max(totalExpenseOutflow, totalTxOutflow);
  const netCashflow = totalInflow - totalOutflow;
  const monthlyBurn = totalOutflow > 0 ? totalOutflow : business.monthlyExpenses || 35000;
  const runwayMonths = monthlyBurn > 0 ? (netCashflow > 0 ? Math.round((netCashflow / monthlyBurn) * 10) / 10 : 0) : 1;

  // Compute breakdown
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const breakdown = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    pct: totalOutflow > 0 ? Math.round((amount / totalOutflow) * 100) : 0,
  }));

  const summary = {
    totalInflow,
    totalOutflow,
    netCashflow,
    monthlyBurn,
    runwayMonths,
    breakdown,
  };

  return <CashflowClient summary={summary} />;
}
