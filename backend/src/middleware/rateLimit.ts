import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../shared/errors.js';

const rateLimitHandler = (_req: unknown, _res: unknown, next: (err: unknown) => void) => {
  next(new TooManyRequestsError('Too many requests, please try again later.'));
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
