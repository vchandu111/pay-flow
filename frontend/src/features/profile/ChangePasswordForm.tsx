import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { getApiErrorMessage } from '../../services/apiError';
import { changePasswordRequest } from './profileApi';
import { changePasswordFormSchema, type ChangePasswordFormValues } from './schemas';

export function ChangePasswordForm({ onChanged }: { onChanged: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordFormSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError(null);
    try {
      await changePasswordRequest(values);
      onChanged();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to change password'));
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Change Password</h2>
      <p className="mb-4 text-sm text-slate-500">
        Changing your password will sign you out of all sessions, including this one.
      </p>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmNewPassword?.message}
          {...register('confirmNewPassword')}
        />
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? 'Changing…' : 'Change password'}
        </Button>
      </form>
    </Card>
  );
}
