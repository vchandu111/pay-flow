import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { getApiErrorMessage } from '../../services/apiError';
import { useAuth } from './AuthContext';
import { loginFormSchema, type LoginFormValues } from './schemas';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values);
      navigate('/');
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to log in'));
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
