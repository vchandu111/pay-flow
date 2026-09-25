import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../features/auth/AuthContext';
import { useWallet } from '../features/wallet/useWallet';
import { WalletSummary } from '../features/wallet/WalletSummary';
import { TransactionList } from '../features/wallet/TransactionList';
import { AddMoneyModal } from '../features/wallet/AddMoneyModal';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { wallet, transactions, isLoading, refresh } = useWallet(5);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">
          {greeting()}, {user?.name.split(' ')[0]}
        </h1>

        {isLoading || !wallet ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="flex flex-col gap-6">
            <WalletSummary wallet={wallet} />
            <div className="flex gap-3">
              <Button onClick={() => setIsAddMoneyOpen(true)}>Add Money</Button>
              <Button variant="secondary" onClick={() => navigate('/send-money')}>
                Send Money
              </Button>
            </div>
            <Card>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Recent Transactions
              </h2>
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
