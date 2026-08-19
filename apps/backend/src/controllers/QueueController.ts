import { Request, Response, NextFunction } from 'express';
import { emailQueue } from '../queues/emailQueue';

export class QueueController {
  static async getQueueStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await emailQueue.getJobCounts(
        'waiting',
        'delayed',
        'active',
        'completed',
        'failed'
      );

      return res.status(200).json({
        success: true,
        data: {
          waiting: counts.waiting || 0,
          delayed: counts.delayed || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          totalJobs:
            (counts.waiting || 0) +
            (counts.delayed || 0) +
            (counts.active || 0) +
            (counts.completed || 0) +
            (counts.failed || 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
