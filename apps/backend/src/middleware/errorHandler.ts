import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn({ statusCode: err.statusCode, code: err.errorCode, message: err.message });
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message
      }
    });
  }

  // Handle unexpected internal server errors
  logger.error({ err, stack: err.stack }, 'Unhandled Server Error');
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred'
    }
  });
}
