import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/wallet', label: 'Wallet' },
  { to: '/send-money', label: 'Send Money' },
  { to: '/beneficiaries', label: 'Beneficiaries' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/profile', label: 'Profile' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-brand-600">PayFlow</span>
          <div className="flex gap-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Log out
        </button>
      </div>
    </nav>
  );
}
