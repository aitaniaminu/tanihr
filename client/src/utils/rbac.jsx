import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requiredPermission }) {
  const { user, hasPermission, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function RoleGuard({ allowedRoles, children, fallback = null }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.roleKey || user?.role;
  const roleKey = user?.roleKey || (user?.role === 'Super Admin' ? 'super_admin' : user?.role === 'HR Manager' ? 'hr_manager' : user?.role === 'Line Manager' ? 'line_manager' : user?.role === 'Executive' ? 'executive' : 'employee');

  if (!allowedRoles.includes(roleKey)) {
    return fallback || <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PermissionGate({ permission, children, fallback = null }) {
  const { hasPermission, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}