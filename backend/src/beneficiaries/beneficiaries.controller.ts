import type { NextFunction, Request, Response } from 'express';
import * as beneficiariesService from './beneficiaries.service.js';
import type { AddBeneficiaryInput } from './beneficiaries.schemas.js';

export async function listBeneficiariesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const beneficiaries = await beneficiariesService.listBeneficiaries(req.user!.id);
    res.status(200).json({ beneficiaries });
  } catch (err) {
    next(err);
  }
}

export async function addBeneficiaryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as AddBeneficiaryInput;
    const beneficiary = await beneficiariesService.addBeneficiary(req.user!.id, input);
    res.status(201).json({ beneficiary });
  } catch (err) {
    next(err);
  }
}

export async function deleteBeneficiaryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await beneficiariesService.deleteBeneficiary(req.user!.id, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
