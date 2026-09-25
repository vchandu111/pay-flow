import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';
import { SendMoneyPage } from './pages/SendMoneyPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/wallet',
    element: (
      <ProtectedRoute>
        <WalletPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/send-money',
    element: (
      <ProtectedRoute>
        <SendMoneyPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/beneficiaries',
    element: (
      <ProtectedRoute>
        <BeneficiariesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <TransactionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/transactions/:id',
    element: (
      <ProtectedRoute>
        <TransactionDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
