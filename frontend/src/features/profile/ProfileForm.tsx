import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { getApiErrorMessage } from '../../services/apiError';
import { updateProfileRequest } from './profileApi';
import { updateProfileFormSchema, type UpdateProfileFormValues } from './schemas';
import type { Profile } from '../auth/types';

interface ProfileFormProps {
  profile: Profile;
  onUpdated: (profile: Profile) => void;
}

export function ProfileForm({ profile, onUpdated }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth ?? '',
      address: profile.address ?? '',
    },
  });

  async function onSubmit(values: UpdateProfileFormValues) {
    setFormError(null);
    try {
      const updated = await updateProfileRequest({
        name: values.name,
        phone: values.phone,
        dateOfBirth: values.dateOfBirth || undefined,
        address: values.address || undefined,
      });
      onUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to update profile'));
    }
  }

  if (!isEditing) {
    return (
      <Card>
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</h2>
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField label="Name" value={profile.name} />
          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Phone" value={profile.phone} />
          <ProfileField label="Date of Birth" value={profile.dateOfBirth ?? '—'} />
          <ProfileField label="Address" value={profile.address ?? '—'} />
        </dl>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Edit Profile</h2>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
        <Input label="Address" error={errors.address?.message} {...register('address')} />
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset();
              setIsEditing(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}
