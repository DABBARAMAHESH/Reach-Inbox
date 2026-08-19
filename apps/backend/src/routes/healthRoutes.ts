import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();

router.get('/health', HealthController.getHealth);
router.get('/ready', HealthController.getReady);

export default router;
