import { Router } from 'express';
import { getCashFlowDetails } from '../controllers/cashflow.controller';

const router = Router();

router.get('/', getCashFlowDetails);
router.get('/summary', getCashFlowDetails); // Alias for now as it maps to same data point

export default router;
