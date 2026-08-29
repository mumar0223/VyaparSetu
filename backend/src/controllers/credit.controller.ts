import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as creditService from '../services/credit.service';
import * as businessService from '../services/business.service';

export const getBusinessCreditScore = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const scoreData = await creditService.getBusinessCreditScore(userId, businessId);
        res.status(200).json({ success: true, data: scoreData });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getBorrowingCapacity = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const capacityData = await creditService.getBorrowingCapacity(userId, businessId);
        res.status(200).json({ success: true, data: capacityData });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getUnifiedBusinessCredit = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        let businessId = req.query.businessId as string;
        if (!businessId) {
            const businesses = await businessService.getBusinesses(userId);
            if (businesses.length === 0) throw new Error('No business found for user');
            businessId = businesses[0].id;
        }

        const creditData = await creditService.getUnifiedBusinessCredit(userId, businessId);
        // Frontend expects direct object based on creditData.score usage
        res.status(200).json(creditData);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

export const recalculateBusinessCredit = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';
        let businessId = req.query.businessId as string;
        if (!businessId) {
            const businesses = await businessService.getBusinesses(userId);
            if (businesses.length === 0) throw new Error('No business found for user');
            businessId = businesses[0].id;
        }

        const creditData = await creditService.getUnifiedBusinessCredit(userId, businessId);
        res.status(200).json(creditData);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});
