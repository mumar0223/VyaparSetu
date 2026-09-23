import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusinessFullContext } from "@/lib/business-helper";
import { ScannerClient } from "./scanner-client";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getUserBusinessFullContext(user.id);

  const savedSwot = await prisma.swotMarketAnalysis.findUnique({
    where: { userId: user.id },
  });

  const savedSwotData = savedSwot?.swotData as any;
  const initialSwotData = savedSwot
    ? {
        district: savedSwot.district,
        state: savedSwot.state,
        radiusKm: savedSwot.radiusKm,
        score: savedSwot.score,
        swotData: savedSwotData,
        lat: typeof savedSwotData?.lat === "number" ? savedSwotData.lat : undefined,
        lng: typeof savedSwotData?.lng === "number" ? savedSwotData.lng : undefined,
        actionPlan: (savedSwot.actionPlan as any[]) || [],
        dataSource: savedSwot.dataSource || `Live Trade Register for ${savedSwot.district}`,
        lastEvaluatedAt: savedSwot.updatedAt.toISOString(),
      }
    : null;

  return (
    <ScannerClient
      profile={JSON.parse(JSON.stringify(business))}
      initialSwotData={initialSwotData}
    />
  );
}
