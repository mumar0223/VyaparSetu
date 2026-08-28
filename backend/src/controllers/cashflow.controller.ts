import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as cashflowService from '../services/cashflow.service';

export const getCashFlowDetails = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const { businessId, startDate, endDate } = req.query as Record<string, string>;

        if (!businessId) {
            throw new Error('businessId is required');
        }

        const data = await cashflowService.getCashFlow(userId, businessId, startDate, endDate);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
