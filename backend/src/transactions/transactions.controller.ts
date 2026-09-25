import type { NextFunction, Request, Response } from 'express';
import * as transactionsService from './transactions.service.js';
import type { ListTransactionsQuery } from './transactions.schemas.js';

export async function listTransactionsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.validatedQuery as ListTransactionsQuery;
    const transactions = await transactionsService.listTransactions(req.user!.id, query);
    res.status(200).json({ transactions });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await transactionsService.getTransactionById(req.user!.id, req.params.id as string);
    res.status(200).json({ transaction });
  } catch (err) {
    next(err);
  }
}
