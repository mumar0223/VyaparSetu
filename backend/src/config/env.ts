import dotenv from 'dotenv';
import path from 'path';

// Load from .env.example since we are in a dev environment and .env is gitignored
dotenv.config({ path: path.resolve(process.cwd(), '.env.example') });

export const config = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || 'secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
};
