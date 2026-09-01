import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { BorrowingClient } from "./borrowing-client";

export const dynamic = "force-dynamic";

export default async function BorrowingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const debts = await prisma.debt.findMany({
    where: { businessId: business.id },
  });
  const expenses = await prisma.expense.findMany({
    where: { businessId: business.id, deletedAt: null },
  });
  const transactions = await prisma.transaction.findMany({
    where: { businessId: business.id },
  });

  const totalInflow =
    transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0) ||
    business.monthlyRevenue ||
    145000;

  const totalOutflow = Math.max(
    expenses.reduce((sum, e) => sum + e.amount, 0),
    transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0),
    business.monthlyExpenses || 55000
  );

  return (
    <BorrowingClient
      profile={JSON.parse(JSON.stringify(business))}
      debts={JSON.parse(JSON.stringify(debts))}
      monthlyRevenue={totalInflow}
      monthlyExpenses={totalOutflow}
    />
  );
}
