import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { ExpensesClient } from "./expenses-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const expenses = await prisma.expense.findMany({
    where: {
      businessId: business.id,
      deletedAt: null,
    },
    orderBy: { date: "desc" },
  });

  return <ExpensesClient initialExpenses={JSON.parse(JSON.stringify(expenses))} />;
}
