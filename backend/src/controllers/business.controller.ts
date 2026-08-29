import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as businessService from '../services/business.service';

export const createBusiness = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const business = await businessService.createBusiness(userId, req.body);
        res.status(201).json({ success: true, data: business });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getBusinesses = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businesses = await businessService.getBusinesses(userId);
        res.status(200).json({ success: true, data: businesses });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getBusinessById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const business = await businessService.getBusinessById(userId, req.params.id);
        res.status(200).json({ success: true, data: business });
    } catch (error: any) {
        res.status(404).json({ success: false, error: { message: error.message } });
    }
});

export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const business = await businessService.updateBusiness(userId, req.params.id, req.body);
        res.status(200).json({ success: true, data: business });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const deleteBusiness = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        await businessService.deleteBusiness(userId, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Business deleted successfully' } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
