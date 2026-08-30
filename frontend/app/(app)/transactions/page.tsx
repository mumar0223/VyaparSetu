import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { TransactionsClient } from "./transactions-client";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const transactions = await prisma.transaction.findMany({
    where: { businessId: business.id },
    orderBy: { date: "desc" },
  });

  return <TransactionsClient initialTransactions={JSON.parse(JSON.stringify(transactions))} />;
}
