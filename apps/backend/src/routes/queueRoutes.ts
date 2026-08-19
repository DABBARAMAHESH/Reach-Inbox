import { Router } from 'express';
import { QueueController } from '../controllers/QueueController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/stats', QueueController.getQueueStats);

export default router;
