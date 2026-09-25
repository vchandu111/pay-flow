import { Card } from '../../components/Card';
import { formatMoney } from '../../services/format';
import type { Wallet } from './types';

export function WalletSummary({ wallet }: { wallet: Wallet }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">Available Balance</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{formatMoney(wallet.balance, wallet.currency)}</p>
      <div className="mt-4 flex gap-6 text-sm text-slate-500">
        <div>
          <span className="block text-xs uppercase tracking-wide">Currency</span>
          {wallet.currency}
        </div>
        <div>
          <span className="block text-xs uppercase tracking-wide">Wallet ID</span>
          {wallet.walletNumber}
        </div>
      </div>
    </Card>
  );
}
