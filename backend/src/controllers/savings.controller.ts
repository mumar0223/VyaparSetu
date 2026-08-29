import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as savingsService from '../services/savings.service';

export const createSavingGoal = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const goal = await savingsService.createSavingGoal(userId, req.body);
        res.status(201).json({ success: true, data: goal });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getSavingGoals = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const goals = await savingsService.getSavingGoals(userId, businessId);
        res.status(200).json({ success: true, data: goals });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getSavingGoalById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const goal = await savingsService.getSavingGoalById(userId, req.params.id);
        res.status(200).json({ success: true, data: goal });
    } catch (error: any) {
        res.status(404).json({ success: false, error: { message: error.message } });
    }
});

export const updateSavingGoal = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const goal = await savingsService.updateSavingGoal(userId, req.params.id, req.body);
        res.status(200).json({ success: true, data: goal });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const deleteSavingGoal = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        await savingsService.deleteSavingGoal(userId, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Goal deleted successfully' } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const addContribution = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const amount = Number(req.body.amount);
        if (isNaN(amount) || amount <= 0) throw new Error('Valid amount is required');

        const result = await savingsService.addContribution(userId, req.params.id, amount, req.body.notes);
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
