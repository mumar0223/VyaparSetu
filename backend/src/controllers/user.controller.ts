import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as userService from '../services/user.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';
        const user = await userService.getUserProfile(userId);
        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(404).json({ success: false, error: { message: error.message } });
    }
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
        const userId = (req.query.userId as string) || 'dev-user';
        const user = await userService.updateUserProfile(userId, req.body);
        res.status(200).json({ success: true, data: user });
    } catch (error: any) {
        res.status(400).json({ success: false, error: { message: error.message } });
    }
});
