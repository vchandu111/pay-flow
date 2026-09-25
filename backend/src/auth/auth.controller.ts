import type { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  verifyAccessToken,
} from './tokens.js';
import { UnauthorizedError } from '../shared/errors.js';

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as RegisterInput;
    const { user, accessToken, refreshToken } = await authService.register(input, req);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as LoginInput;
    const { user, accessToken, refreshToken } = await authService.login(input, req);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!rawRefreshToken) {
      throw new UnauthorizedError('No refresh token provided', 'MISSING_REFRESH_TOKEN');
    }
    const { accessToken, refreshToken } = await authService.refresh(rawRefreshToken, req);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(204).send();
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const rawAccessToken = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

    let userId: string | undefined;
    if (rawAccessToken) {
      try {
        userId = verifyAccessToken(rawAccessToken).sub;
      } catch {
        // Access token already expired/invalid — logout still proceeds, just without
        // a userId to attach to the audit log entry.
      }
    }

    await authService.logout(rawRefreshToken, userId, req);
    clearAuthCookies(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
