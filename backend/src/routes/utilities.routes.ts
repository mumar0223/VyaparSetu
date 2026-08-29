import { Router } from 'express';
import {
    getSettings, updateSettings,
    getPrivacyConsent, updatePrivacyConsent,
    getNotifications, markNotificationRead,
    getDeletedExpenses, restoreExpense, permanentDeleteExpense,
    getSchemes
} from '../controllers/utilities.controller';

const router = Router();

router.get('/schemes', getSchemes);

router.route('/settings')
    .get(getSettings)
    .patch(updateSettings);

router.route('/privacy/consent')
    .get(getPrivacyConsent)
    .patch(updatePrivacyConsent);

router.route('/notifications')
    .get(getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

router.get('/recycle-bin/expenses', getDeletedExpenses);
router.post('/recycle-bin/expenses/:id/restore', restoreExpense);
router.delete('/recycle-bin/expenses/:id/permanent', permanentDeleteExpense);

export default router;
