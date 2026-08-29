import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const createDebt = async (userId: string, data: any) => {
    await getBusinessById(userId, data.businessId);

    if (data.nextPaymentDate) data.nextPaymentDate = new Date(data.nextPaymentDate);

    return await prisma.debt.create({ data });
};

export const getDebts = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    return await prisma.debt.findMany({
        where: { businessId }
    });
};

export const getDebtById = async (userId: string, debtId: string) => {
    const debt = await prisma.debt.findUnique({
        where: { id: debtId },
        include: { business: true }
    });

    if (!debt || debt.business.ownerId !== userId) {
        throw new Error('Debt not found or not authorized');
    }

    return debt;
};

export const updateDebt = async (userId: string, debtId: string, data: any) => {
    await getDebtById(userId, debtId);

    delete data.businessId;
    if (data.nextPaymentDate) data.nextPaymentDate = new Date(data.nextPaymentDate);

    return await prisma.debt.update({
        where: { id: debtId },
        data
    });
};

export const deleteDebt = async (userId: string, debtId: string) => {
    await getDebtById(userId, debtId);

    await prisma.debt.delete({
        where: { id: debtId }
    });
    return { success: true };
};
