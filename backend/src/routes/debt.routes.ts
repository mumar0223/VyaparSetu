import { Router } from 'express';
import {
    createDebt,
    getDebts,
    getDebtById,
    updateDebt,
    deleteDebt
} from '../controllers/debt.controller';

const router = Router();

router.route('/')
    .post(createDebt)
    .get(getDebts);

router.route('/:id')
    .get(getDebtById)
    .patch(updateDebt)
    .delete(deleteDebt);

export default router;
