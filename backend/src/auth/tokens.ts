import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { env, isProduction } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { UnauthorizedError } from '../shared/errors.js';
import { writeAuditLog } from '../shared/audit.js';

export const ACCESS_TOKEN_COOKIE = 'payflow_at';
export const REFRESH_TOKEN_COOKIE = 'payflow_rt';
const REFRESH_TOKEN_COOKIE_PATH = '/api/auth';

interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      throw new Error('Malformed token payload');
    }
    return { sub: payload.sub };
  } catch {
    throw new UnauthorizedError('Invalid or expired access token', 'INVALID_ACCESS_TOKEN');
  }
}

function generateRawRefreshToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function hashRefreshToken(rawToken: string): string {
  return crypto.createHmac('sha256', env.REFRESH_TOKEN_SECRET).update(rawToken).digest('hex');
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip, userAgent: req.get('user-agent') ?? undefined };
}

/** Issues a brand new refresh token for a user (e.g. at login/register). Returns the raw token. */
export async function issueRefreshToken(userId: string, req: Request): Promise<string> {
  const rawToken = generateRawRefreshToken();
  const { ip, userAgent } = requestMeta(req);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: refreshTokenExpiry(),
      createdByIp: ip,
      userAgent,
    },
  });

  return rawToken;
}

interface RotationResult {
  userId: string;
  rawToken: string;
}

/**
 * Validates a presented refresh token and rotates it: the old row is revoked and a new
 * one issued in its place. Presenting a token that was already revoked (i.e. reused)
 * revokes every token in that rotation chain and rejects the request — this is the
 * concrete detection signal for a stolen/replayed refresh token.
 */
export async function rotateRefreshToken(rawToken: string, req: Request): Promise<RotationResult> {
  const tokenHash = hashRefreshToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing) {
    throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  if (existing.revokedAt || existing.expiresAt < new Date()) {
    if (existing.revokedAt) {
      // A previously-rotated (revoked) refresh token was presented again — likely theft
      // or replay. Kill every active session for this user and log the incident.
      await revokeAllRefreshTokensForUser(existing.userId);
      await writeAuditLog(prisma, {
        userId: existing.userId,
        eventType: 'REFRESH_TOKEN_REUSE_DETECTED',
        req,
      });
    }
    throw new UnauthorizedError('Refresh token is no longer valid', 'REFRESH_TOKEN_REUSED');
  }

  const newRawToken = generateRawRefreshToken();
  const { ip, userAgent } = requestMeta(req);

  await prisma.$transaction(async (tx) => {
    const created = await tx.refreshToken.create({
      data: {
        userId: existing.userId,
        tokenHash: hashRefreshToken(newRawToken),
        expiresAt: refreshTokenExpiry(),
        createdByIp: ip,
        userAgent,
      },
    });
    await tx.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedByTokenId: created.id },
    });
  });

  return { userId: existing.userId, rawToken: newRawToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Revokes every active refresh token for a user — used on password change. */
export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Cookie `domain` is only set in production (a real domain e.g. "payflow.example.com").
// In dev, omitting it lets the browser scope the cookie to the exact host — explicitly
// setting `domain=localhost` is unreliable across browsers/proxies for local dev.
const cookieDomain = isProduction ? env.COOKIE_DOMAIN : undefined;

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: REFRESH_TOKEN_COOKIE_PATH,
    domain: cookieDomain,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/', domain: cookieDomain });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_COOKIE_PATH, domain: cookieDomain });
}
