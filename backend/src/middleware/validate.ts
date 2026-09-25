import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { BadRequestError } from '../shared/errors.js';

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
}

// Express 5 exposes `req.query` as a read-only getter (parsed fresh from req.url on
// every access), so validated query params are attached to `req.validatedQuery`
// instead of assigned back onto `req.query`.
export function validate({ body, query }: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (body) {
      const result = body.safeParse(req.body);
      if (!result.success) {
        next(new BadRequestError(result.error.issues[0]?.message ?? 'Invalid request body', 'VALIDATION_ERROR'));
        return;
      }
      req.body = result.data;
    }

    if (query) {
      const result = query.safeParse(req.query);
      if (!result.success) {
        next(new BadRequestError(result.error.issues[0]?.message ?? 'Invalid query parameters', 'VALIDATION_ERROR'));
        return;
      }
      req.validatedQuery = result.data;
    }

    next();
  };
}
