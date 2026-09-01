import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusinessFullContext } from "@/lib/business-helper";
import { RecommendationsClient } from "./recommendations-client";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const businessContext = await getUserBusinessFullContext(user.id);

  // Load saved district predictions and strategic playbooks from Prisma
  const [savedPredictions, savedPlaybooks] = await Promise.all([
    prisma.districtBusinessPrediction.findUnique({
      where: { userId: user.id },
    }),
    prisma.strategicActionPlaybook.findUnique({
      where: { userId: user.id },
    }),
  ]);

  const initialPredictionData = savedPredictions
    ? {
        district: savedPredictions.district,
        state: savedPredictions.state,
        budget: savedPredictions.budget,
        category: savedPredictions.category || "All Sectors",
        riskLevel: savedPredictions.riskLevel || "Moderate",
        predictions: (savedPredictions.predictions as any[]) || [],
        districtSummary: savedPredictions.districtSummary || "",
        liveMandiInsight: savedPredictions.liveMandiInsight || "",
        mandiRecords: (savedPredictions.mandiRecords as any[]) || [],
      }
    : null;

  const initialPlaybookData = savedPlaybooks
    ? {
        playbooks: (savedPlaybooks.playbooks as any[]) || [],
        enterpriseSummary: savedPlaybooks.enterpriseSummary || "",
      }
    : null;

  return (
    <RecommendationsClient
      profile={JSON.parse(JSON.stringify(businessContext))}
      initialPredictionData={initialPredictionData}
      initialPlaybookData={initialPlaybookData}
    />
  );
}
