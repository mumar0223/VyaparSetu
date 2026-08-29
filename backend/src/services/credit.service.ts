import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const getBusinessCreditScore = async (userId: string, businessId: string) => {
    const business = await getBusinessById(userId, businessId);

    // Collect logic for scoring
    const transactions = await prisma.transaction.findMany({
        where: { businessId }
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach((tx: any) => {
        if (tx.type === 'INCOME') totalIncome += tx.amount;
        if (tx.type === 'EXPENSE') totalExpenses += tx.amount;
    });

    const expenses = await prisma.expense.findMany({
        where: { businessId, deletedAt: null }
    });
    expenses.forEach((exp: any) => totalExpenses += exp.amount);

    const netProfit = totalIncome - totalExpenses;

    const debts = await prisma.debt.findMany({
        where: { businessId, status: 'ACTIVE' }
    });
    const totalDebt = debts.reduce((sum: number, debt: any) => sum + debt.amountOutStanding, 0);

    // Mock Scoring Logic
    let score = 300; // Base score

    // Reward for positive profit margins
    if (totalIncome > 0) {
        const profitMargin = netProfit / totalIncome;
        if (profitMargin > 0.3) score += 200;
        else if (profitMargin > 0.1) score += 100;
        else if (profitMargin > 0) score += 50;
    }

    // Penalize/reward based on debt to income ratio
    if (totalIncome > 0) {
        const debtRatio = totalDebt / totalIncome;
        if (debtRatio === 0) score += 200;
        else if (debtRatio < 0.2) score += 150;
        else if (debtRatio < 0.5) score += 50;
        else if (debtRatio > 1) score -= 100;
    }

    // Bound the score between 300 and 900
    score = Math.max(300, Math.min(900, Math.round(score)));

    return {
        businessId,
        creditScore: score,
        totalIncome,
        totalExpenses,
        netProfit,
        totalDebt
    };
};

export const getBorrowingCapacity = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    // Basic Borrowing Capacity Logic: Max EMI a business can afford
    // Typically 40% of average monthly profit minus existing EMI commitments
    // We'll mock "Monthly Profit" as 1/12th of historical net profit for simplicity in Phase 4

    const transactions = await prisma.transaction.findMany({
        where: { businessId }
    });
    const expenses = await prisma.expense.findMany({
        where: { businessId, deletedAt: null }
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach((tx: any) => {
        if (tx.type === 'INCOME') totalIncome += tx.amount;
        if (tx.type === 'EXPENSE') totalExpenses += tx.amount;
    });
    expenses.forEach((exp: any) => totalExpenses += exp.amount);

    const netProfit = totalIncome - totalExpenses;
    const assumedMonthlyProfit = Math.max(0, netProfit / 12);

    const activeDebts = await prisma.debt.findMany({
        where: { businessId, status: 'ACTIVE' }
    });

    const currentMonthlyEmi = activeDebts.reduce((sum: number, debt: any) => sum + (debt.emiAmount || 0), 0);

    const maxAffordableEmi = assumedMonthlyProfit * 0.4;
    const availableBorrowingCapacityEmi = Math.max(0, maxAffordableEmi - currentMonthlyEmi);

    // Approximate principal based on a 5-year loan at 10% (very rough mock formula: 1000 EMI ≈ 47000 Principal)
    const estimatedPrincipalCapacity = availableBorrowingCapacityEmi * 47;

    return {
        businessId,
        assumedMonthlyProfit: parseFloat(assumedMonthlyProfit.toFixed(2)),
        currentMonthlyEmi,
        maxAffordableEmi: parseFloat(maxAffordableEmi.toFixed(2)),
        availableBorrowingCapacityEmi: parseFloat(availableBorrowingCapacityEmi.toFixed(2)),
        estimatedPrincipalCapacity: parseFloat(estimatedPrincipalCapacity.toFixed(2))
    };
};

export const getUnifiedBusinessCredit = async (userId: string, businessId: string) => {
    const scoreData = await getBusinessCreditScore(userId, businessId);
    const capacityData = await getBorrowingCapacity(userId, businessId);

    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    if (scoreData.netProfit > 0) {
        positiveFactors.push("Consistent positive net profit");
    } else {
        negativeFactors.push("Negative or zero net profit");
    }

    if (scoreData.totalDebt === 0) {
        positiveFactors.push("No active debt, healthy balance");
    } else {
        const debtRatio = scoreData.totalIncome > 0 ? (scoreData.totalDebt / scoreData.totalIncome) : 2;
        if (debtRatio > 0.5) {
            negativeFactors.push("High debt relative to income");
        } else {
            positiveFactors.push("Manageable debt to income ratio");
        }
    }

    if (capacityData.availableBorrowingCapacityEmi <= 0 && scoreData.totalDebt > 0) {
        negativeFactors.push("Maximized current borrowing capacity");
    }

    if (positiveFactors.length === 0) positiveFactors.push("Potential for business growth");
    if (negativeFactors.length === 0) negativeFactors.push("Short operational history");

    return {
        score: scoreData.creditScore,
        maxBorrowingCapacity: capacityData.estimatedPrincipalCapacity,
        factors: {
            positive: positiveFactors,
            negative: negativeFactors
        },
        lastFetched: new Date().toISOString()
    };
};
