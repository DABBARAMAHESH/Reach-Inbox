import { createEmailWorker } from './emailWorker';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';
import { redisClient } from '../config/redis';

logger.info('Starting standalone BullMQ Email Worker Process...');

const worker = createEmailWorker();

async function handleShutdown(signal: string) {
  logger.info({ signal }, 'Received shutdown signal in Worker process. Gracefully terminating...');
  try {
    await worker.close();
    logger.info('BullMQ worker closed');
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
    await redisClient.quit();
    logger.info('Redis connection closed');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during worker graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
