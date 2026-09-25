import type { Request } from 'express';
import type { Transaction, Wallet } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../shared/errors.js';
import { writeAuditLog } from '../shared/audit.js';
import { generateTransactionReference } from '../shared/reference.js';
import { simulateTopUp } from './mockPaymentProvider.js';
import type { AddMoneyInput } from './wallets.schemas.js';

export interface WalletDto {
  id: string;
  walletNumber: string;
  balance: string;
  currency: string;
  status: string;
}

export interface TransactionDto {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  direction: 'credit' | 'debit';
  createdAt: string;
}

export function toWalletDto(wallet: Wallet): WalletDto {
  return {
    id: wallet.id,
    walletNumber: wallet.walletNumber,
    balance: wallet.balance.toFixed(2),
    currency: wallet.currency,
    status: wallet.status,
  };
}

function toTransactionDto(tx: Transaction, walletId: string): TransactionDto {
  return {
    id: tx.id,
    reference: tx.reference,
    type: tx.type,
    status: tx.status,
    amount: tx.amount.toFixed(2),
    currency: tx.currency,
    description: tx.description,
    direction: tx.receiverWalletId === walletId ? 'credit' : 'debit',
    createdAt: tx.createdAt.toISOString(),
  };
}

export async function getWalletForUser(userId: string): Promise<Wallet> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    throw new NotFoundError('Wallet not found');
  }
  return wallet;
}

export async function getWallet(userId: string): Promise<WalletDto> {
  const wallet = await getWalletForUser(userId);
  return toWalletDto(wallet);
}

export async function addMoney(
  userId: string,
  input: AddMoneyInput,
  req: Request,
): Promise<{ wallet: WalletDto; transaction: TransactionDto }> {
  const wallet = await getWalletForUser(userId);

  // Simulated external call happens outside the DB transaction — a real provider call
  // shouldn't hold a database transaction open for the duration of a network round trip.
  await simulateTopUp(input.amount);

  const { updatedWallet, transaction } = await prisma.$transaction(async (tx) => {
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: input.amount } },
    });

    const created = await tx.transaction.create({
      data: {
        receiverWalletId: wallet.id,
        amount: input.amount,
        currency: wallet.currency,
        type: 'TOPUP',
        status: 'COMPLETED',
        reference: generateTransactionReference(),
        description: input.description ?? 'Wallet top-up',
        completedAt: new Date(),
      },
    });

    return { updatedWallet: updated, transaction: created };
  });

  await writeAuditLog(prisma, {
    userId,
    eventType: 'WALLET_TOPUP',
    req,
    metadata: { amount: input.amount, transactionId: transaction.id },
  });

  return { wallet: toWalletDto(updatedWallet), transaction: toTransactionDto(transaction, wallet.id) };
}
