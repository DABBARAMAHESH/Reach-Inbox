import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().default('postgresql://reachinbox:reachinbox_password@postgres:5432/reachinbox'),
  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().default(6379),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/auth/google/callback'),
  JWT_SECRET: z.string().default('super-secret-jwt-key-reachinbox-2026'),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SYSTEM_SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
  SYSTEM_SMTP_PORT: z.coerce.number().optional().default(587),
  SYSTEM_SMTP_USER: z.string().optional().default(''),
  SYSTEM_SMTP_PASSWORD: z.string().optional().default(''),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  MIN_DELAY_BETWEEN_EMAILS_MS: z.coerce.number().default(2000),
  MAX_EMAILS_PER_HOUR: z.coerce.number().default(200),
  MAX_CSV_SIZE_MB: z.coerce.number().default(5),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  EMAIL_SEND_MODE: z.enum(['ethereal', 'mock']).default('ethereal'),
  LOG_LEVEL: z.string().default('info')
});

export const env = envSchema.parse(process.env);
