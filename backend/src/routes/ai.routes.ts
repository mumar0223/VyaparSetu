import { Router } from 'express';
import {
    getAdvisorInsights,
    chatWithAi
} from '../controllers/ai.controller';

const router = Router();

router.get('/advisor-insights', getAdvisorInsights);
router.post('/chat', chatWithAi);

export default router;
