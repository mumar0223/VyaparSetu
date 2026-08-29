import { Router } from 'express';
import {
    createBudget,
    getBudgets,
    getBudgetById,
    getBudgetPerformance,
    updateBudget,
    deleteBudget
} from '../controllers/budget.controller';

const router = Router();

router.route('/')
    .post(createBudget)
    .get(getBudgets);

router.route('/:id')
    .get(getBudgetById)
    .patch(updateBudget)
    .delete(deleteBudget);

router.get('/:id/performance', getBudgetPerformance);

export default router;
