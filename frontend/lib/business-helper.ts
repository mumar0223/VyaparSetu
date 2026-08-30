import { prisma } from "./prisma";

export async function getOrCreateUserBusiness(userId: string) {
  let business = await prisma.business.findFirst({
    where: { ownerId: userId },
    include: {
      milestones: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        ownerId: userId,
        businessName: "My Enterprise",
        businessType: "Sole Proprietorship",
        industry: "Retail & Commerce",
        category: "General Store / Kirana",
        description: "Local micro-retail and essential goods store.",
        registrationNumber: "UDYAM-MH-12-0098765",
        taxNumber: "27AAAAA0000A1Z5",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
        pincode: "411001",
        numberOfEmployees: 3,
        annualRevenue: 1200000,
        monthlyRevenue: 100000,
        monthlyExpenses: 65000,
        businessGoals: "Scale monthly inventory and expand wholesale distribution.",
      },
      include: {
        milestones: true,
      },
    });
  }

  return business;
}
