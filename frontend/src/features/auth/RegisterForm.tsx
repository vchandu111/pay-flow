import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { getApiErrorMessage } from '../../services/apiError';
import { useAuth } from './AuthContext';
import { registerFormSchema, type RegisterFormValues } from './schemas';

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await registerUser(values);
      navigate('/');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to create your account'));
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
