import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as milestoneService from '../services/milestone.service';

export const createMilestone = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const milestone = await milestoneService.createMilestone(userId, req.body);
        res.status(201).json({ success: true, data: milestone });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getMilestones = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const milestones = await milestoneService.getMilestones(userId, businessId);
        res.status(200).json({ success: true, data: milestones });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const updateMilestoneAchievement = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const { isAchieved } = req.body;
        if (typeof isAchieved !== 'boolean') throw new Error('isAchieved must be a boolean');

        const milestone = await milestoneService.updateMilestoneAchievement(userId, req.params.id, isAchieved);
        res.status(200).json({ success: true, data: milestone });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
