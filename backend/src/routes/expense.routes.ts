import { Router } from 'express';
import {
    createExpense,
    getExpenses,
    getExpenseSummary,
    getExpenseById,
    updateExpense,
    deleteExpense
} from '../controllers/expense.controller';

const router = Router();

router.get('/summary', getExpenseSummary);

router.route('/')
    .post(createExpense)
    .get(getExpenses);

router.route('/:id')
    .get(getExpenseById)
    .patch(updateExpense)
    .delete(deleteExpense);

export default router;
