import { AuthProvider } from './features/auth/AuthContext';
import { AppRouter } from './router';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
