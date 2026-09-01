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

export async function getUserBusinessFullContext(userId: string) {
  const business = await getOrCreateUserBusiness(userId);

  const [expenses, savingGoals, debts, budgets, transactions] = await Promise.all([
    prisma.expense.findMany({
      where: { businessId: business.id, deletedAt: null },
      orderBy: { date: "desc" },
      take: 15,
    }),
    prisma.savingGoal.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.debt.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.budget.findMany({
      where: { businessId: business.id },
      include: { items: true },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { businessId: business.id },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const totalSavedLiquidity = savingGoals.reduce((sum, g) => sum + (g.savedAmount || 0), 0);
  const totalOutstandingDebt = debts.reduce((sum, d) => sum + (d.amountOutStanding || 0), 0);
  const recentMonthlyExpenseSum = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    ...business,
    totalSavedLiquidity: totalSavedLiquidity > 0 ? totalSavedLiquidity : 150000,
    totalOutstandingDebt,
    recentExpenses: expenses,
    calculatedMonthlyExpenses: recentMonthlyExpenseSum > 0 ? recentMonthlyExpenseSum : (business.monthlyExpenses || 65000),
    savingGoals,
    debts,
    budgets,
    transactions,
  };
}

