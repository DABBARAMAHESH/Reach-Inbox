import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, NotFoundError, ForbiddenError, AppError } from '../types';
import { paginationQuerySchema } from '../validators';
import { EmailRepository } from '../repositories/EmailRepository';
import { emailQueue } from '../queues/emailQueue';

export class EmailController {
  static async getScheduledEmails(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const query = paginationQuerySchema.parse(req.query);
      const result = await EmailRepository.findByUserIdPaginated(authReq.user!.id, {
        ...query,
        status: query.status || 'scheduled'
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSentEmails(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const query = paginationQuerySchema.parse(req.query);
      const result = await EmailRepository.findByUserIdPaginated(authReq.user!.id, {
        ...query,
        status: 'sent'
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getFailedEmails(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const query = paginationQuerySchema.parse(req.query);
      const result = await EmailRepository.findByUserIdPaginated(authReq.user!.id, {
        ...query,
        status: 'failed'
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getEmailById(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const email = await EmailRepository.findById(id);
      if (!email) throw new NotFoundError('Email record not found');
      if (email.userId !== authReq.user!.id) throw new ForbiddenError('Access denied');

      return res.status(200).json({
        success: true,
        data: email
      });
    } catch (error) {
      next(error);
    }
  }

  static async retryEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const email = await EmailRepository.findById(id);
      if (!email) throw new NotFoundError('Email record not found');
      if (email.userId !== authReq.user!.id) throw new ForbiddenError('Access denied');

      if (email.status === 'sent') {
        throw new AppError('Email is already SENT. Will not duplicate send.', 400, 'ALREADY_SENT');
      }

      await EmailRepository.updateStatus(id, 'scheduled');
      const deterministicJobId = `email-${email.id}-retry-${Date.now()}`;

      const job = await emailQueue.add(
        'send-email',
        {
          emailId: email.id,
          campaignId: email.campaignId,
          userId: email.userId,
          senderId: email.senderId
        },
        {
          jobId: deterministicJobId,
          delay: 0
        }
      );

      await EmailRepository.updateBullJobId(email.id, job.id!);

      return res.status(200).json({
        success: true,
        data: { message: 'Email retry scheduled successfully', emailId: email.id }
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const email = await EmailRepository.findById(id);
      if (!email) throw new NotFoundError('Email record not found');
      if (email.userId !== authReq.user!.id) throw new ForbiddenError('Access denied');

      if (email.status === 'sent') {
        throw new AppError('Cannot cancel an email that is already SENT');
      }

      await EmailRepository.updateStatus(id, 'cancelled');

      if (email.bullJobId) {
        try {
          const job = await emailQueue.getJob(email.bullJobId);
          if (job) {
            await job.remove();
          }
        } catch (e) {
          // Ignore if job already finished
        }
      }

      return res.status(200).json({
        success: true,
        data: { message: 'Email cancelled successfully' }
      });
    } catch (error) {
      next(error);
    }
  }
}
