import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

// --- SETTINGS ---
export const getSettings = async (userId: string) => {
    let settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings) settings = await prisma.settings.create({ data: { userId } });
    return settings;
};

export const updateSettings = async (userId: string, data: any) => {
    return await prisma.settings.upsert({
        where: { userId },
        update: data,
        create: { ...data, userId }
    });
};

// --- PRIVACY CONSENT ---
export const getPrivacyConsent = async (userId: string) => {
    let privacy = await prisma.privacyConsent.findUnique({ where: { userId } });
    if (!privacy) privacy = await prisma.privacyConsent.create({ data: { userId } });
    return privacy;
};

export const updatePrivacyConsent = async (userId: string, data: any) => {
    return await prisma.privacyConsent.upsert({
        where: { userId },
        update: data,
        create: { ...data, userId }
    });
};

// --- NOTIFICATIONS ---
export const getNotifications = async (userId: string) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
};

export const markNotificationRead = async (userId: string, notifId: string) => {
    const notif = await prisma.notification.findUnique({ where: { id: notifId } });
    if (!notif || notif.userId !== userId) throw new Error('Notification not found');

    return await prisma.notification.update({
        where: { id: notifId },
        data: { isRead: true }
    });
};

// --- RECYCLE BIN ---
export const getDeletedExpenses = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);
    return await prisma.expense.findMany({
        where: { businessId, deletedAt: { not: null } }
    });
};

export const restoreExpense = async (userId: string, expenseId: string) => {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId }, include: { business: true } });
    if (!expense || expense.business.ownerId !== userId) throw new Error('Expense not found');

    return await prisma.expense.update({
        where: { id: expenseId },
        data: { deletedAt: null }
    });
};

export const permanentDeleteExpense = async (userId: string, expenseId: string) => {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId }, include: { business: true } });
    if (!expense || expense.business.ownerId !== userId) throw new Error('Expense not found');

    await prisma.expense.delete({ where: { id: expenseId } });
    return { success: true };
};

// --- SCHEMES (MOCK) ---
export const getSchemes = async () => {
    return [
        { id: '1', title: 'MSME Loan Guarantee', provider: 'Govt of India', description: 'Collateral free loan for MSMEs up to 2Cr.' },
        { id: '2', title: 'Tech Upgrade Grant', provider: 'Ministry of MSME', description: 'Subsidy on buying new tech.' }
    ];
};
