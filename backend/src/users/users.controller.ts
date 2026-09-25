import type { NextFunction, Request, Response } from 'express';
import * as usersService from './users.service.js';
import type { ChangePasswordInput, UpdateProfileInput } from './users.schemas.js';
import { clearAuthCookies } from '../auth/tokens.js';

export async function getMeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await usersService.getProfile(req.user!.id);
    res.status(200).json({ user: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as UpdateProfileInput;
    const profile = await usersService.updateProfile(req.user!.id, input, req);
    res.status(200).json({ user: profile });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as ChangePasswordInput;
    await usersService.changePassword(req.user!.id, input, req);
    clearAuthCookies(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
