import { Router } from 'express';
import {
    createBusiness,
    getBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusiness
} from '../controllers/business.controller';

const router = Router();

router.route('/')
    .post(createBusiness)
    .get(getBusinesses);

router.route('/:id')
    .get(getBusinessById)
    .patch(updateBusiness)
    .delete(deleteBusiness);

export default router;
