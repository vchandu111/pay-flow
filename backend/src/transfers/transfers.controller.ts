import type { NextFunction, Request, Response } from 'express';
import * as transfersService from './transfers.service.js';
import type { CreateTransferInput, LookupRecipientQuery } from './transfers.schemas.js';

export async function lookupRecipientHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { identifier } = req.validatedQuery as LookupRecipientQuery;
    const recipient = await transfersService.lookupRecipient(req.user!.id, identifier);
    res.status(200).json({ recipient });
  } catch (err) {
    next(err);
  }
}

export async function createTransferHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as CreateTransferInput;
    const result = await transfersService.createTransfer(req.user!.id, input, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
