import { Router } from 'express';
import {
    createSavingGoal,
    getSavingGoals,
    getSavingGoalById,
    updateSavingGoal,
    deleteSavingGoal,
    addContribution
} from '../controllers/savings.controller';

const router = Router();

router.route('/goals')
    .post(createSavingGoal)
    .get(getSavingGoals);

router.route('/goals/:id')
    .get(getSavingGoalById)
    .patch(updateSavingGoal)
    .delete(deleteSavingGoal);

router.post('/goals/:id/contributions', addContribution);

export default router;
