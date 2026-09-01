import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { CreditClient } from "./credit-client";

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const transactions = await prisma.transaction.findMany({
    where: { businessId: business.id },
    orderBy: { date: "desc" },
  });
  const expenses = await prisma.expense.findMany({
    where: { businessId: business.id, deletedAt: null },
  });
  const debts = await prisma.debt.findMany({
    where: { businessId: business.id },
  });
  const budgets = await prisma.budget.findMany({
    where: { businessId: business.id },
  });

  return (
    <CreditClient
      profile={JSON.parse(JSON.stringify(business))}
      transactions={JSON.parse(JSON.stringify(transactions))}
      expenses={JSON.parse(JSON.stringify(expenses))}
      debts={JSON.parse(JSON.stringify(debts))}
      budgets={JSON.parse(JSON.stringify(budgets))}
    />
  );
}
