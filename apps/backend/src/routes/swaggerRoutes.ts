import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ReachInbox Email Scheduler API',
    version: '1.0.0',
    description: 'Enterprise-grade email scheduling API with BullMQ queues, rate limiting, and idempotency guarantees.'
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Express Server'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Liveness check',
        responses: {
          '200': { description: 'Service is healthy' }
        }
      }
    },
    '/ready': {
      get: {
        summary: 'Readiness check verifying DB & Redis',
        responses: {
          '200': { description: 'DB and Redis ready' },
          '503': { description: 'Service unready' }
        }
      }
    },
    '/api/auth/google': {
      get: {
        summary: 'Initiate Google OAuth 2.0 flow',
        responses: { '302': { description: 'Redirect to Google Login' } }
      }
    },
    '/api/auth/dev-login': {
      post: {
        summary: 'Development login for testing without OAuth credentials',
        responses: { '200': { description: 'Logged in successfully' } }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current authenticated user info',
        responses: { '200': { description: 'Authenticated user profile' } }
      }
    },
    '/api/senders': {
      get: {
        summary: 'List user SMTP senders',
        responses: { '200': { description: 'List of senders' } }
      },
      post: {
        summary: 'Create new SMTP sender',
        responses: { '201': { description: 'Sender created' } }
      }
    },
    '/api/campaigns': {
      get: {
        summary: 'List user campaigns with pagination',
        responses: { '200': { description: 'Paginated campaign list' } }
      },
      post: {
        summary: 'Schedule new campaign',
        responses: { '201': { description: 'Campaign scheduled and BullMQ jobs created' } }
      }
    },
    '/api/dashboard/stats': {
      get: {
        summary: 'Get real-time dashboard analytics and capacity',
        responses: { '200': { description: 'Dashboard stats' } }
      }
    },
    '/api/queue/stats': {
      get: {
        summary: 'Get BullMQ queue breakdown',
        responses: { '200': { description: 'Queue metrics' } }
      }
    }
  }
};

const router = Router();

router.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

export default router;
