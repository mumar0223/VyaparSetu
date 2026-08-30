import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { CreditClient } from "./credit-client";

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);

  return <CreditClient profile={JSON.parse(JSON.stringify(business))} />;
}
