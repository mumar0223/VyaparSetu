import { Router } from 'express';
import {
    getBusinessCreditScore,
    getBorrowingCapacity,
    getUnifiedBusinessCredit,
    recalculateBusinessCredit
} from '../controllers/credit.controller';

const router = Router();

router.get('/score', getBusinessCreditScore);
router.get('/borrowing/capacity', getBorrowingCapacity);

// Unified endpoints expected by frontend
router.get('/', getUnifiedBusinessCredit);
router.post('/recalculate', recalculateBusinessCredit);

export default router;
