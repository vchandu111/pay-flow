import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { ConflictError, UnauthorizedError } from '../shared/errors.js';
import { writeAuditLog } from '../shared/audit.js';
import { generateWalletNumber } from '../shared/reference.js';
import { hashPassword, verifyPassword } from './password.js';
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken, signAccessToken } from './tokens.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

// Generic, identical message for both "unknown email" and "wrong password" so login
// cannot be used to enumerate registered accounts.
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

interface AuthResult {
  user: { id: string; name: string; email: string };
  accessToken: string;
  refreshToken: string;
}

export async function register(input: RegisterInput, req: Request): Promise<AuthResult> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { phone: input.phone }] },
  });
  if (existing) {
    throw new ConflictError(
      existing.email === input.email ? 'Email is already registered' : 'Phone number is already registered',
      'ALREADY_REGISTERED',
    );
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
      },
    });

    await tx.wallet.create({
      data: {
        userId: created.id,
        walletNumber: generateWalletNumber(),
      },
    });

    return created;
  });

  await writeAuditLog(prisma, { userId: user.id, eventType: 'REGISTER', req });

  const accessToken = signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id, req);

  return { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken };
}

export async function login(input: LoginInput, req: Request): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    await writeAuditLog(prisma, { eventType: 'LOGIN_FAILURE', req, metadata: { email: input.email } });
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  const validPassword = await verifyPassword(user.passwordHash, input.password);
  if (!validPassword) {
    await writeAuditLog(prisma, { userId: user.id, eventType: 'LOGIN_FAILURE', req });
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE, 'INVALID_CREDENTIALS');
  }

  await writeAuditLog(prisma, { userId: user.id, eventType: 'LOGIN_SUCCESS', req });

  const accessToken = signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id, req);

  return { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken };
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export async function refresh(rawRefreshToken: string, req: Request): Promise<RefreshResult> {
  const { userId, rawToken } = await rotateRefreshToken(rawRefreshToken, req);
  const accessToken = signAccessToken(userId);
  return { accessToken, refreshToken: rawToken };
}

export async function logout(rawRefreshToken: string | undefined, userId: string | undefined, req: Request): Promise<void> {
  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }
  if (userId) {
    await writeAuditLog(prisma, { userId, eventType: 'LOGOUT', req });
  }
}
