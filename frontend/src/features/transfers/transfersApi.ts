import { apiClient } from '../../services/apiClient';
import type { Wallet } from '../wallet/types';
import type { TransactionDetail } from '../transactions/types';
import type { Recipient } from './types';

export async function lookupRecipientRequest(identifier: string): Promise<Recipient> {
  const res = await apiClient.get<{ recipient: Recipient }>('/transfers/recipients/lookup', {
    params: { identifier },
  });
  return res.data.recipient;
}

export async function createTransferRequest(input: {
  identifier: string;
  amount: number;
  note?: string;
}): Promise<{ wallet: Wallet; transaction: TransactionDetail }> {
  const res = await apiClient.post<{ wallet: Wallet; transaction: TransactionDetail }>('/transfers', input);
  return res.data;
}
