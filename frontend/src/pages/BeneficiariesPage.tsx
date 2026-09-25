import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { listBeneficiariesRequest } from '../features/beneficiaries/beneficiariesApi';
import { BeneficiaryList } from '../features/beneficiaries/BeneficiaryList';
import { AddBeneficiaryModal } from '../features/beneficiaries/AddBeneficiaryForm';
import type { Beneficiary } from '../features/beneficiaries/types';

export function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    listBeneficiariesRequest()
      .then(setBeneficiaries)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Beneficiaries</h1>
          <Button onClick={() => setIsAddOpen(true)}>Add Beneficiary</Button>
        </div>

        {isLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <Card>
            <BeneficiaryList beneficiaries={beneficiaries} />
          </Card>
        )}
      </main>

      {isAddOpen && (
        <AddBeneficiaryModal
          onClose={() => setIsAddOpen(false)}
          onSuccess={(beneficiary) => {
            setBeneficiaries((prev) => [beneficiary, ...prev]);
            setIsAddOpen(false);
          }}
        />
      )}
    </div>
  );
}
