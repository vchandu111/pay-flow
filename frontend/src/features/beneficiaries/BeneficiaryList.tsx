import type { Beneficiary } from './types';

export function BeneficiaryList({ beneficiaries }: { beneficiaries: Beneficiary[] }) {
  if (beneficiaries.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">No beneficiaries yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {beneficiaries.map((b) => (
        <li key={b.id} className="py-3">
          <p className="text-sm font-medium text-slate-800">{b.name}</p>
          <p className="text-xs text-slate-500">{b.identifier}</p>
        </li>
      ))}
    </ul>
  );
}
