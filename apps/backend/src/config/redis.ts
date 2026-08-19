import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Support Upstash (REDIS_URL with TLS) or standard local Redis (host/port)
function createRedisClient() {
  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined
    });
  }
  return new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null,
    enableReadyCheck: true
  });
}

export const redisConfig = env.REDIS_URL
  ? { url: env.REDIS_URL }
  : { host: env.REDIS_HOST, port: env.REDIS_PORT };

export const redisClient = createRedisClient();

redisClient.on('connect', () => {
  logger.info({ url: env.REDIS_URL || `${env.REDIS_HOST}:${env.REDIS_PORT}` }, 'Connecting to Redis...');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});
