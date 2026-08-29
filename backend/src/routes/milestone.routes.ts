import { Router } from 'express';
import {
    createMilestone,
    getMilestones,
    updateMilestoneAchievement
} from '../controllers/milestone.controller';

const router = Router();

router.route('/')
    .post(createMilestone)
    .get(getMilestones);

router.patch('/:id/achieve', updateMilestoneAchievement);

export default router;
