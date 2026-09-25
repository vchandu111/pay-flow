import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { RegisterForm } from '../features/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-brand-600">PayFlow</h1>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Create your account</h2>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
