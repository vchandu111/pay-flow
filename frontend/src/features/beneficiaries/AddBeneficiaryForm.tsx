import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { getApiErrorMessage } from '../../services/apiError';
import { addBeneficiaryRequest } from './beneficiariesApi';
import { addBeneficiaryFormSchema, type AddBeneficiaryFormValues } from './schemas';
import type { Beneficiary } from './types';

interface AddBeneficiaryModalProps {
  onClose: () => void;
  onSuccess: (beneficiary: Beneficiary) => void;
}

export function AddBeneficiaryModal({ onClose, onSuccess }: AddBeneficiaryModalProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddBeneficiaryFormValues>({ resolver: zodResolver(addBeneficiaryFormSchema) });

  async function onSubmit(values: AddBeneficiaryFormValues) {
    setFormError(null);
    try {
      const beneficiary = await addBeneficiaryRequest(values);
      onSuccess(beneficiary);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to add beneficiary'));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div role="dialog" aria-modal="true" aria-label="Add Beneficiary" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Add Beneficiary</h2>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Name" autoFocus error={errors.name?.message} {...register('name')} />
          <Input label="Email / Phone" error={errors.identifier?.message} {...register('identifier')} />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
