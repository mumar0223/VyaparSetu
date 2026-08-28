import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const createSavingGoal = async (userId: string, data: any) => {
    await getBusinessById(userId, data.businessId);

    if (data.targetDate) data.targetDate = new Date(data.targetDate);

    return await prisma.savingGoal.create({ data });
};

export const getSavingGoals = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    return await prisma.savingGoal.findMany({
        where: { businessId },
        include: { contributions: true }
    });
};

export const getSavingGoalById = async (userId: string, goalId: string) => {
    const goal = await prisma.savingGoal.findUnique({
        where: { id: goalId },
        include: { business: true, contributions: true }
    });

    if (!goal || goal.business.ownerId !== userId) {
        throw new Error('Saving goal not found or not authorized');
    }

    return goal;
};

export const updateSavingGoal = async (userId: string, goalId: string, data: any) => {
    await getSavingGoalById(userId, goalId);

    delete data.businessId;
    if (data.targetDate) data.targetDate = new Date(data.targetDate);

    return await prisma.savingGoal.update({
        where: { id: goalId },
        data // does not automatically calculate contributions here
    });
};

export const deleteSavingGoal = async (userId: string, goalId: string) => {
    await getSavingGoalById(userId, goalId);

    await prisma.savingGoal.delete({
        where: { id: goalId }
    });
    return { success: true };
};

export const addContribution = async (userId: string, goalId: string, amount: number, notes?: string) => {
    // Ensure ownership exists and validates
    const goal = await getSavingGoalById(userId, goalId);

    return await prisma.$transaction(async (tx: any) => {
        const contribution = await tx.savingContribution.create({
            data: {
                savingGoalId: goalId,
                amount,
                notes,
                date: new Date()
            }
        });

        // Update the goal's savedAmount
        const updatedGoal = await tx.savingGoal.update({
            where: { id: goalId },
            data: { savedAmount: { increment: amount } }
        });

        const completionPercentage = updatedGoal.targetAmount > 0
            ? (updatedGoal.savedAmount / updatedGoal.targetAmount) * 100
            : 100;

        return {
            targetAmount: updatedGoal.targetAmount,
            savedAmount: updatedGoal.savedAmount,
            remainingAmount: updatedGoal.targetAmount - updatedGoal.savedAmount,
            completionPercentage: parseFloat(completionPercentage.toFixed(2)),
            contribution
        };
    });
};
