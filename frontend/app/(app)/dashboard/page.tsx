import { getCurrentUser } from "@/lib/auth";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard & Analytics | VyaparSetu",
  description: "Comprehensive financial overview, cash flow analytics, APMC spot rates, and business health score.",
};

export default async function DashboardPage() {
  await getCurrentUser();

  return <DashboardView />;
}
