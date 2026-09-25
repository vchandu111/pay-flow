import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { addMoneySchema } from './wallets.schemas.js';
import { addMoneyHandler, getMyWalletHandler } from './wallets.controller.js';

export const walletsRouter = Router();

walletsRouter.use(requireAuth);

walletsRouter.get('/me', getMyWalletHandler);
walletsRouter.post('/me/topups', validate({ body: addMoneySchema }), addMoneyHandler);
