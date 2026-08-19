import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      '*.password',
      '*.smtpPassword',
      '*.smtpPassEncrypted',
      '*.etherealPassword',
      '*.GOOGLE_CLIENT_SECRET',
      '*.JWT_SECRET',
      '*.token'
    ],
    remove: true
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard'
          }
        }
      : undefined
});
