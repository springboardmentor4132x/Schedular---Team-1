/**
 * pages/Dashboard/RoleRedirect.jsx
 *
 * Reads the user's role from context and redirects to the correct dashboard.
 * Used when the user lands on /dashboard (old route) — sends them to
 * /business/dashboard, /marketing/dashboard, or /creator/dashboard.
 */

import { Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { resolveRole } from './shared/constants';
import { getDefaultPath } from './shared/dashboardRoutes';

export default function RoleRedirect() {
  const { user } = useApp();
  const role = resolveRole(user?.role);
  return <Navigate to={getDefaultPath(role)} replace />;
}
