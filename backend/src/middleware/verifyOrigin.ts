import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { ForbiddenError } from '../shared/errors.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Defense-in-depth CSRF mitigation: rejects mutating requests whose Origin header
 * doesn't match the configured frontend origin. Combined with SameSite cookies, this
 * is sufficient for a JSON-only API (a plain HTML form/cross-site page cannot set a
 * custom Origin or send an application/json body, so this can't be bypassed by the
 * classic auto-submitting-form CSRF attack).
 */
export function verifyOrigin(req: Request, _res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get('origin');
  if (origin && origin !== env.CORS_ORIGIN) {
    next(new ForbiddenError('Cross-origin request rejected', 'INVALID_ORIGIN'));
    return;
  }

  next();
}
