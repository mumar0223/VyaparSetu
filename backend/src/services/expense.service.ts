import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const createExpense = async (userId: string, data: any) => {
    await getBusinessById(userId, data.businessId);

    return await prisma.expense.create({ data });
};

export const getExpenses = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    return await prisma.expense.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { date: 'desc' }
    });
};

export const getExpenseSummary = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    const expenses = await prisma.expense.findMany({
        where: { businessId, deletedAt: null }
    });

    const total = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const average = expenses.length > 0 ? total / expenses.length : 0;

    const categoryTotals: Record<string, number> = {};
    expenses.forEach((exp: any) => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    return {
        total,
        average,
        categoryTotals
    };
};

export const getExpenseById = async (userId: string, expenseId: string) => {
    const expense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: { business: true }
    });

    if (!expense || expense.business.ownerId !== userId || expense.deletedAt != null) {
        throw new Error('Expense not found or not authorized');
    }

    return expense;
};

export const updateExpense = async (userId: string, expenseId: string, data: any) => {
    await getExpenseById(userId, expenseId);
    delete data.businessId;

    return await prisma.expense.update({
        where: { id: expenseId },
        data
    });
};

export const deleteExpense = async (userId: string, expenseId: string) => {
    await getExpenseById(userId, expenseId);

    await prisma.expense.update({
        where: { id: expenseId },
        data: { deletedAt: new Date() }
    });

    return { success: true };
};
