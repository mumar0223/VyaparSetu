import app from './app';
import { config } from './config/env';

const startServer = () => {
    try {
        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
            console.log(`Swagger docs at http://localhost:${config.port}/api-docs`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
