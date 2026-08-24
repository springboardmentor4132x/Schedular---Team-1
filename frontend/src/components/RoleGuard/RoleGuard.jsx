/**
 * RoleGuard.jsx
 *
 * Enforces Role-Based Access Control on routes.
 * Redirects or blocks unauthorized roles from accessing role-specific views.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { resolveRole, ROLES } from '../../pages/Dashboard/shared/constants';
import { getDefaultPath } from '../../pages/Dashboard/shared/dashboardRoutes';

export default function RoleGuard({ allowedRoles = [], allowAdmin = true, children }) {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = resolveRole(user?.role);

  // Check if role is directly permitted, or if Administrator has bypass
  const isAuthorized =
    allowedRoles.includes(userRole) || (allowAdmin && userRole === ROLES.ADMIN);

  if (!isAuthorized) {
    const fallback = getDefaultPath(userRole);
    return <Navigate to={fallback} replace />;
  }

  return children ? children : <Outlet />;
}
