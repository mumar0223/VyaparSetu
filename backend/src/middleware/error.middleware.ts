import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("ERROR LOG:", err.stack || err.message);

    const statusCode = res.statusCode !== 200 ? res.statusCode : (err.status || 500);

    res.status(statusCode).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred.',
        },
    });
};
