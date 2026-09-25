import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useWallet } from '../features/wallet/useWallet';
import { WalletSummary } from '../features/wallet/WalletSummary';
import { TransactionList } from '../features/wallet/TransactionList';
import { AddMoneyModal } from '../features/wallet/AddMoneyModal';

export function WalletPage() {
  const { wallet, transactions, isLoading, refresh } = useWallet(50);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">Wallet</h1>

        {isLoading || !wallet ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="flex flex-col gap-6">
            <WalletSummary wallet={wallet} />
            <Button className="self-start" onClick={() => setIsAddMoneyOpen(true)}>
              Add Money
            </Button>
            <Card>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Transactions</h2>
              <TransactionList transactions={transactions} />
            </Card>
          </div>
        )}
      </main>

      {isAddMoneyOpen && (
        <AddMoneyModal
          onClose={() => setIsAddMoneyOpen(false)}
          onSuccess={() => {
            setIsAddMoneyOpen(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
