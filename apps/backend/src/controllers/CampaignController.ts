import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, NotFoundError, ForbiddenError, AppError } from '../types';
import { createCampaignSchema, paginationQuerySchema } from '../validators';
import { CampaignService } from '../services/CampaignService';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { CsvParserService } from '../services/CsvParserService';

export class CampaignController {
  static async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const body = createCampaignSchema.parse(req.body);
      const result = await CampaignService.createCampaign({
        userId: authReq.user!.id,
        senderId: body.senderId,
        subject: body.subject,
        body: body.body,
        startTime: body.startTime,
        delayBetweenEmails: body.delayBetweenEmails,
        hourlyLimit: body.hourlyLimit,
        recipients: body.recipients,
        attachments: body.attachments
      });

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const query = paginationQuerySchema.parse(req.query);
      const result = await CampaignRepository.findByUserIdPaginated(authReq.user!.id, query);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const campaign = await CampaignRepository.findById(id);
      if (!campaign) throw new NotFoundError('Campaign not found');
      if (campaign.userId !== authReq.user!.id) throw new ForbiddenError('Access denied');

      return res.status(200).json({
        success: true,
        data: campaign
      });
    } catch (error) {
      next(error);
    }
  }

  static async pauseCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const result = await CampaignService.pauseCampaign(id, authReq.user!.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async resumeCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const result = await CampaignService.resumeCampaign(id, authReq.user!.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancelCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const result = await CampaignService.cancelCampaign(id, authReq.user!.id);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async parseCsv(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file && !req.body.csvText) {
        throw new AppError('No CSV file or text provided');
      }

      const csvContent = req.file
        ? req.file.buffer.toString('utf-8')
        : req.body.csvText;

      const parseResult = CsvParserService.parseCsvContent(csvContent);

      return res.status(200).json({
        success: true,
        data: parseResult
      });
    } catch (error) {
      next(error);
    }
  }
}
