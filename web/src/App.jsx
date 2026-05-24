import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ManageGroup from './pages/ManageGroup';
import AdminUsers from './pages/AdminUsers';
import AdminGroups from './pages/AdminGroups';
import AdminSubjects from './pages/AdminSubjects';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import JoinGroup from './pages/JoinGroup';
import MiniApp from './pages/MiniApp';
import useAuth from './hooks/useAuth';
import { WebSocketProvider } from './context/WebSocketContext';

import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">{t('common.loading')}</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const AdminRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // Renders the child route elements
};

function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  return (
    <WebSocketProvider>
      <Routes>
        {/* ... (existing routes) ... */}
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/join" element={<JoinGroup />} />
        <Route path="/miniapp" element={<MiniApp />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          {/* Group Admin Routes */}
          <Route element={<AdminRoute allowedRoles={['admin', 'superadmin']} />}>
            <Route path="/manage-group" element={<ManageGroup />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute allowedRoles={['superadmin']} />}>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/groups" element={<AdminGroups />} />
            <Route path="/admin/groups/:id" element={<ManageGroup adminView={true} />} />
          </Route>

          <Route element={<AdminRoute allowedRoles={['admin', 'superadmin']} />}>
            <Route path="/admin/subjects" element={<AdminSubjects />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </WebSocketProvider>
  );
}

export default App;
