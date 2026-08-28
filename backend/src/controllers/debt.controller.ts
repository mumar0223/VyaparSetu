import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as debtService from '../services/debt.service';

export const createDebt = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const debt = await debtService.createDebt(userId, req.body);
        res.status(201).json({ success: true, data: debt });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getDebts = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const debts = await debtService.getDebts(userId, businessId);
        res.status(200).json({ success: true, data: debts });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getDebtById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const debt = await debtService.getDebtById(userId, req.params.id);
        res.status(200).json({ success: true, data: debt });
    } catch (error: any) {
        res.status(404).json({ success: false, error: { message: error.message } });
    }
});

export const updateDebt = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const debt = await debtService.updateDebt(userId, req.params.id, req.body);
        res.status(200).json({ success: true, data: debt });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const deleteDebt = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        await debtService.deleteDebt(userId, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Debt deleted successfully' } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
