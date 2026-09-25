import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { loginHandler, logoutHandler, refreshHandler, registerHandler } from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), registerHandler);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.post('/refresh', refreshHandler);
authRouter.post('/logout', logoutHandler);
