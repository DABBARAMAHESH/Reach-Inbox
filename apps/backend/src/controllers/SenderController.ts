import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, NotFoundError, ForbiddenError } from '../types';
import { SenderRepository } from '../repositories/SenderRepository';
import { createSenderSchema, updateSenderSchema } from '../validators';
import { MailService } from '../services/MailService';

export class SenderController {
  static async getSenders(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const senders = await SenderRepository.findByUserId(authReq.user!.id);
      const safeSenders = senders.map((s) => {
        const { smtpPassEncrypted, etherealPassword, ...rest } = s;
        return {
          ...rest,
          hasPassword: Boolean(smtpPassEncrypted || etherealPassword)
        };
      });

      return res.status(200).json({
        success: true,
        data: safeSenders
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSender(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const body = createSenderSchema.parse(req.body);

      let etherealData: any = {};
      if (body.smtpHost === 'smtp.ethereal.email' && (!body.smtpUser || !body.smtpPassword)) {
        etherealData = await MailService.createEtherealAccount();
      }

      const sender = await SenderRepository.create({
        userId: authReq.user!.id,
        displayName: body.displayName,
        email: body.email || etherealData.etherealUser,
        smtpHost: body.smtpHost || etherealData.smtpHost,
        smtpPort: body.smtpPort || etherealData.smtpPort,
        smtpUser: body.smtpUser || etherealData.etherealUser,
        smtpPassword: body.smtpPassword,
        etherealUser: etherealData.etherealUser,
        etherealPassword: etherealData.etherealPassword
      });

      const { smtpPassEncrypted, etherealPassword, ...safeSender } = sender;
      return res.status(201).json({
        success: true,
        data: {
          ...safeSender,
          hasPassword: Boolean(smtpPassEncrypted || etherealPassword)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSender(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const body = updateSenderSchema.parse(req.body);

      const existing = await SenderRepository.findById(id);
      if (!existing) throw new NotFoundError('Sender not found');
      if (existing.userId !== authReq.user!.id) throw new ForbiddenError('Access denied');

      const updated = await SenderRepository.update(id, body);
      const { smtpPassEncrypted, etherealPassword, ...safeSender } = updated;

      return res.status(200).json({
        success: true,
        data: safeSender
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSender(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const existing = await SenderRepository.findById(id);
      if (!existing) throw new NotFoundError('Sender not found');
      if (existing.userId !== authReq.user!.id) throw new ForbiddenError('Access denied');

      await SenderRepository.delete(id);
      return res.status(200).json({
        success: true,
        data: { message: 'Sender deleted successfully' }
      });
    } catch (error) {
      next(error);
    }
  }

  static async testSender(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const existing = await SenderRepository.findById(id);
      if (!existing) throw new NotFoundError('Sender not found');
      if (existing.userId !== authReq.user!.id) throw new ForbiddenError('Access denied');

      await MailService.verifySender(existing);
      return res.status(200).json({
        success: true,
        data: { message: 'SMTP credentials verified successfully' }
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SMTP_VERIFICATION_FAILED',
          message: error?.message || 'SMTP authentication failed'
        }
      });
    }
  }
}
