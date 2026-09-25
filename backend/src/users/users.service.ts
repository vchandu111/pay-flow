import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, UnauthorizedError } from '../shared/errors.js';
import { writeAuditLog } from '../shared/audit.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import type { ChangePasswordInput, UpdateProfileInput } from './users.schemas.js';

export interface ProfileDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  address: string | null;
}

function toProfileDto(user: {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date | null;
  address: string | null;
}): ProfileDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    address: user.address,
  };
}

export async function getProfile(userId: string): Promise<ProfileDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return toProfileDto(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput, req: Request): Promise<ProfileDto> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
    },
  });

  await writeAuditLog(prisma, { userId, eventType: 'PROFILE_UPDATE', req });

  return toProfileDto(user);
}

export async function changePassword(userId: string, input: ChangePasswordInput, req: Request): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const validCurrent = await verifyPassword(user.passwordHash, input.currentPassword);
  if (!validCurrent) {
    throw new UnauthorizedError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await writeAuditLog(prisma, { userId, eventType: 'PASSWORD_CHANGE', req });
}
