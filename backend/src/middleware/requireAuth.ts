import type { NextFunction, Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '../auth/tokens.js';
import { UnauthorizedError } from '../shared/errors.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
  if (!token) {
    next(new UnauthorizedError('Authentication required', 'AUTHENTICATION_REQUIRED'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    next(err);
  }
}
