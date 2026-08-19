import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

export class DashboardController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const [total, scheduled, processing, sent, failed, cancelled] = await Promise.all([
        prisma.email.count({ where: { userId } }),
        prisma.email.count({ where: { userId, status: 'scheduled' } }),
        prisma.email.count({ where: { userId, status: 'processing' } }),
        prisma.email.count({ where: { userId, status: 'sent' } }),
        prisma.email.count({ where: { userId, status: 'failed' } }),
        prisma.email.count({ where: { userId, status: 'cancelled' } })
      ]);

      const startOfHour = new Date();
      startOfHour.setMinutes(0, 0, 0);

      const sentThisHour = await prisma.email.count({
        where: {
          userId,
          status: 'sent',
          sentAt: { gte: startOfHour }
        }
      });

      const hourlyLimit = env.MAX_EMAILS_PER_HOUR;
      const remainingHourlyCapacity = Math.max(0, hourlyLimit - sentThisHour);

      const successRate = total > 0 ? Number(((sent / total) * 100).toFixed(1)) : 0;

      return res.status(200).json({
        success: true,
        data: {
          totalEmails: total,
          scheduled,
          processing,
          sent,
          failed,
          cancelled,
          sentThisHour,
          remainingHourlyCapacity,
          hourlyLimit,
          successRate
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
