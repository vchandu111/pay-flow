import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError } from '../shared/errors.js';
import { normalizeIdentifier } from '../shared/contact.js';
import type { AddBeneficiaryInput } from './beneficiaries.schemas.js';

export interface BeneficiaryDto {
  id: string;
  name: string;
  identifier: string;
  createdAt: string;
}

function toBeneficiaryDto(b: { id: string; name: string; identifier: string; createdAt: Date }): BeneficiaryDto {
  return { id: b.id, name: b.name, identifier: b.identifier, createdAt: b.createdAt.toISOString() };
}

export async function listBeneficiaries(ownerUserId: string): Promise<BeneficiaryDto[]> {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { ownerUserId },
    orderBy: { createdAt: 'desc' },
  });
  return beneficiaries.map(toBeneficiaryDto);
}

export async function addBeneficiary(ownerUserId: string, input: AddBeneficiaryInput): Promise<BeneficiaryDto> {
  const identifier = normalizeIdentifier(input.identifier);

  try {
    const created = await prisma.beneficiary.create({
      data: { ownerUserId, name: input.name, identifier },
    });
    return toBeneficiaryDto(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('You already have a beneficiary with this email/phone', 'BENEFICIARY_EXISTS');
    }
    throw err;
  }
}

export async function deleteBeneficiary(_callerUserId: string, id: string): Promise<void> {
  try {
    await prisma.beneficiary.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new NotFoundError('Beneficiary not found');
    }
    throw err;
  }
}
