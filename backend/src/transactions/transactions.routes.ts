import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { listTransactionsQuerySchema } from './transactions.schemas.js';
import { getTransactionHandler, listTransactionsHandler, searchTransactionsHandler } from './transactions.controller.js';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get('/', validate({ query: listTransactionsQuerySchema }), listTransactionsHandler);
transactionsRouter.get('/search', searchTransactionsHandler);
transactionsRouter.get('/:id', getTransactionHandler);
