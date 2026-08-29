import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as aiService from '../services/ai.service';

export const getAdvisorInsights = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const insights = await aiService.getAdvisorInsights(userId, businessId);
        res.status(200).json({ success: true, data: insights });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const chatWithAi = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const { businessId, query } = req.body;
        if (!businessId || !query) throw new Error('businessId and query are required');

        const response = await aiService.chatWithAi(userId, businessId, query);
        res.status(200).json({ success: true, data: response });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
