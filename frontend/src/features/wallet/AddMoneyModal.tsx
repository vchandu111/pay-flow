import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { getApiErrorMessage } from '../../services/apiError';
import { addMoneyRequest } from './walletApi';
import { addMoneyFormSchema, type AddMoneyFormValues } from './schemas';
import type { Transaction, Wallet } from './types';

interface AddMoneyModalProps {
  onClose: () => void;
  onSuccess: (result: { wallet: Wallet; transaction: Transaction }) => void;
}

export function AddMoneyModal({ onClose, onSuccess }: AddMoneyModalProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddMoneyFormValues>({ resolver: zodResolver(addMoneyFormSchema) });

  async function onSubmit(values: AddMoneyFormValues) {
    setFormError(null);
    try {
      const result = await addMoneyRequest(values.amount, values.description);
      onSuccess(result);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to add money'));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div role="dialog" aria-modal="true" aria-label="Add Money" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Add Money</h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            autoFocus
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />
          <Input label="Note (optional)" error={errors.description?.message} {...register('description')} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Processing…' : 'Add Money'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
