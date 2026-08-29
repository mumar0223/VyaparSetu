import prisma from '../config/prisma';
import { getBusinessById } from './business.service';

export const createMilestone = async (userId: string, data: any) => {
    await getBusinessById(userId, data.businessId);

    if (data.date) data.date = new Date(data.date);
    return await prisma.businessMilestone.create({ data });
};

export const getMilestones = async (userId: string, businessId: string) => {
    await getBusinessById(userId, businessId);

    return await prisma.businessMilestone.findMany({
        where: { businessId },
        orderBy: { date: 'asc' }
    });
};

export const updateMilestoneAchievement = async (userId: string, milestoneId: string, isAchieved: boolean) => {
    const milestone = await prisma.businessMilestone.findUnique({
        where: { id: milestoneId },
        include: { business: true }
    });

    if (!milestone || milestone.business.ownerId !== userId) {
        throw new Error('Milestone not found or not authorized');
    }

    return await prisma.businessMilestone.update({
        where: { id: milestoneId },
        data: { isAchieved }
    });
};
