import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as transactionService from '../services/transaction.service';

export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const transaction = await transactionService.createTransaction(userId, req.body);
        res.status(201).json({ success: true, data: transaction });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const transactions = await transactionService.getTransactions(userId, req.query);
        res.status(200).json({ success: true, data: transactions });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const transaction = await transactionService.getTransactionById(userId, req.params.id);
        res.status(200).json({ success: true, data: transaction });
    } catch (error: any) {
        res.status(404).json({ success: false, error: { message: error.message } });
    }
});

export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        const transaction = await transactionService.updateTransaction(userId, req.params.id, req.body);
        res.status(200).json({ success: true, data: transaction });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});

export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';

        await transactionService.deleteTransaction(userId, req.params.id);
        res.status(200).json({ success: true, data: { message: 'Transaction deleted successfully' } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
