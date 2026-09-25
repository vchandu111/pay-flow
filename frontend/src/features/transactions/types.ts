export interface Transaction {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  direction: 'credit' | 'debit';
  // Absent on the narrower DTO returned by wallet top-ups (no counterparty to name).
  counterpartyName?: string | null;
  createdAt: string;
}

export interface TransactionParty {
  walletNumber: string;
  name: string;
}

export interface TransactionDetail extends Transaction {
  from: TransactionParty | null;
  to: TransactionParty | null;
  completedAt: string | null;
}

export interface TransactionFilters {
  type?: 'TOPUP' | 'WITHDRAWAL' | 'TRANSFER';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED';
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
}
