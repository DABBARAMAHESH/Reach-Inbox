import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
});

prisma.$connect()
  .then(() => {
    logger.info('Successfully connected to PostgreSQL database via Prisma');
  })
  .catch((err) => {
    logger.error({ err }, 'Failed to connect to PostgreSQL database');
  });
