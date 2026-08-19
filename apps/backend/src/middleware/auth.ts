import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, UnauthorizedError } from '../types';
import { verifyToken } from '../lib/jwt';
import { logger } from '../config/logger';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    logger.warn({ error }, 'Authentication failed');
    next(new UnauthorizedError('Invalid or expired authentication session'));
  }
}
