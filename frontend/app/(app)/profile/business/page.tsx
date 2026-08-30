import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateUserBusiness } from "@/lib/business-helper";
import { BusinessClient } from "./business-client";

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOrCreateUserBusiness(user.id);

  const initialData = {
    businessName: business.businessName || "",
    businessType: business.businessType || "Sole Proprietorship",
    industry: business.industry || "Retail & Commerce",
    category: business.category || "General Store / Kirana",
    description: business.description || "",
    registrationNumber: business.registrationNumber || "",
    taxNumber: business.taxNumber || "",
    address: business.address || "",
    city: business.city || "",
    state: business.state || "",
    pincode: business.pincode || "",
    numberOfEmployees: business.numberOfEmployees || 1,
    annualRevenue: business.annualRevenue || 0,
    monthlyRevenue: business.monthlyRevenue || 0,
    monthlyExpenses: business.monthlyExpenses || 0,
    businessGoals: business.businessGoals || "",
  };

  return <BusinessClient initialData={initialData} />;
}
