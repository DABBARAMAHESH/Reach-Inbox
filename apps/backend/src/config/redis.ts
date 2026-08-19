import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: true
};

export const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info({ host: env.REDIS_HOST, port: env.REDIS_PORT }, 'Connecting to Redis...');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});
