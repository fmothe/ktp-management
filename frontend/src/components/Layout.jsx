import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Swords, 
  BarChart3, 
  LogOut,
  Settings,
  Trophy
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/matches', icon: Swords, label: 'Matches' },
    { to: '/teams', icon: Users, label: 'Teams' },
    { to: '/players', icon: UserCircle, label: 'Players' },
    { to: '/stats', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-600 border-r border-dark-200 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-dark-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-neon">
              <Trophy className="w-6 h-6 text-dark-500" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-primary-400 glow-text">KTP</h1>
              <p className="text-xs text-gray-500 font-mono">DoD 1.3 League</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}

          {/* Admin only - Users */}
          {user?.is_admin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Settings className="w-5 h-5" />
              User Management
            </NavLink>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-dark-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-dark-300 rounded-full flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.is_admin ? 'Admin' : 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
