import { Router } from 'express';
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} from '../controllers/transaction.controller';

const router = Router();

router.route('/')
    .post(createTransaction)
    .get(getTransactions);

router.route('/:id')
    .get(getTransactionById)
    .patch(updateTransaction)
    .delete(deleteTransaction);

export default router;
