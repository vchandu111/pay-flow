import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../shared/errors.js';
import { writeAuditLog } from '../shared/audit.js';
import { generateTransactionReference } from '../shared/reference.js';
import { normalizeIdentifier } from '../shared/contact.js';
import { getWalletForUser, toWalletDto, type WalletDto } from '../wallets/wallets.service.js';
import { getTransactionById, type TransactionDetailDto } from '../transactions/transactions.service.js';
import type { CreateTransferInput } from './transfers.schemas.js';

export interface RecipientDto {
  name: string;
  identifier: string;
}

async function resolveRecipientUser(callerUserId: string, rawIdentifier: string) {
  const identifier = normalizeIdentifier(rawIdentifier);

  const recipient = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
    include: { wallet: true },
  });

  // "No such user" and "user exists but their wallet isn't active" are deliberately
  // indistinguishable to the caller — don't leak account status of other users.
  if (!recipient || !recipient.wallet || recipient.wallet.status !== 'ACTIVE') {
    throw new NotFoundError('No PayFlow user found with that email or phone', 'RECIPIENT_NOT_FOUND');
  }

  if (recipient.id === callerUserId) {
    throw new BadRequestError('You cannot send money to yourself', 'SELF_TRANSFER');
  }

  return recipient;
}

export async function lookupRecipient(callerUserId: string, rawIdentifier: string): Promise<RecipientDto> {
  const recipient = await resolveRecipientUser(callerUserId, rawIdentifier);
  return { name: recipient.name, identifier: rawIdentifier };
}

export async function createTransfer(
  callerUserId: string,
  input: CreateTransferInput,
  req: Request,
): Promise<{ wallet: WalletDto; transaction: TransactionDetailDto }> {
  const senderWallet = await getWalletForUser(callerUserId);
  if (senderWallet.status !== 'ACTIVE') {
    throw new ForbiddenError('Your wallet is suspended', 'WALLET_SUSPENDED');
  }

  // Re-resolve server-side — never trust a client-supplied wallet/user id carried over
  // from a prior lookup call.
  const recipient = await resolveRecipientUser(callerUserId, input.identifier);
  const receiverWallet = recipient.wallet!;

  const { updatedSenderWallet, transaction } = await prisma.$transaction(async (tx) => {
    // Check the balance, then decrement it.
    const currentSenderWallet = await tx.wallet.findUniqueOrThrow({ where: { id: senderWallet.id } });
    if (currentSenderWallet.balance.lessThan(input.amount)) {
      throw new ConflictError('Insufficient balance', 'INSUFFICIENT_BALANCE');
    }
    await tx.wallet.update({
      where: { id: senderWallet.id },
      data: { balance: { decrement: input.amount } },
    });

    await tx.wallet.update({
      where: { id: receiverWallet.id },
      data: { balance: { increment: input.amount } },
    });

    const created = await tx.transaction.create({
      data: {
        senderWalletId: senderWallet.id,
        receiverWalletId: receiverWallet.id,
        amount: input.amount,
        currency: senderWallet.currency,
        type: 'TRANSFER',
        status: 'COMPLETED',
        reference: generateTransactionReference(),
        description: input.note ?? null,
        completedAt: new Date(),
      },
    });

    const updatedSender = await tx.wallet.findUniqueOrThrow({ where: { id: senderWallet.id } });
    return { updatedSenderWallet: updatedSender, transaction: created };
  });

  await writeAuditLog(prisma, {
    userId: callerUserId,
    eventType: 'TRANSFER_SENT',
    req,
    metadata: { amount: input.amount, transactionId: transaction.id, receiverWalletId: receiverWallet.id },
  });

  const transactionDto = await getTransactionById(callerUserId, transaction.id);

  return { wallet: toWalletDto(updatedSenderWallet), transaction: transactionDto };
}
