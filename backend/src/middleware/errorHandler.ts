import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../shared/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger.error({ err, path: req.path }, 'Unhandled API error');
    }
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  logger.error({ err, path: req.path }, 'Unexpected error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}
