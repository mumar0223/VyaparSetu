import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { SavingsClient } from "./savings-client";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);
  const savingGoals = await prisma.savingGoal.findMany({
    where: { businessId: business.id },
    include: {
      contributions: {
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return <SavingsClient initialGoals={JSON.parse(JSON.stringify(savingGoals))} />;
}
