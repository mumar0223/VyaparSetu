import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { SuccessStoriesClient } from "./stories-client";

export const dynamic = "force-dynamic";

export default async function SuccessStoriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);

  return <SuccessStoriesClient milestones={JSON.parse(JSON.stringify(business.milestones || []))} />;
}
