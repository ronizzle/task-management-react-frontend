import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { TasksList } from './pages/TasksList';
import { TaskDetail } from './pages/TaskDetail';
import { Teams } from './pages/Teams';
import { Users } from './pages/Users';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TasksList />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
            <Route path="/teams" element={<Teams />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  );
}
