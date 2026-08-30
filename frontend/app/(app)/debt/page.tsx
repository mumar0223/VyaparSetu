import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { DebtClient } from "./debt-client";

export const dynamic = "force-dynamic";

export default async function DebtPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const debts = await prisma.debt.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return <DebtClient initialDebts={JSON.parse(JSON.stringify(debts))} />;
}
