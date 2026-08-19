import { Router } from 'express';
import { SenderController } from '../controllers/SenderController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', SenderController.getSenders);
router.post('/', SenderController.createSender);
router.put('/:id', SenderController.updateSender);
router.delete('/:id', SenderController.deleteSender);
router.post('/:id/test', SenderController.testSender);

export default router;
