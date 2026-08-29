import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const createTransaction = async (userId: string, data: any) => {
    // Verify business ownership
    await getBusinessById(userId, data.businessId);

    return await prisma.transaction.create({ data });
};

export const getTransactions = async (userId: string, filters: any) => {
    const { businessId, type, category, startDate, endDate, skip, take } = filters;

    if (!businessId) {
        throw new Error('businessId is required');
    }

    // Verify business ownership
    await getBusinessById(userId, businessId);

    const where: any = { businessId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    const query: any = {
        where,
        orderBy: { date: 'desc' }
    };

    if (skip !== undefined) query.skip = parseInt(skip as string, 10);
    if (take !== undefined) query.take = parseInt(take as string, 10);

    return await prisma.transaction.findMany(query);
};

export const getTransactionById = async (userId: string, transactionId: string) => {
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { business: true }
    });

    if (!transaction || transaction.business.ownerId !== userId) {
        throw new Error('Transaction not found or not authorized');
    }

    return transaction;
};

export const updateTransaction = async (userId: string, transactionId: string, data: any) => {
    await getTransactionById(userId, transactionId);

    delete data.businessId; // Do not allow changing businessId

    return await prisma.transaction.update({
        where: { id: transactionId },
        data
    });
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
    await getTransactionById(userId, transactionId);

    await prisma.transaction.delete({
        where: { id: transactionId }
    });

    return { success: true };
};
