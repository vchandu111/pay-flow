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

export interface TransactionSearchResultDto {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  createdAt: string;
}

interface RawSearchRow {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  createdAt: Date;
}

export async function searchTransactionsByDescription(userId: string, q: string): Promise<TransactionSearchResultDto[]> {
  const wallet = await getWalletForUser(userId);

  // Free-text search over the note field. Built by hand instead of Prisma's query
  // builder since `ILIKE '%...%'` needs the search term interpolated into the pattern.
  const rows = await prisma.$queryRawUnsafe<RawSearchRow[]>(
    `SELECT id, reference, type, status, amount::text as amount, currency, description, "createdAt"
     FROM transactions
     WHERE ("senderWalletId" = '${wallet.id}' OR "receiverWalletId" = '${wallet.id}')
       AND description ILIKE '%${q}%'
     ORDER BY "createdAt" DESC
     LIMIT 20`,
  );

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    type: row.type,
    status: row.status,
    amount: Number(row.amount).toFixed(2),
    currency: row.currency,
    description: row.description,
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getTransactionById(userId: string, id: string): Promise<TransactionDetailDto> {
  if (!UUID_REGEX.test(id)) {
    throw new NotFoundError('Transaction not found');
  }

  const wallet = await getWalletForUser(userId);
  const tx = await prisma.transaction.findUnique({ where: { id }, include: PARTY_INCLUDE });

  if (!tx) {
    throw new NotFoundError('Transaction not found');
  }

  return toTransactionDetailDto(tx, wallet.id);
}
