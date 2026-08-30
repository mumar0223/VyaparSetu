import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { RecycleBinClient } from "./recycle-bin-client";

export const dynamic = "force-dynamic";

export default async function RecycleBinPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const trashedExpenses = await prisma.expense.findMany({
    where: {
      businessId: business.id,
      deletedAt: { not: null },
    },
    orderBy: { deletedAt: "desc" },
  });

  return <RecycleBinClient initialItems={JSON.parse(JSON.stringify(trashedExpenses))} />;
}
