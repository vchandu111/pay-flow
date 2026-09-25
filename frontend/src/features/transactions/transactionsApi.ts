import { apiClient } from '../../services/apiClient';
import type { Transaction, TransactionDetail, TransactionFilters } from './types';

export async function listTransactionsRequest(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const res = await apiClient.get<{ transactions: Transaction[] }>('/transactions', { params: filters });
  return res.data.transactions;
}

export async function getTransactionRequest(id: string): Promise<TransactionDetail> {
  const res = await apiClient.get<{ transaction: TransactionDetail }>(`/transactions/${id}`);
  return res.data.transaction;
}
