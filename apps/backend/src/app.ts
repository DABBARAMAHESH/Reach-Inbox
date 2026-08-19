import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { env } from './config/env';
import { logger } from './config/logger';
import { configurePassport } from './auth/passport';

import authRoutes from './routes/authRoutes';
import senderRoutes from './routes/senderRoutes';
import campaignRoutes from './routes/campaignRoutes';
import emailRoutes from './routes/emailRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import queueRoutes from './routes/queueRoutes';
import healthRoutes from './routes/healthRoutes';
import swaggerRoutes from './routes/swaggerRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: false // Disabled for Swagger UI compatibility
  })
);

app.use(
  cors({
    origin: [
      env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      /\.railway\.app$/,
      /\.up\.railway\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Global API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use('/api/', apiLimiter);

// Request Parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Structured Logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url?.includes('/health') || req.url?.includes('/ready')
    }
  })
);

// Passport Auth Config
configurePassport();
app.use(passport.initialize());

// Health check routes
app.use('/', healthRoutes);

// Swagger Documentation Route
app.use('/api/docs', swaggerRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/senders', senderRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/queue', queueRoutes);

// Centralized Error Handling
app.use(errorHandler);

// ── Serve React Frontend in Production ───────────────────────────────────────
// In production (Railway), the built React app is served by Express itself
if (env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../../../apps/frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // For React Router — serve index.html for all non-API routes
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
}

export default app;
