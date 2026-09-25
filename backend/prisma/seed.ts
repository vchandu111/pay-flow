import '../src/config/loadEnv.js'; // loads .env before PrismaClient reads DATABASE_URL
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password.js';
import { generateTransactionReference, generateWalletNumber } from '../src/shared/reference.js';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'Password123!';

interface SeedCustomer {
  name: string;
  email: string;
  phone: string;
  startingBalance: number;
  topUps: { amount: number; description: string }[];
}

const customers: SeedCustomer[] = [
  {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '+919810000001',
    startingBalance: 0,
    topUps: [
      { amount: 20000, description: 'Initial top-up' },
      { amount: 5000, description: 'Salary credit' },
      { amount: 2000, description: 'Refund' },
    ],
  },
  {
    name: 'Priya Patel',
    email: 'priya@example.com',
    phone: '+919810000002',
    startingBalance: 0,
    topUps: [
      { amount: 15000, description: 'Initial top-up' },
      { amount: 3500, description: 'Salary credit' },
    ],
  },
];

async function main(): Promise<void> {
  const passwordHash = await hashPassword(DEV_PASSWORD);

  for (const customer of customers) {
    const existing = await prisma.user.findUnique({ where: { email: customer.email } });
    if (existing) {
      console.log(`Skipping ${customer.email} — already seeded`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          passwordHash,
        },
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          walletNumber: generateWalletNumber(),
          balance: customer.startingBalance,
        },
      });

      for (const topUp of customer.topUps) {
        await tx.transaction.create({
          data: {
            receiverWalletId: wallet.id,
            amount: topUp.amount,
            type: 'TOPUP',
            status: 'COMPLETED',
            reference: generateTransactionReference(),
            description: topUp.description,
            completedAt: new Date(),
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: topUp.amount } },
        });
      }
    });

    console.log(`Seeded ${customer.email}`);
  }
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
