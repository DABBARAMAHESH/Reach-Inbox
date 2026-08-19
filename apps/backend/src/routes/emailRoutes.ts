import { Router } from 'express';
import { EmailController } from '../controllers/EmailController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/scheduled', EmailController.getScheduledEmails);
router.get('/sent', EmailController.getSentEmails);
router.get('/failed', EmailController.getFailedEmails);
router.get('/:id', EmailController.getEmailById);
router.post('/:id/retry', EmailController.retryEmail);
router.post('/:id/cancel', EmailController.cancelEmail);

export default router;
