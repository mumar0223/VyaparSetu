import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusinessFullContext } from "@/lib/business-helper";
import { SchemesClient } from "./schemes-client";

export const dynamic = "force-dynamic";

export default async function SchemesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const dbContext = await getUserBusinessFullContext(user.id);

  let saved = await prisma.governmentSchemeMatch.findUnique({
    where: { userId: user.id },
  });

  const initialMatchData = saved
    ? {
        schemes: (saved.schemes as any[]) || [],
        summary: saved.summary || "",
        totalSubsidies: saved.totalSubsidies || "Up to ₹17.5 Lakhs in Subsidies",
        district: saved.district || dbContext?.city || "Pune",
        state: saved.state || dbContext?.state || "Maharashtra",
        lastEvaluatedAt: saved.lastEvaluatedAt.toISOString(),
      }
    : null;

  return (
    <SchemesClient
      profile={JSON.parse(JSON.stringify(dbContext))}
      initialMatchData={initialMatchData}
    />
  );
}
