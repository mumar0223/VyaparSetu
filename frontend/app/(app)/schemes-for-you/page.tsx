import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { SchemesClient } from "../schemes/schemes-client";

export const dynamic = "force-dynamic";

export default async function SchemesForYouPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);

  return <SchemesClient profile={JSON.parse(JSON.stringify(business))} />;
}
