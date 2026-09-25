export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(400, code, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, code, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, code, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found', code = 'NOT_FOUND') {
    super(404, code, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(409, code, message);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Too many requests', code = 'TOO_MANY_REQUESTS') {
    super(429, code, message);
  }
}
