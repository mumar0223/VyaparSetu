import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { ScannerClient } from "./scanner-client";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);

  return <ScannerClient profile={JSON.parse(JSON.stringify(business))} />;
}
