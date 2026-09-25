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
  const message = err instanceof Error ? err.message : 'Something went wrong';
  const stack = err instanceof Error ? err.stack : undefined;
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message, stack } });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}
