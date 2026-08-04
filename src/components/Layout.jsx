import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
  }`;

export function Layout() {
  const { user, logout, canViewAnalytics, isAdmin, isManager } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-900 mr-4">Task Management</span>
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/tasks" className={linkClass}>
              Tasks
            </NavLink>
            {(isAdmin || isManager) && (
              <NavLink to="/teams" className={linkClass}>
                Teams
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/users" className={linkClass}>
                Users
              </NavLink>
            )}
            {canViewAnalytics && (
              <NavLink to="/analytics" className={linkClass}>
                Analytics
              </NavLink>
            )}
            <NavLink to="/settings" className={linkClass}>
              Settings
            </NavLink>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {user?.name} <span className="text-gray-400">({user?.role})</span>
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1.5"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
