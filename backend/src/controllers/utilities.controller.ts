import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as utilService from '../services/utilities.service';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const settings = await utilService.getSettings(userId);
        res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const settings = await utilService.updateSettings(userId, req.body);
        res.status(200).json({ success: true, data: settings });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getPrivacyConsent = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const privacy = await utilService.getPrivacyConsent(userId);
        res.status(200).json({ success: true, data: privacy });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const updatePrivacyConsent = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const privacy = await utilService.updatePrivacyConsent(userId, req.body);
        res.status(200).json({ success: true, data: privacy });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const notifs = await utilService.getNotifications(userId);
        res.status(200).json({ success: true, data: notifs });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const notif = await utilService.markNotificationRead(userId, req.params.id);
        res.status(200).json({ success: true, data: notif });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getDeletedExpenses = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const expenses = await utilService.getDeletedExpenses(userId, businessId);
        res.status(200).json({ success: true, data: expenses });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const restoreExpense = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const expense = await utilService.restoreExpense(userId, req.params.id);
        res.status(200).json({ success: true, data: expense });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const permanentDeleteExpense = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        await utilService.permanentDeleteExpense(userId, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Permanently deleted' } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getSchemes = asyncHandler(async (req: Request, res: Response) => {
    try {
        const schemes = await utilService.getSchemes();
        res.status(200).json({ success: true, data: schemes });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
