import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../features/auth/AuthContext';
import { ProfileForm } from '../features/profile/ProfileForm';
import { ChangePasswordForm } from '../features/profile/ChangePasswordForm';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-800">Profile</h1>
        <ProfileForm profile={user} onUpdated={setUser} />
        <ChangePasswordForm
          onChanged={() => {
            // The backend already revoked this session's cookies on password change.
            setUser(null);
            navigate('/login');
          }}
        />
      </main>
    </div>
  );
}
