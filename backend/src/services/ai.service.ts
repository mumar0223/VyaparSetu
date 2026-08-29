import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const getAdvisorInsights = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    // Scan business profile for mock insights
    const transactions = await prisma.transaction.findMany({ where: { businessId } });
    const expenses = await prisma.expense.findMany({ where: { businessId, deletedAt: null } });

    let income = 0;
    let expenseTotal = 0;
    transactions.forEach((tx: any) => {
        if (tx.type === 'INCOME') income += tx.amount;
        if (tx.type === 'EXPENSE') expenseTotal += tx.amount;
    });
    expenses.forEach((e: any) => expenseTotal += e.amount);

    const netProfit = income - expenseTotal;

    const insights: string[] = [];
    const recommendations: string[] = [];

    if (netProfit > 0) {
        insights.push(`Your business is running a positive net margin of ${netProfit}.`);
        recommendations.push('Consider investing 20% of your net profits into new equipment or marketing pipelines.');
    } else {
        insights.push(`Warning: You are currently operating at a net loss of ${Math.abs(netProfit)}.`);
        recommendations.push('Review your highest recurring expenses and attempt to negotiate lower vendor contracts immediately.');
    }

    if (income === 0) {
        recommendations.push('Zero income recorded. Please ensure all your sales invoices are logged as INCOME transactions.');
    }

    return {
        insights,
        recommendations,
        context: { netProfit, income, expenseTotal }
    };
};

export const chatWithAi = async (userId: string, businessId: string, query: string) => {
    await getBusinessById(userId, businessId);

    // Mock LLM chat logic
    let response = "I am an AI mock tailored to VyaparSetu. I can read your financial context securely. ";

    if (query.toLowerCase().includes('expense')) {
        response += "It looks like you're asking about expenses. I recommend tracking every overhead categorically to find saving opportunities.";
    } else if (query.toLowerCase().includes('loan') || query.toLowerCase().includes('debt')) {
        response += "For debt management, always pay off your highest interest rate loans first to minimize bleed.";
    } else {
        response += "Could you specify if you need help with Cash Flow, Budgeting, or Debt Management?";
    }

    return {
        query,
        response,
        timestamp: new Date()
    };
};
