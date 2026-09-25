import { hashPassword } from '../../backend/src/auth/password.js';
import { generateWalletNumber } from '../../backend/src/shared/reference.js';
import { prisma } from './testDb.js';

interface CreateUserOptions {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  balance?: number;
  walletStatus?: 'ACTIVE' | 'SUSPENDED';
}

export const DEFAULT_TEST_PASSWORD = 'CorrectHorse9';

export async function createUser(options: CreateUserOptions = {}) {
  const passwordHash = await hashPassword(options.password ?? DEFAULT_TEST_PASSWORD);

  const user = await prisma.user.create({
    data: {
      name: options.name ?? 'Test User',
      email: options.email ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      phone: options.phone ?? `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash,
    },
  });

  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      walletNumber: generateWalletNumber(),
      balance: options.balance ?? 0,
      status: options.walletStatus ?? 'ACTIVE',
    },
  });

  return { user, wallet };
}
