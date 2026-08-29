import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const getCashFlow = async (userId: string, businessId: string, startDate?: string, endDate?: string) => {
    await getBusinessById(userId, businessId);

    // Simplistic cash flow tracking using transactions
    const dateFilter: any = {};
    if (startDate || endDate) {
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
    }

    const transactionsQuery: any = { businessId };
    if (Object.keys(dateFilter).length > 0) transactionsQuery.date = dateFilter;

    const transactions = await prisma.transaction.findMany({
        where: transactionsQuery,
        orderBy: { date: 'asc' }
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    transactions.forEach((tx: any) => {
        if (tx.type === 'INCOME' || tx.type === 'TRANSFER' || tx.type === 'OTHER') {
            // Basic logic, real apps have deeper checks
            if (tx.amount > 0) totalInflow += tx.amount;
        }
        if (tx.type === 'EXPENSE' || tx.type === 'DEBT_PAYMENT' || tx.type === 'SAVING') {
            totalOutflow += tx.amount;
        }
    });

    // Explicit expenses module out-flows
    const explicitExpensesQuery: any = { businessId, deletedAt: null };
    if (Object.keys(dateFilter).length > 0) explicitExpensesQuery.date = dateFilter;

    const explicitExpenses = await prisma.expense.findMany({
        where: explicitExpensesQuery
    });

    explicitExpenses.forEach((exp: any) => {
        totalOutflow += exp.amount;
    });

    const netCashFlow = totalInflow - totalOutflow;

    return {
        totalInflow,
        totalOutflow,
        netCashFlow,
        openingBalance: 0, // Mock for basic cash flow until accounts are added
        closingBalance: netCashFlow
    };
};
