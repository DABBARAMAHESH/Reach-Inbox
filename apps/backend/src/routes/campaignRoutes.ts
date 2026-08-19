import { Router } from 'express';
import multer from 'multer';
import { CampaignController } from '../controllers/CampaignController';
import { requireAuth } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();
const upload = multer({
  limits: {
    fileSize: (env.MAX_CSV_SIZE_MB || 5) * 1024 * 1024
  }
});

router.use(requireAuth);

router.post('/', CampaignController.createCampaign);
router.get('/', CampaignController.getCampaigns);
router.post('/parse-csv', upload.single('file'), CampaignController.parseCsv);
router.get('/:id', CampaignController.getCampaignById);
router.post('/:id/pause', CampaignController.pauseCampaign);
router.post('/:id/resume', CampaignController.resumeCampaign);
router.post('/:id/cancel', CampaignController.cancelCampaign);

export default router;
