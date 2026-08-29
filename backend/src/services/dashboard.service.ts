import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const getDashboardData = async (userId: string, businessId: string, startDate?: string, endDate?: string) => {
    await getBusinessById(userId, businessId);

    const dateFilter: any = {};
    if (startDate || endDate) {
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
    }

    // Gather transactions safely
    const transactionsQuery: any = { businessId };
    if (Object.keys(dateFilter).length > 0) transactionsQuery.date = dateFilter;

    const transactions = await prisma.transaction.findMany({
        where: transactionsQuery,
        orderBy: { date: 'desc' }
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((tx: any) => {
        if (tx.type === 'INCOME') totalIncome += tx.amount;
        if (tx.type === 'EXPENSE') totalExpenses += tx.amount;
    });

    // Collect Expense module explicit expenses
    const explicitExpensesQuery: any = { businessId, deletedAt: null };
    if (Object.keys(dateFilter).length > 0) explicitExpensesQuery.date = dateFilter;

    const explicitExpenses = await prisma.expense.findMany({
        where: explicitExpensesQuery
    });

    explicitExpenses.forEach((exp: any) => {
        totalExpenses += exp.amount;
    });

    const netProfit = totalIncome - totalExpenses;
    const cashBalance = netProfit; // simplified calculation for Phase 2

    return {
        totalIncome,
        totalExpenses,
        netProfit,
        cashBalance,
        recentTransactions: transactions.slice(0, 10),
        alerts: [] // To be implemented in later phases
    };
};
