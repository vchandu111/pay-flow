import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { listTransactionsRequest } from '../features/transactions/transactionsApi';
import { TransactionList } from '../features/wallet/TransactionList';
import type { Transaction, TransactionFilters } from '../features/transactions/types';

const TYPE_OPTIONS = ['', 'TOPUP', 'WITHDRAWAL', 'TRANSFER'] as const;
const STATUS_OPTIONS = ['', 'PENDING', 'COMPLETED', 'FAILED'] as const;

interface FilterState {
  type: string;
  status: string;
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
}

const EMPTY_FILTERS: FilterState = { type: '', status: '', from: '', to: '', minAmount: '', maxAmount: '' };

function toApiFilters(filters: FilterState): TransactionFilters {
  const result: TransactionFilters = {};
  if (filters.type) result.type = filters.type as TransactionFilters['type'];
  if (filters.status) result.status = filters.status as TransactionFilters['status'];
  if (filters.from) result.from = filters.from;
  if (filters.to) result.to = filters.to;
  if (filters.minAmount) result.minAmount = Number(filters.minAmount);
  if (filters.maxAmount) result.maxAmount = Number(filters.maxAmount);
  result.limit = 50;
  return result;
}

export function TransactionsPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    listTransactionsRequest(toApiFilters(filters))
      .then(setTransactions)
      .finally(() => setIsLoading(false));
  }, [filters]);

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-800">Transactions</h1>

        <Card>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Type</span>
              <select
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || 'All'}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Status</span>
              <select
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || 'All'}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="From"
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
            />
            <Input label="To" type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
            <Input
              label="Min amount"
              type="number"
              value={filters.minAmount}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
            />
            <Input
              label="Max amount"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
            />
          </div>
        </Card>

        <Card>{isLoading ? <p className="text-slate-500">Loading…</p> : <TransactionList transactions={transactions} />}</Card>
      </main>
    </div>
  );
}
