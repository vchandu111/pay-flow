import type { Prisma, Transaction } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../shared/errors.js';
import { getWalletForUser } from '../wallets/wallets.service.js';
import type { ListTransactionsQuery } from './transactions.schemas.js';

export interface TransactionDto {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  direction: 'credit' | 'debit';
  counterpartyName: string | null;
  createdAt: string;
}

export interface TransactionDetailDto extends TransactionDto {
  from: { walletNumber: string; name: string } | null;
  to: { walletNumber: string; name: string } | null;
  completedAt: string | null;
}

const PARTY_INCLUDE = {
  senderWallet: { select: { walletNumber: true, user: { select: { name: true } } } },
  receiverWallet: { select: { walletNumber: true, user: { select: { name: true } } } },
} as const;

type TransactionWithParties = Transaction & {
  senderWallet: { walletNumber: string; user: { name: string } } | null;
  receiverWallet: { walletNumber: string; user: { name: string } } | null;
};

function toTransactionDto(tx: TransactionWithParties, walletId: string): TransactionDto {
  const isCredit = tx.receiverWalletId === walletId;
  const counterparty = isCredit ? tx.senderWallet : tx.receiverWallet;
  return {
    id: tx.id,
    reference: tx.reference,
    type: tx.type,
    status: tx.status,
    amount: tx.amount.toFixed(2),
    currency: tx.currency,
    description: tx.description,
    direction: isCredit ? 'credit' : 'debit',
    counterpartyName: counterparty?.user.name ?? null,
    createdAt: tx.createdAt.toISOString(),
  };
}

function toTransactionDetailDto(tx: TransactionWithParties, walletId: string): TransactionDetailDto {
  return {
    ...toTransactionDto(tx, walletId),
    from: tx.senderWallet ? { walletNumber: tx.senderWallet.walletNumber, name: tx.senderWallet.user.name } : null,
    to: tx.receiverWallet ? { walletNumber: tx.receiverWallet.walletNumber, name: tx.receiverWallet.user.name } : null,
    completedAt: tx.completedAt ? tx.completedAt.toISOString() : null,
  };
}

export async function listTransactions(userId: string, query: ListTransactionsQuery): Promise<TransactionDto[]> {
  const wallet = await getWalletForUser(userId);

  const where: Prisma.TransactionWhereInput = {
    OR: [{ receiverWalletId: wallet.id }, { senderWalletId: wallet.id }],
  };
  if (query.type) where.type = query.type;
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: query.from } : {}),
      ...(query.to ? { lte: query.to } : {}),
    };
  }
  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    where.amount = {
      ...(query.minAmount !== undefined ? { gte: query.minAmount } : {}),
      ...(query.maxAmount !== undefined ? { lte: query.maxAmount } : {}),
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: PARTY_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: query.limit,
  });

  return transactions.map((tx) => toTransactionDto(tx, wallet.id));
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getTransactionById(userId: string, id: string): Promise<TransactionDetailDto> {
  // Reject malformed ids before querying, and treat "exists but isn't mine" the same
  // as "doesn't exist" (404, not 403) so this endpoint never confirms the existence
  // of a transaction the caller isn't a party to.
  if (!UUID_REGEX.test(id)) {
    throw new NotFoundError('Transaction not found');
  }

  const wallet = await getWalletForUser(userId);
  const tx = await prisma.transaction.findUnique({ where: { id }, include: PARTY_INCLUDE });

  if (!tx || (tx.senderWalletId !== wallet.id && tx.receiverWalletId !== wallet.id)) {
    throw new NotFoundError('Transaction not found');
  }

  return toTransactionDetailDto(tx, wallet.id);
}
