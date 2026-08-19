import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { redisClient } from './config/redis';

const server = app.listen(env.PORT, () => {
  logger.info(`Backend Express server listening on http://localhost:${env.PORT}`);
  logger.info(`Swagger API documentation available on http://localhost:${env.PORT}/api/docs`);
});

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received. Closing backend server gracefully...');
  server.close(async () => {
    logger.info('Express HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Prisma PostgreSQL connection closed.');
      await redisClient.quit();
      logger.info('Redis connection closed.');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during backend graceful shutdown.');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
