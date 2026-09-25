import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, updateProfileSchema } from './users.schemas.js';
import { changePasswordHandler, getMeHandler, updateMeHandler } from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', getMeHandler);
usersRouter.patch('/me', validate({ body: updateProfileSchema }), updateMeHandler);
usersRouter.post('/me/password', validate({ body: changePasswordSchema }), changePasswordHandler);
