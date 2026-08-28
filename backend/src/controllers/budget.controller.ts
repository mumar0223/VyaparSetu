import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as budgetService from '../services/budget.service';

export const createBudget = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const budget = await budgetService.createBudget(userId, req.body);
        res.status(201).json({ success: true, data: budget });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getBudgets = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const budgets = await budgetService.getBudgets(userId, businessId);
        res.status(200).json({ success: true, data: budgets });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getBudgetById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const budget = await budgetService.getBudgetById(userId, req.params.id);
        res.status(200).json({ success: true, data: budget });
    } catch (error: any) {
        res.status(404).json({ success: false, error: { message: error.message } });
    }
});

export const getBudgetPerformance = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const performance = await budgetService.getBudgetPerformance(userId, req.params.id);
        res.status(200).json({ success: true, data: performance });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const updateBudget = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const budget = await budgetService.updateBudget(userId, req.params.id, req.body);
        res.status(200).json({ success: true, data: budget });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const deleteBudget = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        await budgetService.deleteBudget(userId, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Budget deleted successfully' } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
