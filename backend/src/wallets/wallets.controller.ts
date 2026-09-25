import type { NextFunction, Request, Response } from 'express';
import * as walletsService from './wallets.service.js';
import type { AddMoneyInput } from './wallets.schemas.js';

export async function getMyWalletHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wallet = await walletsService.getWallet(req.user!.id);
    res.status(200).json({ wallet });
  } catch (err) {
    next(err);
  }
}

export async function addMoneyHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as AddMoneyInput;
    const result = await walletsService.addMoney(req.user!.id, input, req);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
