import { apiClient } from '../../services/apiClient';
import type { Transaction, Wallet } from './types';

export async function getWalletRequest(): Promise<Wallet> {
  const res = await apiClient.get<{ wallet: Wallet }>('/wallets/me');
  return res.data.wallet;
}

export async function addMoneyRequest(
  amount: number,
  description?: string,
): Promise<{ wallet: Wallet; transaction: Transaction }> {
  const res = await apiClient.post<{ wallet: Wallet; transaction: Transaction }>('/wallets/me/topups', {
    amount,
    description,
  });
  return res.data;
}
