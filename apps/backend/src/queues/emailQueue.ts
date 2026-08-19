import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';
import { logger } from '../config/logger';

export const QUEUE_NAME = 'email-scheduler';

export interface EmailJobData {
  emailId: string;
  campaignId: string;
  userId: string;
  senderId: string;
}

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 15s, 45s exponential backoff
    },
    removeOnComplete: { age: 86400, count: 5000 },
    removeOnFail: { age: 604800, count: 10000 }
  }
});

logger.info(`Initialized BullMQ queue: ${QUEUE_NAME}`);
