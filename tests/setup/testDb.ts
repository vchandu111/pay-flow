import { prisma } from '../../backend/src/lib/prisma.js';

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "audit_logs", "beneficiaries", "refresh_tokens", "transactions", "wallets", "users" RESTART IDENTITY CASCADE;',
  );
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
