import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const createBudget = async (userId: string, data: any) => {
    await getBusinessById(userId, data.businessId);

    const { items, ...budgetData } = data;
    budgetData.startDate = new Date(budgetData.startDate);
    budgetData.endDate = new Date(budgetData.endDate);

    const budget = await prisma.budget.create({
        data: {
            ...budgetData,
            items: {
                create: items || []
            }
        },
        include: { items: true }
    });

    return budget;
};

export const getBudgets = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    return await prisma.budget.findMany({
        where: { businessId },
        include: { items: true }
    });
};

export const getBudgetById = async (userId: string, budgetId: string) => {
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: { business: true, items: true }
    });

    if (!budget || budget.business.ownerId !== userId) {
        throw new Error('Budget not found or not authorized');
    }

    return budget;
};

export const updateBudget = async (userId: string, budgetId: string, data: any) => {
    await getBudgetById(userId, budgetId);

    delete data.businessId;
    const { items, ...budgetData } = data;

    if (budgetData.startDate) budgetData.startDate = new Date(budgetData.startDate);
    if (budgetData.endDate) budgetData.endDate = new Date(budgetData.endDate);

    // If items provided, clear old and replace
    if (items) {
        await prisma.budgetItem.deleteMany({ where: { budgetId } });
        return await prisma.budget.update({
            where: { id: budgetId },
            data: {
                ...budgetData,
                items: { create: items }
            },
            include: { items: true }
        });
    }

    return await prisma.budget.update({
        where: { id: budgetId },
        data: budgetData,
        include: { items: true }
    });
};

export const deleteBudget = async (userId: string, budgetId: string) => {
    await getBudgetById(userId, budgetId);

    await prisma.budget.delete({
        where: { id: budgetId }
    });
    return { success: true };
};

export const getBudgetPerformance = async (userId: string, budgetId: string) => {
    const budget = await getBudgetById(userId, budgetId);

    // Calculate actual spending in that period based on transactions
    const expenses = await prisma.expense.findMany({
        where: {
            businessId: budget.businessId,
            deletedAt: null,
            date: {
                gte: budget.startDate,
                lte: budget.endDate
            }
        }
    });

    let actualSpending = 0;
    expenses.forEach((exp: any) => {
        actualSpending += exp.amount;
    });

    const remainingAmount = budget.totalAmount - actualSpending;
    const utilizationPercentage = budget.totalAmount > 0 ? (actualSpending / budget.totalAmount) * 100 : 0;

    return {
        allocatedAmount: budget.totalAmount,
        actualSpending,
        remainingAmount,
        utilizationPercentage: parseFloat(utilizationPercentage.toFixed(2))
    };
};
