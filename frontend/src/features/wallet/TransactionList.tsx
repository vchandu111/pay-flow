import { Link } from 'react-router-dom';
import { formatDate, formatMoney } from '../../services/format';
import type { Transaction } from './types';

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No transactions yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {transactions.map((tx) => (
        <li key={tx.id}>
          <Link
            to={`/transactions/${tx.id}`}
            className="flex items-center justify-between py-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">
                {tx.description ?? tx.counterpartyName ?? tx.type}
              </p>
              <p className="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
            </div>
            <span
              className={`text-sm font-semibold ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-slate-700'}`}
            >
              {tx.direction === 'credit' ? '+' : '-'}
              {formatMoney(tx.amount, tx.currency)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
