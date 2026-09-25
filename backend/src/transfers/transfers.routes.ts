import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { createTransferSchema, lookupRecipientQuerySchema } from './transfers.schemas.js';
import { createTransferHandler, lookupRecipientHandler } from './transfers.controller.js';

export const transfersRouter = Router();

transfersRouter.use(requireAuth);

transfersRouter.get('/recipients/lookup', validate({ query: lookupRecipientQuerySchema }), lookupRecipientHandler);
transfersRouter.post('/', validate({ body: createTransferSchema }), createTransferHandler);
