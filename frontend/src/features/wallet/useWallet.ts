import { useCallback, useEffect, useState } from 'react';
import { getWalletRequest } from './walletApi';
import { listTransactionsRequest } from '../transactions/transactionsApi';
import type { Transaction, Wallet } from './types';

export function useWallet(transactionLimit: number) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [walletData, transactionData] = await Promise.all([
      getWalletRequest(),
      listTransactionsRequest({ limit: transactionLimit }),
    ]);
    setWallet(walletData);
    setTransactions(transactionData);
  }, [transactionLimit]);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  return { wallet, transactions, isLoading, refresh, setWallet, setTransactions };
}
