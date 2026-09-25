import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { LoginForm } from '../features/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-brand-600">PayFlow</h1>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Log in</h2>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:underline">
              Register
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
