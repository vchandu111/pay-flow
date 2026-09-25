export interface Wallet {
  id: string;
  walletNumber: string;
  balance: string;
  currency: string;
  status: string;
}

export type { Transaction } from '../transactions/types';
