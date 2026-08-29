import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as expenseService from '../services/expense.service';

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const expense = await expenseService.createExpense(userId, req.body);
        res.status(201).json({ success: true, data: expense });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const expenses = await expenseService.getExpenses(userId, businessId);
        res.status(200).json({ success: true, data: expenses });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getExpenseSummary = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const businessId = req.query.businessId as string;
        if (!businessId) throw new Error('businessId is required');

        const summary = await expenseService.getExpenseSummary(userId, businessId);
        res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getExpenseById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const expense = await expenseService.getExpenseById(userId, req.params.id);
        res.status(200).json({ success: true, data: expense });
    } catch (error: any) {
        res.status(404).json({ success: false, error: { message: error.message } });
    }
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const expense = await expenseService.updateExpense(userId, req.params.id, req.body);
        res.status(200).json({ success: true, data: expense });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        await expenseService.deleteExpense(userId, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Expense deleted successfully' } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
