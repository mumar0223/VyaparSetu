import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { RecommendationsClient } from "./recommendations-client";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);

  return <RecommendationsClient profile={JSON.parse(JSON.stringify(business))} />;
}
