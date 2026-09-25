import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { getTransactionRequest } from '../features/transactions/transactionsApi';
import { formatDate, formatMoney } from '../services/format';
import type { TransactionDetail } from '../features/transactions/types';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setNotFound(false);
    getTransactionRequest(id)
      .then(setTransaction)
      .catch((err: unknown) => {
        if (isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-800">Transaction</h1>

        {isLoading && <p className="text-slate-500">Loading…</p>}

        {!isLoading && notFound && (
          <Card>
            <p className="text-sm text-slate-600">This transaction doesn't exist or isn't yours to view.</p>
            <Link to="/transactions" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">
              Back to Transactions
            </Link>
          </Card>
        )}

        {!isLoading && transaction && (
          <Card>
            <p className="mb-4 text-sm font-mono text-slate-500">{transaction.reference}</p>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Status" value={transaction.status} />
              <Field label="Type" value={transaction.type} />
              <Field label="Amount" value={formatMoney(transaction.amount, transaction.currency)} />
              <Field label="From" value={transaction.from ? transaction.from.name : 'External'} />
              <Field label="To" value={transaction.to ? transaction.to.name : 'External'} />
              <Field label="Date" value={formatDate(transaction.createdAt)} />
              <Field label="Reference" value={transaction.reference} />
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Note</dt>
                <dd
                  className="text-sm text-slate-800"
                  dangerouslySetInnerHTML={{ __html: transaction.description ?? '—' }}
                />
              </div>
            </dl>
          </Card>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}
