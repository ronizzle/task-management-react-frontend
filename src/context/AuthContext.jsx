import { createContext, useContext, useState, useCallback } from 'react';
import { laravel } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const persistSession = useCallback((data) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('current_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const { data } = await laravel.post('/login', { email, password });
        persistSession(data);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (name, email, password, passwordConfirmation) => {
      setLoading(true);
      try {
        const { data } = await laravel.post('/register', {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });
        persistSession(data);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isTeamMember: user?.role === 'team_member',
    canViewAnalytics: user?.role === 'admin' || user?.role === 'manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
