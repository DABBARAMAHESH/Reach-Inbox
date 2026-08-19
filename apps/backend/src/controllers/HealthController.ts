import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { redisClient } from '../config/redis';

export class HealthController {
  static getHealth(_req: Request, res: Response) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'reachinbox-backend'
    });
  }

  static async getReady(_req: Request, res: Response) {
    try {
      // 1. Check PostgreSQL
      await prisma.$queryRaw`SELECT 1`;

      // 2. Check Redis
      const ping = await redisClient.ping();
      if (ping !== 'PONG') {
        throw new Error('Redis ping failed');
      }

      return res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          postgres: 'connected',
          redis: 'connected',
          bullmq: 'ready'
        }
      });
    } catch (error: any) {
      return res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error?.message || 'Database or Redis unavailable'
      });
    }
  }
}
