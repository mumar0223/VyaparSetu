import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';

// Routes
import userRoutes from './routes/user.routes';
import businessRoutes from './routes/business.routes';
import transactionRoutes from './routes/transaction.routes';
import expenseRoutes from './routes/expense.routes';
import dashboardRoutes from './routes/dashboard.routes';
import cashflowRoutes from './routes/cashflow.routes';
import budgetRoutes from './routes/budget.routes';
import savingsRoutes from './routes/savings.routes';
import debtRoutes from './routes/debt.routes';
import creditRoutes from './routes/credit.routes';
import utilitiesRoutes from './routes/utilities.routes';
import aiRoutes from './routes/ai.routes';
import milestoneRoutes from './routes/milestone.routes';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/profile', userRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/cash-flow', cashflowRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/savings', savingsRoutes);
app.use('/api/v1/debts', debtRoutes);
app.use('/api/v1/business-credit', creditRoutes);
app.use('/api/business-credit', creditRoutes); // Added for frontend API_BASE_URL compatibility
app.use('/api/v1', utilitiesRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/milestones', milestoneRoutes);

app.use(errorHandler);

export default app;
